require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getClusters() {
  const result = await pool.query(`
    SELECT
      c.id,
      c.label,
      COUNT(a.id) AS article_count,
      MIN(a.published_at) AS earliest,
      MAX(a.published_at) AS latest
    FROM clusters c
    JOIN articles a ON a.cluster_id = c.id
    GROUP BY c.id, c.label
    ORDER BY latest DESC
  `);
  return result.rows;
}

async function getClusterById(id) {
  const clusterResult = await pool.query(
    "SELECT id, label FROM clusters WHERE id = $1",
    [id]
  );

  if (clusterResult.rows.length === 0) {
    return null;
  }

  const articlesResult = await pool.query(
    `SELECT id, url, source, headline, summary, published_at
     FROM articles
     WHERE cluster_id = $1
     ORDER BY published_at ASC`,
    [id]
  );

  return {
    id: clusterResult.rows[0].id,
    label: clusterResult.rows[0].label,
    articles: articlesResult.rows,
  };
}

async function getTimeline() {
  const result = await pool.query(`
    SELECT
      c.id,
      c.label,
      MIN(a.published_at) AS start,
      MAX(a.published_at) AS end,
      COUNT(a.id) AS article_count,
      ARRAY_AGG(DISTINCT a.source) AS sources
    FROM clusters c
    JOIN articles a ON a.cluster_id = c.id
    GROUP BY c.id, c.label
    ORDER BY start ASC
  `);

  return result.rows.map((row) => ({
    id: row.id,
    label: row.label,
    start: row.start,
    end: row.end,
    articleCount: parseInt(row.article_count, 10),
    intensity: parseInt(row.article_count, 10),
    sources: row.sources, //["BBC","NPR","Al Jazeera"]
  }));
}

module.exports = { pool, getClusters, getClusterById, getTimeline };