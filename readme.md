## rate the washroom

Find and rate nearby washrooms (Next.js frontend + FastAPI backend + Postgres/PostGIS).

### Run locally (Docker)

1. Copy `env.example` → `.env` (repo root) and fill in:
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - `NEXT_PUBLIC_FIREBASE_*`
2. Download a Firebase Admin SDK service account JSON and save it as `apps/backend/firebaseAccountKey.json` (gitignored).
3. Start everything: `docker-compose up`

Frontend: `http://localhost:3000`  
Backend: `http://localhost:8000`

### Secrets / keys

Never commit or bake into images:
- Firebase Admin SDK service account JSON (`apps/backend/firebaseAccountKey.json`)
- Any private keys, database passwords, or server-only tokens

Expected to be public (but should be restricted by domain/usage in the provider console):
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- Firebase Web SDK config (`NEXT_PUBLIC_FIREBASE_*`)
