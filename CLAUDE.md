# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `frontend/` directory:

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test framework is configured yet.

## Architecture

Curio Tales is a children's AI story generation app. Currently the frontend is a pure React + Vite SPA with no backend — story generation is mocked with hardcoded data.

### Navigation

`App.jsx` manages the entire app with a single `page` state (`'library'`, `'inputs'`, `'viewer'`). There is no router. Page transitions are done by swapping which component renders based on that state string.

### Components

- **`Library`** — Grid of book cards plus an "Add New Story" card. Currently renders hardcoded `BOOKS` array; all existing books open the same `sampleStory` mock object. Calls `onAddNew` or `onSelectBook(storyData)` to navigate.
- **`StoryInputs`** — Three-prompt form (WHO / WHERE / HOW) with text inputs and a UI-only voice record button (no actual recording). On submit, calls `onGenerate(storyData)` with hardcoded mock story data — real AI generation is not yet wired up.
- **`BookViewer`** — Open-book layout with a left illustration page and a right text page. Illustrations are CSS-only scenes defined in the `ILLUSTRATIONS` map keyed by name (`'astronaut'`, `'spaceship'`, `'saturn'`). Page flipping uses a 500ms timeout + `isFlipping` flag to animate transitions. The "Listen to Story" audio button is UI-only.

### Data shape

Story objects passed between components:
```js
{
  title: string,
  illustration: string,   // key into ILLUSTRATIONS map
  pages: [{ text: string, illustration: string }]
}
```

### Styling

Each component has a co-located `.css` file. CSS custom properties (e.g. `--book-color`, `--bar-index`, `--bar-delay`) are used for per-element dynamic styling. No CSS framework or preprocessor.

### ESLint note

`no-unused-vars` ignores names matching `/^[A-Z_]/` — uppercased constants won't trigger the rule even if unused.


## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update 'tasks/lessons.md" with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project
### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
-Challenge your own work before presenting it

### 6. Autonomous Bug Fizing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management
1. **Plan First**: Write plan to "tasks/todo.md" with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to 'tasks/todo.md"
6. **Capture Lessons**: Update 'tasks/lessons.md' after corrections

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimat Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **All commmits are mine** Never include sentences like "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>" in the commit messages