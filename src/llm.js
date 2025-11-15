export async function callOllama(prompt) {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://ollama:11434/api/generate';
    const model = process.env.OLLAMA_MODEL || 'llama3.2:1b';

    const res = await fetch(ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false })
    });

    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) { /* not JSON */ }

    if (!res.ok) {
      const body = data ? JSON.stringify(data) : text;
      throw new Error(`Ollama API error: ${res.status} ${res.statusText} - ${body}`);
    }

    // Ollama may return different shapes; prefer `response` field if present
    return data?.response ?? data;
  } catch (error) {
    console.error('Ollama error:', error);
    throw error;
  }
}