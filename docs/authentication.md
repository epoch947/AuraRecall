# Authentication rollout

AuraRecall uses Clerk for authentication and PostgreSQL for application users and authorization. Clerk owns credentials, OAuth handshakes, sessions, and account recovery. The application owns the stable internal user ID, role, status, public echoes, conversations, and messages.

Clerk usernames are synchronized as optional profile data. PostgreSQL never uses a username to authenticate a request: every session is mapped by the immutable Clerk user ID. Because username is not required in the current Clerk configuration, Google and email users may have `username = NULL`; non-null usernames are constrained to 4-64 characters and are unique case-insensitively.

## 1. Configure Clerk

1. Create a Clerk application for AuraRecall. If using the Vercel Marketplace integration, connect it to the same Vercel project.
2. Enable Google as a social connection. Clerk's shared development credentials are sufficient for local and preview testing; configure project-owned Google OAuth credentials before the production launch.
3. Keep an email-based method enabled as a recovery or fallback option if that matches the product policy.
4. Add the local, preview, and production domains as allowed origins/redirect destinations in Clerk.

## 2. Configure environment variables

Set these values locally and for the Vercel Preview and Production environments:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SIGNING_SECRET
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

Use the keys from the matching Clerk instance. Do not use development keys in the production Vercel environment.

## 3. Create the webhook

Create a Clerk webhook endpoint at:

```text
https://<deployment-domain>/api/webhooks/clerk
```

Subscribe to `user.created`, `user.updated`, `user.deleted`, and `session.created`. Copy that endpoint's signing secret to `CLERK_WEBHOOK_SIGNING_SECRET` in the matching Vercel environment. The route verifies every signature and records event IDs so a retry cannot be processed twice. `session.created` advances `users.last_login_at` on every successful sign-in, including when session and user webhooks arrive out of order.

For local webhook testing, expose the local server through a trusted HTTPS tunnel and create a separate development endpoint whose secret is stored only in the local `.env` file.

## 4. Apply the database migration

Run the migration before deploying application code that queries the `users` table:

```bash
npm run db:status
npm run db:migrate
npm run db:smoke
```

Migration `003_authenticated_users.sql` creates the user and webhook-event tables, stores the optional Clerk username, backfills historical UUIDs as `LEGACY_GUEST`, and adds user foreign keys. It also keeps the prior Prisma compatibility views writable during the rollback window.

Use a Preview database branch first. After the preview sign-up, login, journaling, whisper, reply, webhook update, and logout flows pass, repeat the migration and environment setup for Production, then promote the verified deployment.

Existing archives under the old unscoped browser key are intentionally not attached to the first account that signs in: there is no trustworthy mapping from an anonymous browser archive to a Clerk user. The old local value is not deleted, but the authenticated application only loads user-scoped archive keys.

## 5. Acceptance checks

- Signed-out visitors can view the landing page and resonance pool, but cannot open the inbox or call protected AI and messaging APIs.
- Google sign-up creates one Clerk user and one `users` row with `account_type = 'REGISTERED'`.
- Setting or changing a Clerk username is reflected in `users.username`; users without one remain valid.
- Signing in advances `users.last_login_at` without creating a duplicate user.
- A signed-in journal entry can create an echo associated with the internal PostgreSQL user ID.
- A whisper derives its receiver from the echo author; request bodies containing participant IDs are rejected.
- Only conversation participants can list, open, or reply to a conversation.
- Signing out removes access to `/inbox`.
- Updating or deleting a Clerk user is reflected through a verified, idempotent webhook.
