# Sehat Sathi — deployment

## Stack

- **Next.js 15** (App Router) in `src/app`.
- **Convex** (`convex/`) — database, HTTP `/api/*`, **patient AI** (Gemini default, OpenAI optional), **Exa + Apify** search for the resource agent. **No FastAPI** for core chat.
- **Clerk** — counsellor and admin routes (`/counsellor`, `/admin`). Set `publicMetadata.role` to `"admin"` for admins in the Clerk dashboard.
- **JWT** (Convex `JWT_SECRET`) — optional legacy **student** login (`/login`, `/register`).

## Environment variables

### Next.js (`.env.local`)

| Variable | Purpose |
| -------- | ------- |
| `CONVEX_SITE_URL` | Deployment **HTTP** base (`https://….convex.site`) for `/api` rewrites |
| `NEXT_PUBLIC_CONVEX_URL` | Deployment **`.convex.cloud`** URL for Convex React (`useAction`, `useMutation`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk |
| `CLERK_SECRET_KEY` | Clerk |

### Convex dashboard (Settings → Environment variables)

| Variable | Purpose |
| -------- | ------- |
| `JWT_SECRET` | Student JWT auth (HTTP routes) — **required** for `/api/auth/login` and any route that calls `signJwt` |

Set it from the repo (dev deployment):

```bash
npx convex env set JWT_SECRET "$(openssl rand -base64 32 | tr -d '\n')"
```

Putting `JWT_SECRET` only in Next’s `.env.local` does **not** work: Convex actions read **`process.env` on the Convex side**, which comes from the dashboard / `convex env set`, not from Next.
| `GEMINI_API_KEY` | Default LLM (Gemini) |
| `OPENAI_API_KEY` | Optional; used when `LLM_PROVIDER=openai` |
| `LLM_PROVIDER` | `gemini` (default) or `openai` |
| `GEMINI_MODEL` | Optional override (default `gemini-2.5-flash`) |
| `OPENAI_MODEL` | Optional override (default `gpt-4o`) |
| `EXA_API_KEY` | Semantic search for resource agent |
| `APIFY_TOKEN` | Apify Google Search (or custom actor) for web results |
| `APIFY_GOOGLE_SEARCH_ACTOR_ID` | Optional; default `apify/google-search-scraper` |

Remove reliance on **`CHATBOT_SERVICE_URL`** / **`CHATBOT_API_KEY`** for the main chat flow.

## Local development

1. `npm install` (use `npm install --legacy-peer-deps` if Clerk peer conflicts with your React version).
2. `npx convex dev` — links deployment and updates `.env.local` entries from Convex where applicable.
3. Set variables above in Convex dashboard and `.env.local`.
4. **Helplines seed (once):**  
   `npx convex run internal/helplines:seedHelplinesOnce '{}'`
5. **Demo users (JWT students / legacy):** see commands in `convex/seed.ts`.
6. `npm run dev` — app at `http://localhost:3000`. Anonymous chat: **`/saathi`** → **`/chat`**. Staff: **`/sign-in`** → **`/admin`** or **`/counsellor`**.

## Flows

- **Anonymous patient:** `localStorage.saathi_id` + Convex `patients` / `sessions` / `moodLogs`; chat via `useAction(api.patientChat.sendMessage)`.
- **Logged-in student (JWT):** floating chat uses `/api/user/chat/ai` with `anonymousId` = `jwt:<userId>` on the server; optional `sessionId` in body (stored in `localStorage.saathi_jwt_session_id`).
- **Staff:** Clerk; `CounsellorClerkGate` upserts `counsellors` by `clerkUserId`.

## Vercel

- Set the same Next.js env vars.
- Run `npx convex deploy` for production Convex; point `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_SITE_URL` at that deployment.
