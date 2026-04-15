const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [[{ totalRevenue }]] = await pool.query(
      "SELECT COALESCE(SUM(Total_Amount),0) AS totalRevenue FROM ORDERS WHERE Status = 'Paid'"
    );
    const [[{ totalOrders }]] = await pool.query(
      'SELECT COUNT(*) AS totalOrders FROM ORDERS'
    );
    const [[{ totalCustomers }]] = await pool.query(
      'SELECT COUNT(*) AS totalCustomers FROM CUSTOMER'
    );
    const [[{ totalStaff }]] = await pool.query(
      'SELECT COUNT(*) AS totalStaff FROM STAFF'
    );
    const [topItems] = await pool.query(
      `SELECT f.Food_Name, SUM(od.Quantity) AS Total_Sold
       FROM ORDER_DETAILS od
       JOIN FOOD_ITEMS f ON od.Food_Id = f.Food_Id
       GROUP BY f.Food_Id
       ORDER BY Total_Sold DESC
       LIMIT 5`
    );
    const [recentOrders] = await pool.query(
      'SELECT * FROM vw_order_summary ORDER BY Order_Id DESC LIMIT 5'
    );

    res.json({
      totalRevenue: Number(totalRevenue),
      totalOrders: Number(totalOrders),
      totalCustomers: Number(totalCustomers),
      totalStaff: Number(totalStaff),
      topItems,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
