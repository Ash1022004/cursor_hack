# Sehat-Saathi (healthcare platform)

Digital psychological interventions for college students, extended with general healthcare tools (symptom guidance, medicine reference, appointment requests, label OCR demo).

## Disclaimer

This platform provides general medical information and is not a substitute for professional medical advice.

## New API routes (Next.js)

| Route | Method | Purpose |
|--------|--------|---------|
| `/api/symptom-check` | POST | Symptoms + demographics → possible conditions, generic OTC ideas, advice (OpenAI optional, else rule-based) |
| `/api/medicines` | GET `?q=` | Search static `data/medicines.json` |
| `/api/appointments` | GET, POST | JSON file store at `data/appointments.json` (gitignored) |
| `/api/verify-medicine` | POST `multipart/form-data` field `image` | Tesseract OCR + match to dataset |

Convex-backed routes (`/api/auth/*`, `/api/sticky-notes`, `/api/user/*`, `/api/admin/*`, etc.) are **proxied only for those paths** when `CONVEX_SITE_URL` is set. Other `/api/*` handlers run in Next.js.

## How to run

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set `CONVEX_SITE_URL` if you use Convex for auth/chat.
3. Optional: `OPENAI_API_KEY` for AI-assisted symptom check (otherwise rule-based).
4. Dev server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) — **Health tools** live at `/health`.

## Dependencies (added)

- `tesseract.js` — server-side OCR for `/api/verify-medicine`

## Scripts

- `npm run dev` — Next.js + Turbopack
- `npm run build` / `npm start` — production
- `npm run convex:dev` — Convex dev (if used)
