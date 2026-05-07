import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { query } from '../config/database.js';
import { validateEmail, validatePassword } from '../utils/validators.js';

const router = express.Router();

// ==========================================
// POST /auth/signup
// ==========================================

router.post('/signup', async (req, res) => {
  try {
    const { email, password, plan = 'FREE' } = req.body;

    // Validation
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters'
      });
    }

    if (!['FREE', 'BASIC', 'PRO'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const tokensLimit = getTokensLimit(plan);

    await query(
      `INSERT INTO users (id, email, password_hash, plan, tokens_limit, tokens_remaining)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, email, hashedPassword, plan, tokensLimit, tokensLimit]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId, email, plan },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    logger.info('✅ User signup successful', { email, plan });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: userId,
        email,
        plan,
        tokensLimit
      },
      token
    });

  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ==========================================
// POST /auth/login
// ==========================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user
    const result = await query(
      'SELECT id, email, password_hash, plan, tokens_remaining, tokens_limit FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    logger.info('✅ User login successful', { email });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        tokensRemaining: user.tokens_remaining,
        tokensLimit: user.tokens_limit
      },
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==========================================
// GET /auth/me
// ==========================================

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, plan, tokens_remaining, tokens_limit, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ==========================================
// MIDDLEWARE
// ==========================================

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  });
}

// ==========================================
// HELPERS
// ==========================================

function getTokensLimit(plan) {
  const limits = {
    FREE: 50,
    BASIC: 1000,
    PRO: 999999
  };
  return limits[plan] || 50;
}

export default router;
