const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const register = async (req, res) => {
  try {
    const { full_name, email, password, phone_number, cnic } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'full_name, email, and password are required' });
    }

    const existingUser = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, phone_number, cnic, role)
       VALUES ($1, $2, $3, $4, $5, 'user')
       RETURNING user_id, full_name, email, role, created_at`,
      [full_name, email, password_hash, phone_number, cnic]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      user,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const getProfile = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getProfile };
