const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
const register = async (req, res) => {
  const { name, email, password, address } = req.body;

  try {
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, address) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, hashedPassword, address]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: user.balance }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getProfile = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, balance, address FROM users WHERE id = $1',
      [user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getProfile };