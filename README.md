# Sehat-Saathi (healthcare platform)

Digital psychological interventions for college students, extended with general healthcare tools (symptom guidance, medicine reference, appointment requests, label verification).

## Disclaimer

This platform provides general medical information and is not a substitute for professional medical advice.

## New API routes (Next.js)

| Route | Method | Purpose |
|--------|--------|---------|
| `/api/symptom-check` | POST | Convex `symptomCheckRag.runRag`: Exa + ephemeral embeddings + Gemini (sources). Fallback: local rules / OpenAI. |
| `/api/medicines` | GET `?q=` | Convex `medicines.explain`: DB then Exa + Gemini. Fallback: `data/medicines.json`. |
| `/api/appointments` | GET, POST | Convex guest appointments or external provider when configured. |
| `/api/verify-medicine` | POST `multipart/form-data` field `image` | Gemini Vision + Convex `matchBestMedicine` + expiry status. |

Convex-backed routes (`/api/auth/*`, `/api/sticky-notes`, `/api/user/*`, `/api/admin/*`, etc.) are **proxied only for those paths** when `CONVEX_SITE_URL` is set. Other `/api/*` handlers run in Next.js.

## How to run

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_CONVEX_URL` (and `GEMINI_API_KEY` for verify-medicine).
3. Convex dashboard: set `EXA_API_KEY`, `GEMINI_API_KEY`, optional `GEMINI_EMBEDDING_MODEL` for symptom RAG.
4. Seed medicines: `npm run convex:seed-medicines` (after `npx convex dev` / deploy linked).
5. Dev server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000) — **Health tools** live at `/health`.

## Scripts

- `npm run dev` — Next.js + Turbopack
- `npm run build` / `npm start` — production
- `npm run convex:dev` — Convex dev (if used)
- `npm run convex:seed-medicines` — upsert `data/medicines.json` into Convex
