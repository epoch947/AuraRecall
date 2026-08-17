CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider text NOT NULL CONSTRAINT users_auth_provider_not_blank CHECK (btrim(auth_provider) <> ''),
  auth_subject text NOT NULL CONSTRAINT users_auth_subject_not_blank CHECK (btrim(auth_subject) <> ''),
  account_type text NOT NULL DEFAULT 'REGISTERED',
  email text,
  email_verified_at timestamptz,
  username text,
  display_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'USER',
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  deleted_at timestamptz,
  CONSTRAINT users_auth_identity_unique UNIQUE (auth_provider, auth_subject),
  CONSTRAINT users_account_type_valid CHECK (account_type IN ('REGISTERED', 'LEGACY_GUEST')),
  CONSTRAINT users_role_valid CHECK (role IN ('USER', 'ADMIN', 'MODERATOR')),
  CONSTRAINT users_status_valid CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
  CONSTRAINT users_email_not_blank CHECK (email IS NULL OR btrim(email) <> ''),
  CONSTRAINT users_username_valid CHECK (
    username IS NULL OR (btrim(username) <> '' AND char_length(username) BETWEEN 4 AND 64)
  )
);

CREATE UNIQUE INDEX users_email_lower_unique
  ON users (lower(email))
  WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX users_username_lower_unique
  ON users (lower(username))
  WHERE username IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX users_created_at_idx ON users (created_at DESC);

CREATE TABLE auth_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Preserve historical browser-generated identities as non-authenticatable legacy
-- users before adding foreign keys. They can remain attached to old content, but
-- they can never establish a Clerk session or access authenticated routes.
WITH legacy_user_ids AS (
  SELECT author_id AS id FROM public_echoes WHERE author_id IS NOT NULL
  UNION
  SELECT initiator_id AS id FROM conversations
  UNION
  SELECT receiver_id AS id FROM conversations
  UNION
  SELECT sender_id AS id FROM messages
)
INSERT INTO users (id, auth_provider, auth_subject, account_type)
SELECT id, 'legacy', id::text, 'LEGACY_GUEST'
FROM legacy_user_ids
ON CONFLICT (id) DO NOTHING;

-- The legacy Prisma views remain available during the deployment rollback window.
-- These view-only triggers register any browser UUID written by the previous build
-- before the native table foreign keys are checked.
CREATE OR REPLACE FUNCTION legacy_public_echo_identity_reference()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW."authorId" IS NOT NULL THEN
    INSERT INTO users (id, auth_provider, auth_subject, account_type)
    VALUES (NEW."authorId"::uuid, 'legacy', NEW."authorId", 'LEGACY_GUEST')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION legacy_conversation_identity_reference()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO users (id, auth_provider, auth_subject, account_type)
  VALUES
    (NEW."initiatorId"::uuid, 'legacy', NEW."initiatorId", 'LEGACY_GUEST'),
    (NEW."receiverId"::uuid, 'legacy', NEW."receiverId", 'LEGACY_GUEST')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION legacy_message_identity_reference()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO users (id, auth_provider, auth_subject, account_type)
  VALUES (NEW."senderId"::uuid, 'legacy', NEW."senderId", 'LEGACY_GUEST')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END
$function$;

CREATE TRIGGER legacy_00_public_echo_identity_reference_trigger
INSTEAD OF INSERT OR UPDATE ON "PublicEcho"
FOR EACH ROW
EXECUTE FUNCTION legacy_public_echo_identity_reference();

CREATE TRIGGER legacy_00_conversation_identity_reference_trigger
INSTEAD OF INSERT OR UPDATE ON "Conversation"
FOR EACH ROW
EXECUTE FUNCTION legacy_conversation_identity_reference();

CREATE TRIGGER legacy_00_message_identity_reference_trigger
INSTEAD OF INSERT OR UPDATE ON "Message"
FOR EACH ROW
EXECUTE FUNCTION legacy_message_identity_reference();

ALTER TABLE public_echoes
  ADD CONSTRAINT public_echoes_author_user_fk
  FOREIGN KEY (author_id) REFERENCES users(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_initiator_user_fk
  FOREIGN KEY (initiator_id) REFERENCES users(id)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_receiver_user_fk
  FOREIGN KEY (receiver_id) REFERENCES users(id)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE messages
  ADD CONSTRAINT messages_sender_user_fk
  FOREIGN KEY (sender_id) REFERENCES users(id)
  ON UPDATE CASCADE ON DELETE RESTRICT;
