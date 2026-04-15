const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all customers
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM CUSTOMER ORDER BY Customer_Id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM CUSTOMER WHERE Customer_Id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  try {
    const { Name, Phone, Email } = req.body;
    const [result] = await pool.query(
      'INSERT INTO CUSTOMER (Name, Phone, Email) VALUES (?, ?, ?)',
      [Name, Phone, Email]
    );
    res.status(201).json({ Customer_Id: result.insertId, Name, Phone, Email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const { Name, Phone, Email } = req.body;
    await pool.query(
      'UPDATE CUSTOMER SET Name = ?, Phone = ?, Email = ? WHERE Customer_Id = ?',
      [Name, Phone, Email, req.params.id]
    );
    res.json({ message: 'Customer updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM CUSTOMER WHERE Customer_Id = ?', [req.params.id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
