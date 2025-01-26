const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Get all roles
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM roles');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add more routes for roles if needed

module.exports = router;
