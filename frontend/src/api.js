/**
 * Thin wrapper around the Curio Tales backend API.
 */

const BASE = '/api';

/**
 * Generate the next page of a story (or start a new one).
 *
 * @param {object} params
 * @param {string} [params.story_id]    - existing session (omit to create new)
 * @param {string} [params.user_action] - what happens next
 * @param {string} [params.who]         - character prompt (first page only)
 * @param {string} [params.where]       - setting prompt  (first page only)
 * @param {string} [params.how]         - ending prompt   (first page only)
 * @returns {Promise<object>}           - { story_id, page_text, page_image, page_number, memory }
 */
export async function generatePage(params) {
  const res = await fetch(`${BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Generate failed (${res.status}): ${detail}`);
  }
  return res.json();
}

/**
 * Fetch the full memory object for a story.
 */
export async function getStory(storyId) {
  const res = await fetch(`${BASE}/story/${storyId}`);
  if (!res.ok) throw new Error(`Story not found (${res.status})`);
  return res.json();
}

/**
 * List all stories on the server.
 */
export async function listStories() {
  const res = await fetch(`${BASE}/stories`);
  if (!res.ok) throw new Error(`Failed to list stories (${res.status})`);
  return res.json();
}
