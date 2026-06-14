# Bass & Guitar Training

A self-hosted web app to learn **bass** and **acoustic/electric guitar** using a
**Focusrite USB-C** interface for live audio feedback. Runs in the browser on an
iPad or computer, hosted on TrueNAS via Dockge.

> **Status: Phase 0** — app skeleton + deployment pipeline. The home screen lets
> you pick an instrument profile (Bass / Guitar). Audio tools (Phase 1), the
> interactive lesson engine + curriculum (Phase 2), and songs (Phase 3) come
> next. See the full plan in
> `~/.claude/plans/greedy-dreaming-quasar.md`.

## Architecture

- **Frontend:** React + Vite (TypeScript) in `frontend/`.
- **Backend:** FastAPI + SQLModel in `backend/`, serving both the API (`/api/*`)
  and the built SPA from one origin.
- **Database:** SQLite, stored at `/app/data/app.db` (bind-mounted to a TrueNAS
  dataset).
- **Packaging:** one multi-stage Docker image (Node build → Python runtime).

The backend seeds two profiles on first run: **Bass** and **Guitar**. Rename
them via `PATCH /api/profiles/{id}?name=...`.

## Local development

Two terminals.

**Backend** (needs Python 3.12+):

```bash
cd backend
python -m venv .venv && . .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend** (needs Node 20+):

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173, proxies /api -> :8000
```

To preview the production single-origin build locally, run `npm run build` in
`frontend/`, copy `frontend/dist` into `backend/static`, then run uvicorn and
open http://localhost:8000.

## Deploying to TrueNAS via Dockge

The image builds in GitHub Actions and runs on the NAS — you never build on the
NAS.

### One-time setup

1. **Push this repo to GitHub** (branch `main`). The
   [`build.yml`](.github/workflows/build.yml) workflow builds and pushes
   `ghcr.io/<you>/bass-guitar-training` to GHCR on every push to `main`.
2. After the first successful run, open the package on GitHub and set its
   visibility to **Public** (Package settings → Change visibility). Then the NAS
   pulls with no login. *(If you keep it private, run
   `docker login ghcr.io` once on the NAS with a PAT that has `read:packages`.)*
3. The TrueNAS dataset for the database is `tank/configs/Bass_Guitar`
   (`/mnt/tank/configs/Bass_Guitar`). It's owned by `root:root`, so the
   container is configured to run as root (`PUID=0`/`PGID=0`) and can write it
   with no permission changes. *(Optional hardening: `chown -R 1000:1000
   /mnt/tank/configs/Bass_Guitar` and set `PUID=1000`/`PGID=1000` to run
   unprivileged.)*
4. In **Dockge**, create a new stack (e.g. `bass-guitar-training`), paste
   [`compose.yaml`](compose.yaml), and create a `.env` (see
   [`.env.example`](.env.example)) with:
   - `IMAGE=ghcr.io/ntschetterny/bass_guitar_training:latest`
   - `HOST_PORT=8090`
   - `DATA_PATH=/mnt/tank/configs/Bass_Guitar`
   - `PUID=0` / `PGID=0`
5. Deploy. Open `http://<nas-ip>:8090`.

### Update workflow

1. Develop on any device, commit, `git push` to `main`.
2. GitHub Actions builds and pushes a new image to GHCR.
3. In Dockge, open the stack and click **Update** (pull + recreate). Done.

The SQLite database persists across updates because it lives on the bind-mounted
dataset, not inside the container.

## Project layout

```
frontend/                React + Vite app
backend/                 FastAPI app
  app/main.py            entrypoint (API + SPA serving)
  app/api/               health, profiles, progress routers
  app/models.py          SQLModel tables (Profile, LessonProgress)
Dockerfile               multi-stage build
compose.yaml             Dockge stack
.github/workflows/       CI: build + push to GHCR
```
