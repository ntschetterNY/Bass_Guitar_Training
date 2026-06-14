# Bass & Guitar Training

A self-hosted web app to learn **bass** and **acoustic/electric guitar** using a
**Focusrite USB-C** interface for live audio feedback. Runs in the browser on an
iPad or computer, hosted on TrueNAS via Dockge.

> **Status: Phase 1** — app skeleton + deploy pipeline (Phase 0) plus the audio
> foundation and tools. Pick an instrument profile, then open **Tools**:
> **Tuner**, **Metronome**, **Note Trainer** (interactive fretboard drill with
> live detection), and a **Live Detector** (note readout for bass, experimental
> chord readout for guitar). Audio comes from the Focusrite via the browser
> (`getUserMedia` + an `AnalyserNode`); bass/single-note pitch uses
> [`pitchy`](https://github.com/ianprime0509/pitchy), guitar chords use a
> chromagram + template matcher. The interactive lesson engine + curriculum
> (Phase 2) and songs (Phase 3) come next. Full plan:
> `~/.claude/plans/greedy-dreaming-quasar.md`.
>
> **Audio note:** the browser tab needs microphone permission, and the site must
> be served over HTTPS or `localhost` for `getUserMedia` to work. On your LAN
> over plain HTTP, use it from the NAS via `localhost` tunnels or put it behind
> HTTPS (a reverse proxy) — see *Phase 1 caveat* below.

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

## Phase 1 caveat: microphone needs a secure context

Browsers only grant `getUserMedia` (audio input) on **HTTPS** or **`localhost`**.
Opening `http://<nas-ip>:8090` over plain HTTP will load the app but the audio
tools **won't be able to access the Focusrite** — the "Enable input" button will
fail with a permission/security error.

Options to get a secure context:

- **Reverse proxy with HTTPS (recommended).** Put the app behind a proxy that
  terminates TLS (Traefik, Nginx Proxy Manager, Caddy) on a hostname like
  `https://bass.home.lan` or a real domain. You likely already run one for your
  other TrueNAS apps — just add this service. The container itself stays plain
  HTTP on port 8000; the proxy handles the cert.
- **Tailscale / Cloudflare Tunnel** also provide HTTPS to the app.
- **Quick local test:** `http://localhost:8090` works on the same machine the
  container runs on (no cert needed), which is enough to verify the build.

This only matters for the audio features (Phase 1+). Phase 0 navigation works
over plain HTTP.

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
