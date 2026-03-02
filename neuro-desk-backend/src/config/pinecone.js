/**
 * Pinecone config — auto-creates the index if it doesn't exist.
 * Index dimensions: 384 (all-MiniLM-L6-v2 local embeddings)
 * Metric: cosine
 */
const { Pinecone } = require('@pinecone-database/pinecone');

const DIMENSION = 384;
const METRIC = 'cosine';

let pineconeIndex = null;

const getPineconeIndex = async () => {
  if (pineconeIndex) return pineconeIndex;

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const indexName = process.env.PINECONE_INDEX || 'neuro-desk';

  // Check if index exists; create it if not
  try {
    const existingIndexes = await pc.listIndexes();
    const names = (existingIndexes.indexes || []).map((idx) => idx.name);

    if (!names.includes(indexName)) {
      console.log(`[Pinecone] Index "${indexName}" not found — creating with dim=${DIMENSION}...`);
      await pc.createIndex({
        name: indexName,
        dimension: DIMENSION,
        metric: METRIC,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
        waitUntilReady: true, // block until index is ready
      });
      console.log(`[Pinecone] Index "${indexName}" created ✅`);
    } else {
      console.log(`[Pinecone] Using existing index "${indexName}"`);
    }
  } catch (err) {
    // If listing/creating fails, still try to use the index
    console.warn(`[Pinecone] Could not verify/create index: ${err.message}`);
  }

  pineconeIndex = pc.index(indexName);
  return pineconeIndex;
};

module.exports = { getPineconeIndex };
