# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Curio Tales is an interactive storybook app. Users describe a character, setting, and ending direction — the backend generates narrative text and illustrations via Google Gemini, displayed in a book-viewer UI.

## Commands

### Frontend (from `frontend/`)

```bash
cd curio-tales
npm install        # install dependencies
npm run dev        # start Vite dev server with HMR (port 5173)
npm run build      # production build to frontend/dist/
npm run lint       # run ESLint
```

### Backend (from `backend/`)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # then add your GEMINI_API_KEY
uvicorn server:app --reload --port 8000
```

Run both servers simultaneously — Vite proxies `/api` to the backend.

To test the agent pipeline standalone: `python agent.py` (runs one demo page turn).

No test framework configured yet.

## Architecture

### Frontend

**Single-page React app** in `frontend/src/` with manual page routing via `useState` in `App.jsx`. Three views:

- **Library** (`components/Library.jsx`) — Fetches stories from `GET /api/stories`. Clicking a story loads its full memory via `GET /api/story/{id}` and opens the viewer.
- **StoryInputs** (`components/StoryInputs.jsx`) — Three-prompt form (WHO/WHERE/HOW) with voice recording UI placeholder. Generate button calls `POST /api/generate` with the prompts.
- **BookViewer** (`components/BookViewer.jsx`) — Open-book layout: AI-generated image on the left page (falls back to CSS illustration), narrative text on the right. A "Continue Story" input on the last page calls `POST /api/generate` with `story_id` + `user_action` to add pages.

API client in `src/api.js` wraps all backend calls.

### Backend

Python FastAPI server in `backend/`.

**State machine** — each story session is a `StoryMemory` Pydantic model (defined in `models.py`) containing: `story_id`, `theme_and_style`, `current_state` (location + inventory), `running_summary`, and `pages` (text + image history).

**Core agent pipeline** (`agent.py`) — three async functions run in sequence per page turn:

1. `draft_text(memory, user_action)` → Gemini generates ~150-200 words of narrative using running summary + world state as context.
2. `draft_image(page_text, theme_and_style)` → Gemini extracts a visual prompt, then generates an illustration. Returns base64 data-URI. Fails gracefully (empty string).
3. `summarize_and_save(memory, new_page_text)` → Lightweight Gemini model compresses the page into the running summary and updates location/inventory.

**Server** (`server.py`) — FastAPI app with CORS for `localhost:5173`. Sessions stored in an in-memory dict (swap for DB later). Key endpoints:
- `POST /api/generate` — full page-turn cycle
- `GET /api/stories` — list sessions
- `GET /api/story/{id}` — full memory dump
- `POST /api/story/{id}/continue` — convenience wrapper

## Styling

- Dark theme with CSS custom properties in `frontend/src/index.css`
- Fonts: Inter (body) + Crimson Text (serif, book viewer) via Google Fonts
- Co-located `.css` files per component — plain CSS, no modules/preprocessors
- CSS-only fallback illustrations in BookViewer (gradients, shapes, animations)
- Responsive breakpoints at 900px, 768px, 600px, 480px

## Key Conventions

- Frontend: React 19 + JSX (not TypeScript), Vite 7, ES modules
- Backend: Python 3.12+, Pydantic v2, `google-genai` SDK, async via `asyncio.to_thread`
- ESLint flat config with `no-unused-vars` ignoring `^[A-Z_]` pattern
- Gemini models: `gemini-2.5-flash` (text), `gemini-2.0-flash` (summarisation), `gemini-2.0-flash-exp-image-generation` (images)
- Environment: `GEMINI_API_KEY` in `backend/.env`
