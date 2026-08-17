# AuraRecall

AuraRecall is a multimodal journaling experience built with the Next.js App Router. It turns a private journal entry into a visual echo, lets users inspect recurring emotional patterns, and supports pseudonymous resonance around intentionally shared echoes.

## Architecture

The repository follows a feature-first structure. Route files stay small, browser code lives with the feature that owns it, and server-only integrations are isolated from the client bundle.

| Directory             | Responsibility                                                 |
| --------------------- | -------------------------------------------------------------- |
| `app/`                | Routes, layouts, loading/error boundaries, and HTTP adapters   |
| `features/identity/`  | Clerk sign-in state and account controls                       |
| `features/journal/`   | Ritual UI, journal state, visualization, and request contracts |
| `features/resonance/` | Shared echo pool UI and contracts                              |
| `features/messaging/` | Anonymous inbox UI and contracts                               |
| `server/auth/`        | Session-to-database user resolution and account policy         |
| `server/ai/`          | OpenAI client, prompts, generation, and embedding persistence  |
| `server/db/`          | PostgreSQL pool, transactions, models, and repositories        |
| `server/messaging/`   | Conversation authorization and persistence                     |
| `server/resonance/`   | Public echo queries and writes                                 |
| `server/weather/`     | Geolocation and weather-provider integration                   |
| `database/`           | Versioned PostgreSQL migrations                                |

The main request flow is:

```text
UI component -> app/api route -> Zod contract -> server service -> provider/database
```

Server Components fetch initial server-owned data when possible. Interactive components and Zustand persistence remain client-side. Server modules import `server-only` to prevent accidental inclusion in browser bundles. Database access uses parameterized SQL through `node-postgres`; SQL stays inside repositories, while services own authorization and transaction orchestration.

### PostgreSQL model

| Table                 | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `users`               | App-owned profile, optional username, Clerk subject, role/status |
| `public_echoes`       | Public AI output, registered author FK, and `vector(1536)`       |
| `conversations`       | Authorized participant pair, referenced echo, and status         |
| `messages`            | Ordered messages with sender and cascading conversation FKs      |
| `auth_webhook_events` | Idempotency ledger for Clerk user synchronization                |
| `schema_migrations`   | Immutable migration IDs, checksums, and application time         |

Primary keys use native PostgreSQL UUIDs, timestamps use `timestamptz`, and database checks enforce valid account and conversation states, distinct participants, nonnegative resonance counts, and message length. Multi-write messaging operations use one checked-out connection and an explicit transaction.

Migration `002_legacy_prisma_compatibility.sql` temporarily exposes writable legacy views for the currently deployed Prisma build. Both old and new application versions therefore use the native tables as a single source of truth during cutover. Remove those views in a follow-up migration only after the refactored application is deployed everywhere.

## Routes

- `/` — journaling ritual
- `/debug` — individual ritual phases for development
- `/resonance` — pseudonymous public echo pool
- `/sign-in` and `/sign-up` — Clerk authentication flows
- `/inbox` — authenticated pseudonymous conversations
- `/api/webhooks/clerk` — verified Clerk user lifecycle synchronization

Route groups such as `(ritual)` and `(social)` organize layouts without changing public URLs.

## Local development

1. Install dependencies with `npm install`.
2. Create a Clerk application, enable the desired sign-in methods, and copy the keys into `.env`.
3. Copy the remaining values from `.env.example` into `.env`.
4. Check migration state with `npm run db:status`.
5. Apply pending migrations with `npm run db:migrate`.
6. Start the app with `npm run dev`.

`USE_MOCK_API=true` runs the generative flows without OpenAI calls. A PostgreSQL connection is still required for database-backed resonance and messaging screens.

### Environment variables

| Variable                            | Purpose                                       |
| ----------------------------------- | --------------------------------------------- |
| `USE_MOCK_API`                      | Select mock AI and weather responses          |
| `OPENAI_API_KEY`                    | Text, image, and embedding generation         |
| `DATABASE_URL`                      | Pooled, TLS-enabled PostgreSQL connection URL |
| `DATABASE_POOL_MAX`                 | Maximum connections per application instance  |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser-safe Clerk application key            |
| `CLERK_SECRET_KEY`                  | Server-side Clerk API key                     |
| `CLERK_WEBHOOK_SIGNING_SECRET`      | Verifies Clerk webhook signatures             |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`     | Application sign-in route                     |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`     | Application sign-up route                     |

See [`docs/authentication.md`](docs/authentication.md) for the Clerk dashboard, webhook, migration, and Vercel rollout steps.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run db:status
npm run db:smoke
```

Use `npm run check` for the first three checks together. `npm run format:check` verifies repository formatting, and `npm run format` applies it.

## Development conventions

- Add product behavior under the feature that owns it; avoid a generic catch-all `components` or `utils` directory.
- Keep Route Handlers focused on parsing, status codes, and service orchestration.
- Define external request and response shapes with Zod at the feature boundary.
- Pass minimal serializable data from Server Components to Client Components.
- Keep provider SDKs, secrets, PostgreSQL access, and prompts in `server/` modules.
- Version persistent browser storage and provide a migration for stored state changes.
- Keep SQL parameterized and isolated in `server/db/repositories/`.
- Use `withTransaction` when multiple writes must succeed atomically.
- Add an immutable migration under `database/migrations/` for every production schema change.

## Identity and privacy

Clerk provides authentication and Google OAuth/OIDC. PostgreSQL remains the authorization source of truth: the server maps the signed session to an internal `users.id`, validates account status, derives message participants from database relationships, and checks conversation membership at the resource boundary. Clerk usernames are synchronized only as optional profile data and are never trusted as session identity. Browser requests never choose participant or sender IDs, and API responses expose viewer-relative flags instead of other users' internal identifiers.

Raw journal text is sent to OpenAI for generation and embeddings. Public persistence stores the generated color, reflective question, weather, embedding, and internal author reference; it does not store the raw journal text. Historical browser UUIDs are retained as non-authenticatable `LEGACY_GUEST` rows so older data remains referentially valid.

The private Memory Archive remains local to the browser and is namespaced by the current Clerk user. Signing out or switching accounts resets the active journal state before loading the new account's local archive, preventing cross-account leakage on a shared browser.
