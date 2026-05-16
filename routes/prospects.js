import express from 'express';
import { v4 as uuidv4 } from 'uuid';

import { authenticateToken } from './auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// ==========================================
// GET /prospects
// List all prospects for user
// ==========================================

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, search } = req.query;

    let queryStr = 'SELECT * FROM prospects WHERE user_id = $1';
    const params = [req.user.userId];

    if (status) {
      queryStr += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (search) {
      queryStr += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryStr, params);

    res.json({
      success: true,
      prospects: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get prospects error:', error);
    res.status(500).json({ error: 'Failed to get prospects' });
  }
});

// ==========================================
// POST /prospects
// Create a new prospect
// ==========================================

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, linkedin_url, company, job_title, city } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    const id = uuidv4();

    await query(
      `INSERT INTO prospects (id, user_id, name, email, phone, linkedin_url, company, job_title, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, req.user.userId, name, email, phone, linkedin_url, company, job_title, city]
    );

    console.log('✅ Prospect created', { prospectName: name, prospectEmail: email });

    res.status(201).json({
      success: true,
      prospect: {
        id,
        name,
        email,
        status: 'NEW'
      }
    });

  } catch (error) {
    console.error('Create prospect error:', error);
    res.status(500).json({ error: 'Failed to create prospect' });
  }
});

// ==========================================
// GET /prospects/:id
// Get prospect details
// ==========================================

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM prospects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    res.json({
      success: true,
      prospect: result.rows[0]
    });

  } catch (error) {
    console.error('Get prospect error:', error);
    res.status(500).json({ error: 'Failed to get prospect' });
  }
});

// ==========================================
// PUT /prospects/:id
// Update prospect
// ==========================================

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, email, status, notes } = req.body;

    const result = await query(
      'SELECT id FROM prospects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    await query(
      `UPDATE prospects SET name = COALESCE($1, name), email = COALESCE($2, email),
       status = COALESCE($3, status), notes = COALESCE($4, notes), updated_at = NOW()
       WHERE id = $5`,
      [name, email, status, notes, req.params.id]
    );

    console.log('✅ Prospect updated', { prospectId: req.params.id });

    res.json({
      success: true,
      message: 'Prospect updated'
    });

  } catch (error) {
    console.error('Update prospect error:', error);
    res.status(500).json({ error: 'Failed to update prospect' });
  }
});

// ==========================================
// DELETE /prospects/:id
// Delete prospect
// ==========================================

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM prospects WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    console.log('✅ Prospect deleted', { prospectId: req.params.id });

    res.json({
      success: true,
      message: 'Prospect deleted'
    });

  } catch (error) {
    console.error('Delete prospect error:', error);
    res.status(500).json({ error: 'Failed to delete prospect' });
  }
});

// ==========================================
// POST /prospects/import
// Bulk import prospects
// ==========================================

router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { prospects } = req.body;

    if (!Array.isArray(prospects) || prospects.length === 0) {
      return res.status(400).json({ error: 'Invalid prospects array' });
    }

    const imported = [];

    for (const prospect of prospects) {
      const id = uuidv4();
      await query(
        `INSERT INTO prospects (id, user_id, name, email, phone, linkedin_url, company, job_title, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          req.user.userId,
          prospect.name,
          prospect.email,
          prospect.phone || null,
          prospect.linkedin_url || null,
          prospect.company || null,
          prospect.job_title || null,
          prospect.city || null
        ]
      );
      imported.push(id);
    }

    console.log('✅ Prospects imported', { count: imported.length });

    res.json({
      success: true,
      imported: imported.length,
      ids: imported
    });

  } catch (error) {
    console.error('Import prospects error:', error);
    res.status(500).json({ error: 'Failed to import prospects' });
  }
});

export default router;
