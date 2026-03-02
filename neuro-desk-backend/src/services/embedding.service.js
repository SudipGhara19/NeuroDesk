/**
 * Local Embedding Service — all-MiniLM-L6-v2 via @xenova/transformers
 * Uses dynamic import() to handle ESM-only package in a CommonJS project.
 * Output: 384-dimensional normalized float vectors (completely FREE, no API).
 */

let _pipeline = null;

async function getEmbedder() {
  if (_pipeline) return _pipeline;

  // Dynamic import works in CommonJS for ESM-only packages
  const { pipeline, env } = await import('@xenova/transformers');
  env.cacheDir = './.cache/xenova';
  env.allowRemoteModels = true;

  console.log('[Embed] Loading all-MiniLM-L6-v2 (first run downloads ~25MB)...');
  _pipeline = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2',
    { quantized: true }
  );
  console.log('[Embed] Model ready ✅');
  return _pipeline;
}

/**
 * Embed a single string → Array<number> (384 dims)
 */
async function embedText(text) {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Embed an array of strings → Array<Array<number>>
 */
async function embedTexts(texts) {
  const embedder = await getEmbedder();
  const results = [];
  // Process sequentially in batches of 16 to avoid OOM
  for (let i = 0; i < texts.length; i += 16) {
    const batch = texts.slice(i, i + 16);
    for (const text of batch) {
      const output = await embedder(text, { pooling: 'mean', normalize: true });
      results.push(Array.from(output.data));
    }
  }
  return results;
}

module.exports = { embedText, embedTexts };
