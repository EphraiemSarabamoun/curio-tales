"""
Core Storybook Agent — three stateless functions that together form
one "page turn" of the interactive storybook.

Flow:  draft_text  →  draft_image  →  summarize_and_save
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import re

from google import genai
from google.genai import types

from models import CurrentState, PageEntry, StoryMemory

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# SDK client — initialised lazily so import never crashes without a key.
# ---------------------------------------------------------------------------

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(api_key=api_key)
    return _client


# ---------------------------------------------------------------------------
# Model names — change these if you want a different model tier.
# ---------------------------------------------------------------------------

TEXT_MODEL = "gemini-2.5-flash"                        # narrative generation
LIGHT_MODEL = "gemini-2.0-flash"                       # summarisation / extraction
IMAGE_MODEL = "gemini-2.0-flash-exp-image-generation"  # image generation via Gemini


# ===================================================================
# 1. DRAFT TEXT
# ===================================================================

async def draft_text(memory: StoryMemory, user_action: str) -> str:
    """
    Generate exactly ONE page of continuing narrative (~150-200 words).

    Context sent to the model:
      • running_summary   – compressed history so far
      • current_state     – location + inventory
      • last page text    – immediate continuity
      • user_action       – what the reader chose to do next
    """

    last_page_text = memory.pages[-1].text if memory.pages else "(story has not started)"

    prompt = f"""You are a master storyteller writing an interactive storybook.

THEME / VISUAL STYLE: {memory.theme_and_style}

=== STORY SO FAR (compressed) ===
{memory.running_summary or "No prior events."}

=== CURRENT WORLD STATE ===
Location : {memory.current_state.location}
Inventory: {", ".join(memory.current_state.inventory) or "nothing"}

=== PREVIOUS PAGE ===
{last_page_text}

=== READER'S ACTION ===
{user_action}

INSTRUCTIONS:
- Write exactly 2-3 short sentences for one storybook page (this is a children's book).
- Use simple, vivid language a child can follow.
- Incorporate the reader's action naturally.
- End on a moment that invites the next choice — a cliffhanger, a discovery, or a question.
- Do NOT include page numbers, titles, or meta-commentary.
- Output ONLY the 2-3 sentences, nothing else."""

    client = _get_client()

    # Run the blocking SDK call in a thread so we don't stall the event loop.
    response = await asyncio.to_thread(
        client.models.generate_content,
        model=TEXT_MODEL,
        contents=prompt,
    )

    text = response.text.strip()
    logger.info("draft_text produced %d chars", len(text))
    return text


# ===================================================================
# 2. DRAFT IMAGE
# ===================================================================

async def draft_image(page_text: str, theme_and_style: str) -> str:
    """
    Produce an illustration for *page_text*.

    Two-step process:
      1. Ask Gemini to distil the text into a concise visual prompt.
      2. Feed that prompt + theme_and_style into image generation.

    Returns a base64 data-URI string ("data:image/png;base64,...").
    On failure (safety filter, quota, etc.) returns an empty string
    so the frontend can fall back to its CSS illustration.
    """

    client = _get_client()

    try:
        # --- Step 1: extract a visual prompt from the narrative -----------

        extraction_prompt = f"""Read the following children's storybook page and output a SHORT,
comma-separated visual description suitable as an image-generation prompt.
Focus on: main character, action, setting, mood.
The image must be a full-page children's book illustration in portrait orientation (3:4 aspect ratio).
Do NOT include any explanation — output ONLY the comma-separated phrases.

PAGE TEXT:
{page_text}"""

        extraction_resp = await asyncio.to_thread(
            client.models.generate_content,
            model=LIGHT_MODEL,
            contents=extraction_prompt,
        )

        visual_prompt = extraction_resp.text.strip()
        # Append the theme + children's book style to lock in visual consistency.
        full_prompt = f"{visual_prompt}, {theme_and_style}, children's storybook illustration, soft colors, whimsical, portrait 3:4 aspect ratio"
        logger.info("Image prompt: %s", full_prompt)

        # --- Step 2: generate the image via Gemini image generation -------
        image_response = await asyncio.to_thread(
            client.models.generate_content,
            model=IMAGE_MODEL,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_modalities=["Text", "Image"],
            ),
        )

        # Walk through parts looking for inline image data.
        for part in image_response.candidates[0].content.parts:
            if part.inline_data is not None:
                b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                mime = part.inline_data.mime_type or "image/png"
                data_uri = f"data:{mime};base64,{b64}"
                logger.info("Image generated (%s, %d bytes)", mime, len(b64))
                return data_uri

        logger.warning("Image response contained no inline image data")
        return ""

    except Exception as exc:
        # Safety-filter blocks, quota errors, network issues, etc.
        logger.error("Image generation failed: %s", exc)
        return ""


# ===================================================================
# 3. SUMMARIZE AND SAVE
# ===================================================================

async def summarize_and_save(
    memory: StoryMemory,
    new_page_text: str,
) -> StoryMemory:
    """
    Compress the latest page into the running summary and update world state.

    Uses a lightweight model to:
      • Summarise new_page_text into 1-2 factual sentences.
      • Detect any location change or new inventory items.
    Returns a *new* StoryMemory instance with the updates applied.
    """

    client = _get_client()

    prompt = f"""You are a story-state tracker.  Given the NEW PAGE below,
produce a JSON object with exactly these keys:

  "summary"   – 1-2 factual sentences summarising what happened.
  "location"  – the character's current location after this page
                (keep the old value "{memory.current_state.location}" if unchanged).
  "inventory" – full list of items the character now carries
                (start from {json.dumps(memory.current_state.inventory)} and add/remove as needed).

NEW PAGE:
{new_page_text}

Respond with ONLY valid JSON, no markdown fences."""

    response = await asyncio.to_thread(
        client.models.generate_content,
        model=LIGHT_MODEL,
        contents=prompt,
    )

    raw = response.text.strip()

    # Strip markdown code fences if the model wraps the JSON anyway.
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("Summary JSON parse failed; raw response: %s", raw)
        # Graceful fallback: just append the raw text as summary.
        data = {
            "summary": new_page_text[:200],
            "location": memory.current_state.location,
            "inventory": memory.current_state.inventory,
        }

    # Build updated memory.
    new_summary = memory.running_summary
    if new_summary:
        new_summary += " "
    new_summary += data.get("summary", "")

    updated = memory.model_copy(
        update={
            "running_summary": new_summary,
            "current_state": CurrentState(
                location=data.get("location", memory.current_state.location),
                inventory=data.get("inventory", memory.current_state.inventory),
            ),
        }
    )

    logger.info("Memory updated — location: %s", updated.current_state.location)
    return updated


# ===================================================================
# MAIN — simulate one page turn end-to-end
# ===================================================================

async def _demo():
    """Run a single page turn with a fresh story to verify the pipeline."""

    memory = StoryMemory(
        theme_and_style=(
            "Napoleonic historical fiction, 19th-century romanticism oil painting"
        ),
        current_state=CurrentState(
            location="a military camp outside Austerlitz",
            inventory=["sabre", "sealed letter"],
        ),
    )

    user_action = "I open the sealed letter by the light of the campfire."

    print("=== Drafting text ===")
    text = await draft_text(memory, user_action)
    print(text, "\n")

    print("=== Generating image ===")
    image = await draft_image(text, memory.theme_and_style)
    print(f"Image data-URI length: {len(image)} chars\n")

    # Record the new page before summarising.
    memory.pages.append(PageEntry(text=text, image_url=image))

    print("=== Summarising & saving ===")
    memory = await summarize_and_save(memory, text)
    print(memory.model_dump_json(indent=2))


if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv()
    logging.basicConfig(level=logging.INFO)
    asyncio.run(_demo())
