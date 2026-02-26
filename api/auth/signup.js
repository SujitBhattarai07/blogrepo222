// api/auth/signup.js
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function setupDb(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      username   TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  if (username.length < 3)
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    await setupDb(sql);

    // Check if username taken
    const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existing.length) return res.status(400).json({ error: 'Username already taken.' });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const [user] = await sql`
      INSERT INTO users (username, password)
      VALUES (${username}, ${hashed})
      RETURNING id, username
    `;

    return res.status(201).json({ message: 'Account created.', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
};