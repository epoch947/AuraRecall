CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public_echoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color text NOT NULL CONSTRAINT public_echoes_color_not_blank CHECK (btrim(color) <> ''),
  insight text NOT NULL CONSTRAINT public_echoes_insight_not_blank CHECK (btrim(insight) <> ''),
  weather text NOT NULL CONSTRAINT public_echoes_weather_not_blank CHECK (btrim(weather) <> ''),
  resonances integer NOT NULL DEFAULT 0 CONSTRAINT public_echoes_resonances_nonnegative CHECK (resonances >= 0),
  embedding vector(1536),
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  echo_id uuid NOT NULL REFERENCES public_echoes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  initiator_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_distinct_participants CHECK (initiator_id <> receiver_id),
  CONSTRAINT conversations_status_valid CHECK (status IN ('PENDING', 'ACCEPTED'))
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messages_content_length CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000)
);

-- Preserve rows if this migration is applied to the legacy Prisma schema.
DO $migration$
BEGIN
  IF to_regclass('public."PublicEcho"') IS NOT NULL THEN
    INSERT INTO public_echoes (
      id,
      color,
      insight,
      weather,
      resonances,
      embedding,
      author_id,
      created_at
    )
    SELECT
      id::uuid,
      color,
      insight,
      weather,
      resonances,
      CASE WHEN embedding IS NULL THEN NULL ELSE embedding::text::vector END,
      CASE WHEN "authorId" IS NULL THEN NULL ELSE "authorId"::uuid END,
      "createdAt" AT TIME ZONE 'UTC'
    FROM "PublicEcho"
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF to_regclass('public."Conversation"') IS NOT NULL THEN
    INSERT INTO conversations (
      id,
      echo_id,
      initiator_id,
      receiver_id,
      status,
      created_at,
      updated_at
    )
    SELECT
      id::uuid,
      "echoId"::uuid,
      "initiatorId"::uuid,
      "receiverId"::uuid,
      CASE WHEN status IN ('PENDING', 'ACCEPTED') THEN status ELSE 'PENDING' END,
      "createdAt" AT TIME ZONE 'UTC',
      "updatedAt" AT TIME ZONE 'UTC'
    FROM "Conversation"
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF to_regclass('public."Message"') IS NOT NULL THEN
    INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
    SELECT
      id::uuid,
      "conversationId"::uuid,
      "senderId"::uuid,
      content,
      "createdAt" AT TIME ZONE 'UTC'
    FROM "Message"
    ON CONFLICT (id) DO NOTHING;
  END IF;
END
$migration$;

DROP TABLE IF EXISTS "Message";
DROP TABLE IF EXISTS "Conversation";
DROP TABLE IF EXISTS "PublicEcho";

CREATE INDEX IF NOT EXISTS public_echoes_created_at_idx
  ON public_echoes (created_at DESC);

CREATE INDEX IF NOT EXISTS conversations_initiator_updated_at_idx
  ON conversations (initiator_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS conversations_receiver_updated_at_idx
  ON conversations (receiver_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS conversations_echo_id_idx
  ON conversations (echo_id);

CREATE INDEX IF NOT EXISTS messages_conversation_created_at_idx
  ON messages (conversation_id, created_at ASC);
