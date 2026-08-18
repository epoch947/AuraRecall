import { createDatabaseClient, describeDatabaseTarget } from './lib/database.mjs'

const initiatorId = '5d65ea01-bbb0-4f65-8610-a7488fe2c63a'
const receiverId = 'aec3ce56-cce0-491c-9c65-9a09325e392b'
const legacyInitiatorId = '2b0a0e46-b520-4056-b05e-81006b9f21cd'
const legacyReceiverId = '53708710-eae3-4e86-b912-5f4aa866989b'
const legacyEchoId = '8d82b196-b9d2-464d-9703-6b748755cf29'
const legacyConversationId = '9b73de04-8d1e-4409-8e70-99434156a6a3'
const legacyMessageId = '31b1311c-f52c-4875-b40d-da54330fb114'
const zeroVector = `[${new Array(1536).fill(0).join(',')}]`

async function main() {
  const client = createDatabaseClient('aura-database-smoke-test')
  await client.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `
        INSERT INTO users (
          id,
          auth_provider,
          auth_subject,
          account_type,
          email,
          email_verified_at,
          username
        )
        VALUES
          ($1::uuid, 'clerk', 'smoke-initiator', 'REGISTERED', 'initiator@smoke.test', now(), 'smoke_initiator'),
          ($2::uuid, 'clerk', 'smoke-receiver', 'REGISTERED', 'receiver@smoke.test', now(), 'smoke_receiver')
      `,
      [initiatorId, receiverId],
    )

    const syncedUser = await client.query(
      `
        SELECT username
        FROM users
        WHERE auth_provider = 'clerk' AND auth_subject = 'smoke-initiator'
      `,
    )
    if (syncedUser.rows[0]?.username !== 'smoke_initiator') {
      throw new Error('Authenticated username persistence failed')
    }

    await client.query('SAVEPOINT username_uniqueness_check')
    let duplicateUsernameRejected = false
    try {
      await client.query(
        `
          INSERT INTO users (auth_provider, auth_subject, account_type, username)
          VALUES ('clerk', 'smoke-duplicate', 'REGISTERED', 'SMOKE_INITIATOR')
        `,
      )
    } catch (error) {
      duplicateUsernameRejected = error?.code === '23505'
      await client.query('ROLLBACK TO SAVEPOINT username_uniqueness_check')
    }
    if (!duplicateUsernameRejected) {
      throw new Error('Case-insensitive username uniqueness check failed')
    }
    await client.query('RELEASE SAVEPOINT username_uniqueness_check')

    const echo = await client.query(
      `
        INSERT INTO public_echoes (color, insight, weather, embedding, author_id)
        VALUES ($1, $2, $3, $4::vector, $5::uuid)
        RETURNING id
      `,
      ['#88AA99', 'What made this moment possible?', 'Clear Sky', zeroVector, receiverId],
    )

    const conversation = await client.query(
      `
        INSERT INTO conversations (echo_id, initiator_id, receiver_id)
        VALUES ($1::uuid, $2::uuid, $3::uuid)
        RETURNING id
      `,
      [echo.rows[0].id, initiatorId, receiverId],
    )

    await client.query(
      `
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES ($1::uuid, $2::uuid, $3)
      `,
      [conversation.rows[0].id, initiatorId, 'Database smoke test'],
    )

    const joined = await client.query(
      `
        SELECT c.id
        FROM conversations c
        JOIN public_echoes e ON e.id = c.echo_id
        JOIN messages m ON m.conversation_id = c.id
        WHERE c.id = $1::uuid AND vector_dims(e.embedding) = 1536
      `,
      [conversation.rows[0].id],
    )
    if (joined.rowCount !== 1) throw new Error('Relational/vector smoke query failed')

    await client.query('DELETE FROM conversations WHERE id = $1::uuid', [conversation.rows[0].id])
    const cascade = await client.query(
      'SELECT count(*)::int AS count FROM messages WHERE conversation_id = $1::uuid',
      [conversation.rows[0].id],
    )
    if (cascade.rows[0].count !== 0) throw new Error('Message cascade delete failed')

    const legacyEcho = await client.query(
      `
        INSERT INTO "PublicEcho" (
          id,
          color,
          insight,
          weather,
          resonances,
          embedding,
          "authorId",
          "createdAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::timestamp)
        RETURNING id, embedding
      `,
      [
        legacyEchoId,
        '#778899',
        'Does the compatibility bridge preserve one source of truth?',
        'Cloudy',
        1,
        zeroVector,
        legacyReceiverId,
        '2026-01-01T00:00:00.000Z',
      ],
    )
    if (legacyEcho.rows[0].id !== legacyEchoId) {
      throw new Error('Legacy echo INSERT RETURNING failed')
    }

    await client.query(
      `
        INSERT INTO "Conversation" (
          id,
          "echoId",
          "initiatorId",
          "receiverId",
          status,
          "createdAt",
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, 'PENDING', $5::timestamp, $5::timestamp)
      `,
      [
        legacyConversationId,
        legacyEchoId,
        legacyInitiatorId,
        legacyReceiverId,
        '2026-01-01T00:00:00.000Z',
      ],
    )

    await client.query(
      `
        INSERT INTO "Message" (
          id,
          "conversationId",
          "senderId",
          content,
          "createdAt"
        )
        VALUES ($1, $2, $3, $4, $5::timestamp)
      `,
      [
        legacyMessageId,
        legacyConversationId,
        legacyInitiatorId,
        'Legacy compatibility smoke test',
        '2026-01-01T00:00:00.000Z',
      ],
    )

    await client.query(
      `
        UPDATE "Conversation"
        SET status = 'ACCEPTED', "updatedAt" = $2::timestamp
        WHERE id = $1
      `,
      [legacyConversationId, '2026-01-01T00:01:00.000Z'],
    )

    const compatibility = await client.query(
      `
        SELECT c.status, vector_dims(e.embedding) AS dimensions, count(m.id)::int AS messages
        FROM conversations c
        JOIN public_echoes e ON e.id = c.echo_id
        JOIN messages m ON m.conversation_id = c.id
        WHERE c.id = $1::uuid
        GROUP BY c.status, e.embedding
      `,
      [legacyConversationId],
    )
    if (
      compatibility.rows[0]?.status !== 'ACCEPTED' ||
      compatibility.rows[0]?.dimensions !== 1536 ||
      compatibility.rows[0]?.messages !== 1
    ) {
      throw new Error('Legacy Prisma compatibility bridge failed')
    }

    const legacyUsers = await client.query(
      `
        SELECT count(*)::int AS count
        FROM users
        WHERE id = ANY($1::uuid[]) AND account_type = 'LEGACY_GUEST'
      `,
      [[legacyInitiatorId, legacyReceiverId]],
    )
    if (legacyUsers.rows[0].count !== 2) {
      throw new Error('Legacy identity compatibility bridge failed')
    }

    await client.query('DELETE FROM "Conversation" WHERE id = $1', [legacyConversationId])
    await client.query('DELETE FROM "PublicEcho" WHERE id = $1', [legacyEchoId])

    console.log(`Database smoke test passed: ${describeDatabaseTarget()}`)
  } finally {
    await client.query('ROLLBACK').catch(() => undefined)
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
