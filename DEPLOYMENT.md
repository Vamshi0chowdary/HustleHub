# HustleHub Deployment Runbook

This runbook takes HustleHub from local-ready to public launch-ready.

## 0. Preflight

- Backend local health: `GET http://127.0.0.1:8000/health` returns `status: healthy`.
- Web local build passes.
- Web lint passes.
- Mongo data and ML artifacts are already prepared.

## 1. Backend Env (Production)

Set these variables on Render/Railway:

- `APP_ENV` = `production`.
- `MONGODB_URI` = Atlas URI (recommended) or managed volume/local Docker URI.
- `MONGODB_DB_NAME` = `hustlehub` (or your DB name).
- `JWT_SECRET` = long random secret.
- `CORS_ORIGINS` = comma-separated frontend origins, e.g. `https://your-web.vercel.app`.
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Notes:
- Avoid `*` in `CORS_ORIGINS` for production. Use explicit domains.
- `JWT_SECRET` must be at least 32 characters.
- Keep secrets only in platform env settings, never committed.

## 2. Backend Deploy (Render)

Option A: Blueprint from `render.yaml` (repo root).

Option B: Manual service settings:
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`

Verification:
- Open `https://<backend-domain>/health`
- Expect HTTP 200 and JSON with `status: healthy`.

## 3. Frontend Deploy (Vercel)

Project settings:
- Root directory: `web`
- Framework preset: Next.js

Environment variable:
- `NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>`

Verification:
- Open frontend URL and confirm it loads without runtime errors.

## 4. API Integration Verification

Run these checks from browser app flow:

1. Signup and Login must return/consume JWT.
2. Feed page must request `GET /api/v1/recommend/feed`.
3. Like/Skip must call `POST /api/v1/recommend/feedback`.
4. Discover page must request `GET /api/v1/recommend/users`.

## 5. End-to-End User Flow (Demo Script)

1. Sign up a new user.
2. Login.
3. Open Feed and interact (like/skip) with multiple cards.
4. Refresh feed and show ranking/queue change.
5. Open Discover and show recommended users.

## 6. Launch Checklist

- [ ] Backend deployed and `/health` healthy.
- [ ] Frontend deployed and reachable.
- [ ] Frontend env points to deployed backend.
- [ ] Auth works (signup/login).
- [ ] Feed, feedback, and discover endpoints work in UI.
- [ ] Mobile and desktop responsive checks done.
- [ ] No critical console/runtime errors.

## 7. Demo Recording (1-2 min)

- 0:00-0:20: Login
- 0:20-1:00: Feed interactions (like/skip)
- 1:00-1:20: Refresh and explain recommendation adaptation
- 1:20-1:40: Discover users
- 1:40-2:00: Final product summary
