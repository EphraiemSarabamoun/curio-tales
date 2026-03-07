"""
FastAPI server for Curio Tales.

Endpoints:
  POST /api/generate   — run one page-turn (text + image + save)
  GET  /api/stories     — list all active story sessions

Story sessions are held in-memory (dict keyed by story_id).
Swap the dict for a database later without touching agent code.
"""

from __future__ import annotations

import logging

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from agent import (
    check_quest_complete,
    draft_image,
    draft_text,
    extract_new_characters,
    generate_character_portrait,
    generate_cover,
    summarize_and_save,
)
from models import (
    CurrentState,
    GenerateRequest,
    GenerateResponse,
    PageEntry,
    StoryMemory,
)

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Curio Tales API")

# Allow the Vite dev server (localhost:5173) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory session store.  Replace with a DB for persistence.
# ---------------------------------------------------------------------------
sessions: dict[str, StoryMemory] = {}


def _build_theme(who: str, where: str, how: str) -> str:
    """Derive a theme string from the frontend's three prompts."""
    parts = []
    if who:
        parts.append(f"protagonist: {who}")
    if where:
        parts.append(f"setting: {where}")
    if how:
        parts.append(f"ending direction: {how}")
    return "; ".join(parts) if parts else "whimsical children's storybook, watercolour illustration"


def _build_first_action(who: str, where: str, how: str) -> str:
    """Turn the three prompts into the opening 'user action' for draft_text."""
    lines = ["Begin the story."]
    if who:
        lines.append(f"The main character is {who}.")
    if where:
        lines.append(f"The story takes place {where}.")
    if how:
        lines.append(f"The story should build toward: {how}.")
    return " ".join(lines)


# ---------------------------------------------------------------------------
# POST /api/generate
# ---------------------------------------------------------------------------

@app.post("/api/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """
    Run one full page-turn cycle:
      1. Resolve or create a story session.
      2. draft_text   → new narrative
      3. draft_image  → illustration
      4. summarize_and_save → update memory
    """

    # --- resolve session ---------------------------------------------------
    if req.story_id and req.story_id in sessions:
        memory = sessions[req.story_id]
    else:
        # New story — seed from frontend inputs.
        theme = req.theme_and_style or _build_theme(req.who, req.where, req.how)
        memory = StoryMemory(
            theme_and_style=theme,
            quest=req.how,
            current_state=CurrentState(location=req.where or "unknown"),
        )
        sessions[memory.story_id] = memory

    # --- guard: don't continue a completed story ----------------------------
    if memory.completed:
        raise HTTPException(400, "This story is already complete")

    # --- user action -------------------------------------------------------
    user_action = req.user_action
    if not user_action and not memory.pages:
        # First page: synthesise an action from the creation prompts.
        user_action = _build_first_action(req.who, req.where, req.how)

    if not user_action:
        raise HTTPException(400, "user_action is required after the first page")

    # --- generate ----------------------------------------------------------
    try:
        page_text = await draft_text(memory, user_action)
    except Exception as exc:
        logger.exception("draft_text failed")
        raise HTTPException(502, f"Text generation failed: {exc}") from exc

    # Detect new characters for visual consistency across pages.
    try:
        new_chars = await extract_new_characters(
            page_text, memory.characters, memory.theme_and_style
        )
    except Exception:
        logger.exception("Character extraction failed")
        new_chars = []

    all_characters = list(memory.characters) + new_chars

    # Image generation uses character descriptions for consistency.
    page_image = await draft_image(page_text, memory.theme_and_style, all_characters)

    # Generate portraits for newly introduced characters.
    for char in new_chars:
        try:
            char.portrait = await generate_character_portrait(
                char, memory.theme_and_style
            )
        except Exception:
            logger.exception("Portrait generation failed for %s", char.name)

    if new_chars:
        memory.characters = all_characters

    # Record the new page.
    memory.pages.append(PageEntry(text=page_text, image_url=page_image))

    # Summarise and persist.
    try:
        memory = await summarize_and_save(memory, page_text)
    except Exception as exc:
        logger.exception("summarize_and_save failed")
        # Non-fatal — the page is already appended.

    # --- check quest completion (skip first page) ----------------------------
    story_complete = False
    if len(memory.pages) > 1:
        try:
            story_complete = await check_quest_complete(memory)
        except Exception:
            logger.exception("Quest completion check failed")

    if story_complete:
        try:
            title, cover_image = await generate_cover(memory)
            memory = memory.model_copy(
                update={"completed": True, "title": title, "cover_image": cover_image}
            )
        except Exception:
            logger.exception("Cover generation failed")
            memory = memory.model_copy(update={"completed": True, "title": "Untitled"})

    sessions[memory.story_id] = memory

    return GenerateResponse(
        story_id=memory.story_id,
        page_text=page_text,
        page_image=page_image,
        page_number=len(memory.pages),
        memory=memory,
        story_complete=story_complete,
    )


# ---------------------------------------------------------------------------
# GET /api/stories
# ---------------------------------------------------------------------------

@app.get("/api/stories")
async def list_stories():
    """Return a lightweight list of all active story sessions."""
    return [
        {
            "story_id": m.story_id,
            "theme_and_style": m.theme_and_style,
            "page_count": len(m.pages),
            "title": m.title or (m.pages[0].text[:60] + "…" if m.pages else "Untitled"),
            "completed": m.completed,
            "cover_image": m.cover_image,
        }
        for m in sessions.values()
    ]


# ---------------------------------------------------------------------------
# GET /api/story/{story_id}
# ---------------------------------------------------------------------------

@app.get("/api/story/{story_id}", response_model=StoryMemory)
async def get_story(story_id: str):
    """Return full memory for a story session."""
    if story_id not in sessions:
        raise HTTPException(404, "Story not found")
    return sessions[story_id]


# ---------------------------------------------------------------------------
# POST /api/story/{story_id}/continue
# ---------------------------------------------------------------------------

@app.post("/api/story/{story_id}/continue", response_model=GenerateResponse)
async def continue_story(story_id: str, req: GenerateRequest):
    """Convenience endpoint — sets story_id from the path."""
    req.story_id = story_id
    return await generate(req)
