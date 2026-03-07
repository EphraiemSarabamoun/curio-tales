# Curio Tales

An interactive storybook app powered by Google Gemini. Describe a character, setting, and ending — the AI generates narrative text and illustrations page by page.

## Prerequisites

- **Node.js** (v18+)
- **Python** (3.12+)
- A **Google Gemini API key** — get one at https://aistudio.google.com/apikey

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Open `backend/.env` and add your Gemini API key:

```
GEMINI_API_KEY=your-key-here
```

### Frontend

```bash
cd frontend
npm install
```

## Running

Start **both** servers from the project root. The frontend proxies API requests to the backend.

**Terminal 1 — Backend (port 8000):**

```bash
cd backend
uvicorn server:app --reload --port 8000
```

**Terminal 2 — Frontend (port 5173):**

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

1. Click **Add New Story** in the library.
2. Fill in the three prompts (WHO / WHERE / HOW) and click **Generate My Story**.
3. The AI generates the first page with text and an illustration.
4. On the last page, type what happens next in the **Continue Story** input to generate more pages.
5. Return to the library to see all your stories.
