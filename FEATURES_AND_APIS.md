# Sehat Saathi — Features, Tools & API Reference

> Which portal page / chat tool uses which external API, Convex function, or internal service.

---

## 1. Portal Tools (standalone pages)

### 1.1 Symptom Check — `/symptom-check`
**What it does:** Multi-step form (symptoms + age + duration) → possible conditions + suggested OTC medicines + advice.

| Layer | Detail |
|---|---|
| Next API route | `POST /api/symptom-check` |
| Convex action | `api.symptomCheckRag.runRag` |
| External — Exa | Semantic search over MedlinePlus, Mayo Clinic, WHO, NHS (`EXA_API_KEY`) |
| External — LLM | Gemini (`GEMINI_API_KEY`) or OpenAI (`OPENAI_API_KEY`) for JSON synthesis |
| Internal lib | `convex/lib/embeddings.ts` — `embedMany()`, `topKBySimilarity()` for chunk ranking |
| Fallback | `src/lib/symptomCheck.ts` — rule-based lookup if RAG fails |

**Returns:** `possible_conditions[]`, `suggested_medicines[]`, `advice`, `sources[]`, `disclaimer`

---

### 1.2 Medicine Information — `/medicines`
**What it does:** Search bar → medicine uses, dosage, side-effects, precautions. DB-first; live Exa fallback.

| Layer | Detail |
|---|---|
| Next API route | `GET /api/medicines?q=<name>` |
| Convex action | `api.medicines.explain` |
| Convex query | `api.medicinesDb.searchMedicinesPublic` (full-text search on `medicines` table) |
| External — Exa | Live fallback: MedlinePlus, Mayo Clinic, WHO, NIH, CDSCO (`EXA_API_KEY`) |
| External — LLM | Synthesises Exa results into structured JSON (`GEMINI_API_KEY` / `OPENAI_API_KEY`) |

**Returns:** `results[]` (medicine objects), `fromCache`, `sources[]`

---

### 1.3 Verify Medicine Label — `/verify-medicine`
**What it does:** Upload medicine packaging photo → OCR extract name/expiry → match to DB → report expired/verified/not-found.

| Layer | Detail |
|---|---|
| Next API route | `POST /api/verify-medicine` (multipart form-data) |
| External — Gemini Vision | `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-2.5-flash`) |
| Convex query | `api.medicinesDb.matchBestMedicine` — fuzzy match extracted name |
| Internal lib | `src/lib/verifyMedicineVision.ts` — `extractLabelFromImage()`, `parseExpiryToDate()`, `isExpiryInPast()` |

**Returns:** `status` (verified / expired / not_found), extracted label fields, matched medicine info

---

### 1.4 Appointments — `/appointments`
**What it does:** Book an appointment with a registered portal counsellor.

| Layer | Detail |
|---|---|
| Convex query | `api.adminAnalytics.listCounsellorsPublic` — fetches portal counsellors from `users` table |
| Convex mutation | `api.guestAppointments.createGuest` — saves appointment with `counsellorId` to `appointments` table |

**Note:** External hospital search has been moved to the Hospital Finder tool (see 1.5).

---

### 1.5 Hospital Finder — `/health/hospitals`
**What it does:** Search / find-nearby hospitals; expand any card to see doctors + specialties + how to book.

| Layer | Detail |
|---|---|
| Next API route | `GET /api/apify/hospitals` → proxies to Convex |
| Convex internal action | `api.hospitalsNode.fetchApifyHospitals` — runs Apify actor or reads dataset |
| External — Apify | Google Maps scraper: `APIFY_API_KEY`, `APIFY_HOSPITAL_DATASET_ID` or `APIFY_HOSPITAL_ACTOR_ID` |
| Next API route | `GET /api/appointments/doctors?hospitalId=<id>` |
| External — Appointment Provider | Optional: `HEALTH_APPOINTMENTS_API_URL`, `HEALTH_APPOINTMENTS_API_KEY` |
| Internal lib | `src/lib/apifyHospitals.ts` — `fetchHospitals()`, `mapRawApifyItemToHospital()` |

**Doctor cards show:** name, specialty, department. "Book Appointment" links to `/appointments` (portal only).

---

### 1.6 Mental Health Resources — `/resources`
**What it does:** Search articles by topic (anxiety, depression, exam stress…); browse curated resources.

| Layer | Detail |
|---|---|
| Convex action | `api.resources.searchResources` — cache-first (7-day TTL), live Exa fallback |
| Convex query | `api.resourcesDb.listTopics` — chip suggestions from cached topics |
| External — Exa | Trusted domains: NIMHANS, Healthline, Verywell Mind, Psychology Today, Mayo Clinic, WHO, NHS, HelpGuide (`EXA_API_KEY`) |
| Convex mutation | `api.resourcesDb.upsertResources` — caches fresh Exa results |

---

### 1.7 Health Tools Hub — `/health`
Navigation landing page. No external APIs. Links to all tools above + Relax & Reset (breathing exercise on home page).

---

### 1.8 Dashboard — `/dashboard` *(authenticated)*
**What it does:** Progress overview, intervention modules, recent activity, profile completion.

| Layer | Detail |
|---|---|
| Convex query | `api.dashboard.getOverview` — mood history, session count, crisis flag, recent sessions |
| Convex query | `api.users.getProfile` — profile fields for completion % widget |
| Convex mutation | `api.users.updateProfile` — save optional profile fields |

---

### 1.9 Admin Dashboard — `/admin` *(role: admin)*
| Layer | Detail |
|---|---|
| Convex queries | `api.adminAnalytics.getAdminOverview`, `listAllPatients`, `listAllAppointments`, `listCounsellorsPublic` |
| Convex actions | `api.adminCounsellors.createAsAdmin`, `updateAsAdmin`, `deleteAsAdmin` |

---

### 1.10 Doctor Dashboard — `/doctor` *(role: counsellor)*
| Layer | Detail |
|---|---|
| Convex queries | `api.doctorDashboard.getDoctorOverview`, `getMyAppointments`, `getMyPatients`, `getPatientDetail` |
| Convex mutation | `api.doctorDashboard.updateAppointmentStatus` |

**Patient data forwarded to doctor:** conditions, medications, triggers, coping patterns, crisis flag, mood history (last 30), session summaries (no raw messages), commitments, voice journal summaries, appointment history.

---

## 2. In-Chat AI Tools (Saathi — `/saathi`)

**Agent architecture:** LangGraph ReAct loop running inside a Convex action (`api.patientChat.sendMessage`).
**LLM:** Gemini (`GEMINI_API_KEY`) or OpenAI (`OPENAI_API_KEY`) — controlled by `LLM_PROVIDER`.
**Max iterations:** `CHAT_AGENT_MAX_ITERATIONS` (default 5).

### Agent Tool: `exa_search`
| Property | Detail |
|---|---|
| Purpose | Search trusted mental health sources |
| Query enrichment | Appends patient conditions + "mental health India helpline" |
| Domains | NIMHANS, iCall, Vandrevala Foundation, Healthline, WHO |
| External API | Exa (`EXA_API_KEY`) |

### Agent Tool: `apify_search`
| Property | Detail |
|---|---|
| Purpose | Broader web search fallback when Exa has no results |
| Query enrichment | Appends "mental health India Kashmir helpline" |
| External API | Apify Google Search Scraper (`APIFY_API_KEY`, `APIFY_GOOGLE_SEARCH_ACTOR_ID`) |
| Config | 1 page, 4 results per query |

### Agent Tool: `resource_library`
| Property | Detail |
|---|---|
| Purpose | Search Sehat Saathi's own cached article library first (lower latency, no cost) |
| Calls internally | `api.resources.searchResources` (same as Resources page) |

### Agent Tool: `local_events`
| Property | Detail |
|---|---|
| Purpose | Find local meetups, support groups near user (triggered by loneliness/isolation signals) |
| Sources | Exa + Apify hybrid |

---

### Chat Pipeline (per turn)

```
User message
    │
    ▼
api.patientChat.sendMessage  (Convex action)
    │
    ├─► Load patient record from `patients` table (by anonymousId)
    ├─► Load session history from `sessions` table (last 10 message pairs)
    │
    ├─► LangGraph ReAct agent loop
    │       ├─ LLM called with system prompt + patient context + history
    │       ├─ LLM may call: exa_search / apify_search / resource_library / local_events
    │       └─ Final response generated
    │
    ├─► api.agents.extraction.extractFromMessage
    │       Extracts: conditions, medications, triggers, coping patterns,
    │                 commitments, crisis signal (bool), mood score (0–10), emotion
    │
    ├─► api.patients.updateFromExtraction  →  updates `patients` table
    ├─► Mood score → appended to `moodLogs` table
    └─► Messages persisted to `sessions` table
```

**Crisis handling:** If `crisisFlag = true`, response includes hardcoded India helplines:
- iCall: 9152987821
- Vandrevala Foundation: 1860-2662-345
- NIMHANS: 080-46110007
- Snehi: 044-24640050

**Languages supported:** English, Hindi, Urdu, Kashmiri — agent responds in the user's selected language.

---

## 3. Convex Backend — Key Files

| File | Functions | Purpose |
|---|---|---|
| `patientChat.ts` | `sendMessage`, `runTurn` | Main chat entry point; runs agent |
| `symptomCheckRag.ts` | `runRag` | Exa RAG for symptom check |
| `medicines.ts` | `explain` | Medicine search (DB + Exa) |
| `medicinesDb.ts` | `searchMedicinesPublic`, `matchBestMedicine`, `seedBatch` | Medicine DB CRUD |
| `resources.ts` | `searchResources`, `seedResources` | Resource search + seeding |
| `resourcesDb.ts` | `upsertResources`, `listTopics` | Resource cache |
| `dashboard.ts` | `getOverview` | Student dashboard stats |
| `adminAnalytics.ts` | `getAdminOverview`, `listAllPatients`, `listAllAppointments`, `listCounsellorsPublic` | Admin queries |
| `doctorDashboard.ts` | `getDoctorOverview`, `getMyAppointments`, `getMyPatients`, `getPatientDetail`, `updateAppointmentStatus` | Doctor queries |
| `guestAppointments.ts` | `createGuest`, `assignCounsellor`, `listRecent` | Appointment booking |
| `adminCounsellors.ts` | `listForAdmin`, `createAsAdmin`, `updateAsAdmin`, `deleteAsAdmin` | Counsellor management |
| `users.ts` | `createStudent`, `createCounsellor`, `createAdmin`, `updateProfile`, `getProfile` | User CRUD |
| `hospitalsNode.ts` | `fetchApifyHospitals` | Apify hospital scraping |
| `helplines.ts` | `listByRegion`, `seedHelplinesOnce` | Helpline DB |
| `seed.ts` | `seedAdmin`, `seedCounsellor`, `seedStudent`, `seedDemoUsers` | Dev seeding |
| `lib/llm.ts` | `chat()`, `chatTrace()` | Unified LLM wrapper (Gemini/OpenAI) |
| `lib/search.ts` | `exaSearch()`, `apifyWebSearch()`, `searchLocalEvents()` | Search helpers |
| `lib/embeddings.ts` | `embedMany()`, `topKBySimilarity()` | Embedding + cosine similarity |
| `lib/chatAgentGraph.ts` | `runLoopAgent()` | LangGraph ReAct agent + tool definitions |
| `lib/apifyRest.ts` | `apifyRunActorSync()`, `apifyListDatasetItems()` | Apify REST client |

---

## 4. Environment Variables

### Required
| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | All React Convex hooks |
| `CONVEX_SITE_URL` | Next.js → Convex HTTP rewrite |
| `JWT_SECRET` | Student JWT auth (set via `npx convex env set`) |

### LLM (pick one provider)
| Variable | Default | Used by |
|---|---|---|
| `LLM_PROVIDER` | `gemini` | All LLM calls |
| `GEMINI_API_KEY` | — | Chat, symptom RAG, medicine synthesis, verify label |
| `GEMINI_MODEL` | `gemini-2.5-flash` | All Gemini calls |
| `GEMINI_EMBEDDING_MODEL` | `text-embedding-004` | Symptom RAG embeddings |
| `OPENAI_API_KEY` | — | Optional OpenAI provider |
| `OPENAI_MODEL` | `gpt-4o` | All OpenAI calls |

### Search & Scraping
| Variable | Default | Used by |
|---|---|---|
| `EXA_API_KEY` | — | Symptom RAG, medicines, resources, chat tools |
| `APIFY_API_KEY` | — | Hospital finder, chat web search |
| `APIFY_HOSPITAL_DATASET_ID` | — | Pre-fetched hospital dataset |
| `APIFY_HOSPITAL_ACTOR_ID` | — | Custom hospital scraper actor |
| `APIFY_HOSPITAL_SEARCH_QUERY` | — | Default search query for actor |
| `APIFY_HOSPITAL_LOCATION_QUERY` | — | Location filter for hospital actor |
| `APIFY_HOSPITAL_MAX_PLACES_PER_SEARCH` | — | Limit results |
| `APIFY_HOSPITAL_WAIT_SECS` | — | Actor wait timeout |
| `APIFY_HOSPITAL_AUTO_RUN_DEFAULTS` | `true` | Set `false` to disable default Maps actor |
| `APIFY_GOOGLE_SEARCH_ACTOR_ID` | `apify/google-search-scraper` | Chat `apify_search` tool |

### External Appointment Provider (optional)
| Variable | Used by |
|---|---|
| `HEALTH_APPOINTMENTS_API_URL` | Doctor listing + appointment creation |
| `HEALTH_APPOINTMENTS_API_KEY` | Auth for appointment provider |
| `HEALTH_APPOINTMENTS_API_KEY_HEADER` | Custom auth header name |
| `HEALTH_APPOINTMENTS_API_AUTH_MODE` | `raw` or bearer (default) |

### Debug
| Variable | Effect |
|---|---|
| `SEHAT_CHAT_TRACE=1` | Enable JSON trace logs in Convex logs |
| `SEHAT_CHAT_TRACE_VERBOSE=1` | Include message content in traces |
| `CHAT_AGENT_MAX_ITERATIONS` | Agent tool-call budget (default 5) |
