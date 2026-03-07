# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Curio Tales is an interactive storybook app. Users describe a character (WHO), setting (WHERE), and quest (HOW) — the backend generates narrative text and illustrations via Google Gemini, displayed in a book-viewer UI. The agent autonomously decides when the quest is complete, then generates a cover and archives the story to a library.

## Commands

### Frontend (from `frontend/`)

```bash
cd frontend
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

Run both servers simultaneously. The Vite dev server proxies `/api` requests to `http://localhost:8000` (configured in `vite.config.js`). The backend also has CORS configured for `localhost:5173`.

To test the agent pipeline standalone: `python agent.py` (runs one demo page turn).

No test framework configured yet.

## Architecture

### Frontend

**Single-page React app** in `frontend/src/` with manual page routing via `useState` in `App.jsx`. Four views:

- **Welcome** (`components/Welcome.jsx`) — Landing with animated particles (tsparticles) and framer-motion. "Start Your Adventure" → StoryInputs, "My Library" → Library.
- **StoryInputs** (`components/StoryInputs.jsx`) — Three-step form (WHO/WHERE/HOW) with animated slide transitions. On the final step, calls `POST /api/generate` with the three prompts to create the first page, then navigates to BookViewer.
- **BookViewer** (`components/BookViewer.jsx`) — Open-book layout: AI-generated image on left page (CSS gradient fallback when empty), narrative text on right. "Continue Story" input on the last page calls `POST /api/generate` with `story_id` + `user_action`. When `story_complete: true` is returned: shows final page for 2s → book-closing CSS animation (1.5s) → completion screen with cover image + title + "Go to Library" button. Already-completed stories (opened from library) show "The End" bar on the last page.
- **Library** (`components/Library.jsx`) — Fetches `GET /api/stories`, displays a grid of book cards with cover image, title, page count, and "Complete" badge. Clicking a card fetches `GET /api/story/{id}` and opens it in BookViewer.

API client in `src/api.js` wraps all backend calls (`generatePage`, `getStory`, `listStories`).

### Backend

Python FastAPI server in `backend/`.

**State machine** — each story session is a `StoryMemory` Pydantic model (defined in `models.py`) containing: `story_id`, `theme_and_style`, `quest`, `current_state` (location + inventory), `running_summary`, `pages` (text + image history), and completion fields (`completed`, `title`, `cover_image`).

**Core agent pipeline** (`agent.py`) — five async functions. Per page turn, the server runs steps 1-4 in sequence:

1. `draft_text(memory, user_action)` — Gemini generates 2-3 sentences of narrative. Prompt includes the quest and allows writing conclusions when the quest is naturally resolved (not just cliffhangers).
2. `draft_image(page_text, theme_and_style)` — Two-step: extracts a visual prompt via light model, then generates illustration via image model. Returns base64 data-URI. Fails gracefully (empty string).
3. `summarize_and_save(memory, new_page_text)` — Lightweight model compresses page into running summary and updates location/inventory via JSON extraction.
4. `check_quest_complete(memory)` — Compares running summary + latest page text against the original quest. Returns bool. Only runs after page 1.
5. `generate_cover(memory)` — Generates a title (3-6 words) and cover illustration. Called only when quest is complete.

All Gemini SDK calls use `asyncio.to_thread` to avoid blocking the event loop.

**Server** (`server.py`) — FastAPI app with CORS. Sessions stored in an in-memory dict (swap for DB later). Key endpoints:
- `POST /api/generate` — full page-turn cycle (text → image → summarize → quest check → optional cover)
- `GET /api/stories` — lightweight list of all sessions (id, title, page count, completed, cover_image)
- `GET /api/story/{id}` — full StoryMemory dump
- `POST /api/story/{id}/continue` — convenience wrapper

## Styling

- Dark theme with CSS custom properties in `frontend/src/index.css`
- Fonts: Inter (body), Nunito (Welcome/StoryInputs headings), Crimson Text (serif, BookViewer) via Google Fonts
- Co-located `.css` files per component — plain CSS, no modules/preprocessors
- CSS-only fallback illustrations in BookViewer (gradients, shapes, animations)
- Book-closing animation uses CSS `perspective` + `rotateY` transform
- Responsive breakpoints at 900px, 768px, 600px, 480px

## Key Conventions

- Frontend: React 19 + JSX (not TypeScript), Vite 7, ES modules
- Frontend animation: framer-motion for transitions, @tsparticles for particle effects
- Backend: Python 3.12+, Pydantic v2, `google-genai` SDK, async via `asyncio.to_thread`
- ESLint flat config with `no-unused-vars` ignoring `^[A-Z_]` pattern (note: `motion` used as `<motion.div>` triggers false-positive unused-var warnings — this is a known ESLint limitation)
- Gemini models: `gemini-2.5-flash` (text), `gemini-2.0-flash` (summarisation/quest eval), `gemini-2.0-flash-exp-image-generation` (images) — constants at top of `agent.py`
- Environment: `GEMINI_API_KEY` in `backend/.env`
