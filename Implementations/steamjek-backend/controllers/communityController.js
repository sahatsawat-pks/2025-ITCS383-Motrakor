const pool = require('../db');

// GET /api/community/threads?game_id=&q=&tag=
const getThreads = async (req, res) => {
  const { game_id, q, tag } = req.query;
  if (!game_id) return res.status(400).json({ message: 'game_id is required' });

  try {
    let whereClauses = ['t.game_id = $1'];
    let params = [game_id];
    let idx = 2;

    if (tag && tag !== 'All') {
      whereClauses.push(`t.tag = $${idx++}`);
      params.push(tag);
    }
    if (q) {
      whereClauses.push(`(t.title ILIKE $${idx} OR t.content ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    const result = await pool.query(
      `SELECT t.id, t.title, t.tag, t.view_count, t.created_at, t.updated_at,
              u.name AS author_name,
              COUNT(DISTINCT tr.id)  AS reply_count,
              COUNT(DISTINCT tl.id)  AS like_count
       FROM threads t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN thread_replies tr ON tr.thread_id = t.id
       LEFT JOIN thread_likes   tl ON tl.thread_id = t.id
       WHERE ${whereClauses.join(' AND ')}
       GROUP BY t.id, u.name
       ORDER BY t.updated_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/community/threads/:id
const getThread = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE threads SET view_count = view_count + 1 WHERE id=$1', [id]);
    const result = await pool.query(
      `SELECT t.*, u.name AS author_name,
              COUNT(DISTINCT tl.id) AS like_count,
              COUNT(DISTINCT tr.id) AS reply_count
       FROM threads t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN thread_likes   tl ON tl.thread_id = t.id
       LEFT JOIN thread_replies tr ON tr.thread_id = t.id
       WHERE t.id = $1
       GROUP BY t.id, u.name`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Thread not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/community/threads
const createThread = async (req, res) => {
  const user_id = req.user.id;
  const { game_id, title, content, tag } = req.body;
  if (!game_id || !title || !content) {
    return res.status(400).json({ message: 'game_id, title, and content are required' });
  }
  const validTags = ['Discussion', 'Question', 'Guide', 'Bug Report', 'Announcement'];
  const safeTag = validTags.includes(tag) ? tag : 'Discussion';

  try {
    const result = await pool.query(
      'INSERT INTO threads (game_id, user_id, title, content, tag) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [game_id, user_id, title, content, safeTag]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/community/threads/:id/replies
const getReplies = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT tr.*, u.name AS author_name
       FROM thread_replies tr
       JOIN users u ON tr.user_id = u.id
       WHERE tr.thread_id = $1
       ORDER BY tr.created_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/community/threads/:id/replies
const createReply = async (req, res) => {
  const user_id = req.user.id;
  const thread_id = Number.parseInt(req.params.id);
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: 'content is required' });

  try {
    // Verify thread exists
    const tRes = await pool.query('SELECT id FROM threads WHERE id=$1', [thread_id]);
    if (!tRes.rows.length) return res.status(404).json({ message: 'Thread not found' });

    const result = await pool.query(
      'INSERT INTO thread_replies (thread_id, user_id, content) VALUES ($1,$2,$3) RETURNING *',
      [thread_id, user_id, content]
    );
    // Update thread updated_at
    await pool.query('UPDATE threads SET updated_at=NOW() WHERE id=$1', [thread_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/community/threads/:id/like — toggle like
const likeThread = async (req, res) => {
  const user_id = req.user.id;
  const thread_id = Number.parseInt(req.params.id);
  try {
    const existing = await pool.query(
      'SELECT id FROM thread_likes WHERE thread_id=$1 AND user_id=$2',
      [thread_id, user_id]
    );
    if (existing.rows.length) {
      await pool.query('DELETE FROM thread_likes WHERE thread_id=$1 AND user_id=$2', [thread_id, user_id]);
      return res.json({ message: 'Unliked', liked: false });
    } else {
      await pool.query('INSERT INTO thread_likes (thread_id, user_id) VALUES ($1,$2)', [thread_id, user_id]);
      return res.json({ message: 'Liked', liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getThreads, getThread, createThread, getReplies, createReply, likeThread };
