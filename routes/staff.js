const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all staff
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM STAFF ORDER BY Staff_Id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single staff
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM STAFF WHERE Staff_Id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create staff
router.post('/', async (req, res) => {
  try {
    const { Name, Role, Phone, Salary } = req.body;
    const [result] = await pool.query(
      'INSERT INTO STAFF (Name, Role, Phone, Salary) VALUES (?, ?, ?, ?)',
      [Name, Role, Phone, Salary || 0]
    );
    res.status(201).json({ Staff_Id: result.insertId, Name, Role, Phone, Salary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update staff
router.put('/:id', async (req, res) => {
  try {
    const { Name, Role, Phone, Salary, Is_Active } = req.body;
    await pool.query(
      'UPDATE STAFF SET Name = ?, Role = ?, Phone = ?, Salary = ?, Is_Active = ? WHERE Staff_Id = ?',
      [Name, Role, Phone, Salary, Is_Active !== undefined ? Is_Active : 1, req.params.id]
    );
    res.json({ message: 'Staff updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE staff
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM STAFF WHERE Staff_Id = ?', [req.params.id]);
    res.json({ message: 'Staff deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
