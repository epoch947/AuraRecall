-- Temporary compatibility layer for the currently deployed Prisma application.
-- The refactored application writes directly to the snake_case tables created by
-- 001_native_postgresql.sql. These views keep the old Prisma model/table contract
-- working during the deployment cutover without creating a second source of truth.

CREATE VIEW "PublicEcho" AS
SELECT
  id::text AS id,
  color,
  insight,
  weather,
  resonances,
  CASE
    WHEN embedding IS NULL THEN NULL
    ELSE (embedding::text)::jsonb
  END AS embedding,
  author_id::text AS "authorId",
  created_at AT TIME ZONE 'UTC' AS "createdAt"
FROM public_echoes;

CREATE VIEW "Conversation" AS
SELECT
  id::text AS id,
  echo_id::text AS "echoId",
  initiator_id::text AS "initiatorId",
  receiver_id::text AS "receiverId",
  status,
  created_at AT TIME ZONE 'UTC' AS "createdAt",
  updated_at AT TIME ZONE 'UTC' AS "updatedAt"
FROM conversations;

CREATE VIEW "Message" AS
SELECT
  id::text AS id,
  conversation_id::text AS "conversationId",
  sender_id::text AS "senderId",
  content,
  created_at AT TIME ZONE 'UTC' AS "createdAt"
FROM messages;

CREATE OR REPLACE FUNCTION legacy_public_echo_write()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  stored public_echoes%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public_echoes
    WHERE id = OLD.id::uuid;

    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
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
    VALUES (
      COALESCE(NULLIF(NEW.id, '')::uuid, gen_random_uuid()),
      NEW.color,
      NEW.insight,
      NEW.weather,
      COALESCE(NEW.resonances, 0),
      CASE WHEN NEW.embedding IS NULL THEN NULL ELSE NEW.embedding::text::vector END,
      CASE WHEN NEW."authorId" IS NULL THEN NULL ELSE NEW."authorId"::uuid END,
      COALESCE(NEW."createdAt" AT TIME ZONE 'UTC', now())
    )
    RETURNING * INTO stored;
  ELSE
    UPDATE public_echoes
    SET
      id = NEW.id::uuid,
      color = NEW.color,
      insight = NEW.insight,
      weather = NEW.weather,
      resonances = NEW.resonances,
      embedding = CASE
        WHEN NEW.embedding IS NULL THEN NULL
        ELSE NEW.embedding::text::vector
      END,
      author_id = CASE WHEN NEW."authorId" IS NULL THEN NULL ELSE NEW."authorId"::uuid END,
      created_at = NEW."createdAt" AT TIME ZONE 'UTC'
    WHERE id = OLD.id::uuid
    RETURNING * INTO stored;
  END IF;

  NEW.id := stored.id::text;
  NEW.color := stored.color;
  NEW.insight := stored.insight;
  NEW.weather := stored.weather;
  NEW.resonances := stored.resonances;
  NEW.embedding := CASE
    WHEN stored.embedding IS NULL THEN NULL
    ELSE (stored.embedding::text)::jsonb
  END;
  NEW."authorId" := stored.author_id::text;
  NEW."createdAt" := stored.created_at AT TIME ZONE 'UTC';

  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION legacy_conversation_write()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  stored conversations%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM conversations
    WHERE id = OLD.id::uuid;

    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO conversations (
      id,
      echo_id,
      initiator_id,
      receiver_id,
      status,
      created_at,
      updated_at
    )
    VALUES (
      COALESCE(NULLIF(NEW.id, '')::uuid, gen_random_uuid()),
      NEW."echoId"::uuid,
      NEW."initiatorId"::uuid,
      NEW."receiverId"::uuid,
      COALESCE(NEW.status, 'PENDING'),
      COALESCE(NEW."createdAt" AT TIME ZONE 'UTC', now()),
      COALESCE(NEW."updatedAt" AT TIME ZONE 'UTC', now())
    )
    RETURNING * INTO stored;
  ELSE
    UPDATE conversations
    SET
      id = NEW.id::uuid,
      echo_id = NEW."echoId"::uuid,
      initiator_id = NEW."initiatorId"::uuid,
      receiver_id = NEW."receiverId"::uuid,
      status = NEW.status,
      created_at = NEW."createdAt" AT TIME ZONE 'UTC',
      updated_at = NEW."updatedAt" AT TIME ZONE 'UTC'
    WHERE id = OLD.id::uuid
    RETURNING * INTO stored;
  END IF;

  NEW.id := stored.id::text;
  NEW."echoId" := stored.echo_id::text;
  NEW."initiatorId" := stored.initiator_id::text;
  NEW."receiverId" := stored.receiver_id::text;
  NEW.status := stored.status;
  NEW."createdAt" := stored.created_at AT TIME ZONE 'UTC';
  NEW."updatedAt" := stored.updated_at AT TIME ZONE 'UTC';

  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION legacy_message_write()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  stored messages%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM messages
    WHERE id = OLD.id::uuid;

    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO messages (
      id,
      conversation_id,
      sender_id,
      content,
      created_at
    )
    VALUES (
      COALESCE(NULLIF(NEW.id, '')::uuid, gen_random_uuid()),
      NEW."conversationId"::uuid,
      NEW."senderId"::uuid,
      NEW.content,
      COALESCE(NEW."createdAt" AT TIME ZONE 'UTC', now())
    )
    RETURNING * INTO stored;
  ELSE
    UPDATE messages
    SET
      id = NEW.id::uuid,
      conversation_id = NEW."conversationId"::uuid,
      sender_id = NEW."senderId"::uuid,
      content = NEW.content,
      created_at = NEW."createdAt" AT TIME ZONE 'UTC'
    WHERE id = OLD.id::uuid
    RETURNING * INTO stored;
  END IF;

  NEW.id := stored.id::text;
  NEW."conversationId" := stored.conversation_id::text;
  NEW."senderId" := stored.sender_id::text;
  NEW.content := stored.content;
  NEW."createdAt" := stored.created_at AT TIME ZONE 'UTC';

  RETURN NEW;
END
$function$;

CREATE TRIGGER legacy_public_echo_write_trigger
INSTEAD OF INSERT OR UPDATE OR DELETE ON "PublicEcho"
FOR EACH ROW
EXECUTE FUNCTION legacy_public_echo_write();

CREATE TRIGGER legacy_conversation_write_trigger
INSTEAD OF INSERT OR UPDATE OR DELETE ON "Conversation"
FOR EACH ROW
EXECUTE FUNCTION legacy_conversation_write();

CREATE TRIGGER legacy_message_write_trigger
INSTEAD OF INSERT OR UPDATE OR DELETE ON "Message"
FOR EACH ROW
EXECUTE FUNCTION legacy_message_write();
