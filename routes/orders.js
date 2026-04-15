const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all orders with summary
router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM vw_order_summary ORDER BY Order_Id DESC'
    );
    // Attach details to each order
    for (const order of orders) {
      const [details] = await pool.query(
        'SELECT * FROM vw_order_detail_full WHERE Order_Id = ?',
        [order.Order_Id]
      );
      order.items = details;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create order using stored procedure
router.post('/', async (req, res) => {
  try {
    const { Customer_Id, Staff_Id, items } = req.body;
    // items: [{food_id, quantity}, ...]
    const itemsJson = JSON.stringify(items);
    const [result] = await pool.query('CALL sp_place_order(?, ?, ?)', [
      Customer_Id,
      Staff_Id,
      itemsJson,
    ]);
    const newOrderId = result[0][0].New_Order_Id;
    res.status(201).json({ Order_Id: newOrderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { Status } = req.body;
    await pool.query('UPDATE ORDERS SET Status = ? WHERE Order_Id = ?', [
      Status,
      req.params.id,
    ]);
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE order
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ORDERS WHERE Order_Id = ?', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
