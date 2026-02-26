// api/posts.js — GET all posts / POST new post
const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  // GET all posts (join with users to get username)
  if (req.method === 'GET') {
    try {
      const posts = await sql`
        SELECT posts.id, posts.title, posts.content, posts.created_at,
               posts.user_id, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
        ORDER BY posts.created_at DESC
      `;
      return res.status(200).json(posts);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  // POST new post
  if (req.method === 'POST') {
    const { title, content, user_id } = req.body;

    if (!title || !content || !user_id)
      return res.status(400).json({ error: 'title, content, and user_id are required.' });

    try {
      const [post] = await sql`
        INSERT INTO posts (title, content, user_id)
        VALUES (${title}, ${content}, ${user_id})
        RETURNING *
      `;
      return res.status(201).json(post);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
};