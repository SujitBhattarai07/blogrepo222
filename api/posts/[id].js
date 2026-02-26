// api/posts/[id].js — DELETE a post (only by owner)
const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed.' });

  const { id } = req.query;
  const { user_id } = req.body;

  if (!id || !user_id) return res.status(400).json({ error: 'Missing id or user_id.' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Make sure post belongs to this user
    const [post] = await sql`SELECT id FROM posts WHERE id = ${id} AND user_id = ${user_id}`;
    if (!post) return res.status(403).json({ error: 'Not allowed or post not found.' });

    await sql`DELETE FROM posts WHERE id = ${id}`;
    return res.status(200).json({ message: 'Post deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
};