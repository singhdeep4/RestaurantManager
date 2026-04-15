const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all food items
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM FOOD_ITEMS ORDER BY Food_Id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single food item
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM FOOD_ITEMS WHERE Food_Id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create food item
router.post('/', async (req, res) => {
  try {
    const { Food_Name, Price, Category } = req.body;
    const [result] = await pool.query(
      'INSERT INTO FOOD_ITEMS (Food_Name, Price, Category) VALUES (?, ?, ?)',
      [Food_Name, Price, Category]
    );
    res.status(201).json({ Food_Id: result.insertId, Food_Name, Price, Category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update food item
router.put('/:id', async (req, res) => {
  try {
    const { Food_Name, Price, Category, Is_Available } = req.body;
    await pool.query(
      'UPDATE FOOD_ITEMS SET Food_Name = ?, Price = ?, Category = ?, Is_Available = ? WHERE Food_Id = ?',
      [Food_Name, Price, Category, Is_Available !== undefined ? Is_Available : 1, req.params.id]
    );
    res.json({ message: 'Menu item updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE food item
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM FOOD_ITEMS WHERE Food_Id = ?', [req.params.id]);
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
