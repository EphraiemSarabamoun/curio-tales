"""
Pydantic models for the Storybook Agent's session memory.

The StoryMemory object is the single source of truth for a story session.
It travels through every agent function and accumulates state as the
user turns pages.
"""

from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel, Field


class PageEntry(BaseModel):
    """One page of the storybook: narrative text paired with its illustration."""

    text: str
    image_url: str = ""  # base64 data-URI or empty if generation failed


class CurrentState(BaseModel):
    """Tracks in-world facts the narrative needs to stay consistent."""

    location: str = "unknown"
    inventory: list[str] = Field(default_factory=list)


class Character(BaseModel):
    """A tracked character with a consistent visual identity."""

    name: str
    visual_description: str = ""
    portrait: str = ""  # base64 data-URI


class StoryMemory(BaseModel):
    """
    The Agent Memory File — one per story session.

    Serialised as JSON and passed between every agent call so the LLM
    always has the context it needs without re-reading the full history.
    """

    story_id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    theme_and_style: str = ""
    quest: str = ""
    current_state: CurrentState = Field(default_factory=CurrentState)
    running_summary: str = ""
    pages: list[PageEntry] = Field(default_factory=list)
    characters: list[Character] = Field(default_factory=list)
    completed: bool = False
    title: str = ""
    cover_image: str = ""


class GenerateRequest(BaseModel):
    """Payload the frontend sends to kick off a new page."""

    # If story_id is omitted the server creates a fresh session.
    story_id: Optional[str] = None
    user_action: str = ""
    # Only used on the very first request to seed the theme.
    theme_and_style: str = ""
    # Story-creation inputs from the frontend (who / where / how).
    who: str = ""
    where: str = ""
    how: str = ""


class GenerateResponse(BaseModel):
    """What the server returns after generating one page turn."""

    story_id: str
    page_text: str
    page_image: str  # base64 data-URI
    page_number: int
    memory: StoryMemory
    story_complete: bool = False
