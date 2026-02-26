// api/auth/login.js
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    const [user] = await sql`SELECT * FROM users WHERE username = ${username}`;

    if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid username or password.' });

    return res.status(200).json({
      message: 'Login successful.',
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
};