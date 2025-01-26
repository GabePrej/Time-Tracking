const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Get all projects
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM projects');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/time', async (req, res) => {
    const projectId = req.params.id;
    const { employeeId, date, hours, minutes } = req.body;
  
    try {
      await db.query(
        `INSERT INTO time_entries (employee_id, project_id, entry_date, hours, minutes)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE hours = hours + VALUES(hours), minutes = minutes + VALUES(minutes)`,
        [employeeId, projectId, date, hours, minutes]
      );
  
      res.json({ message: 'Time logged successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });


  router.get('/:id/time', async (req, res) => {
    const projectId = req.params.id;
    const { employeeId, date } = req.query;
  
    if (!employeeId || !date) {
      return res.status(400).json({ error: 'Employee ID and date are required.' });
    }
  
    try {
      const [rows] = await db.query(
        `SELECT hours, minutes FROM time_entries 
         WHERE project_id = ? AND employee_id = ? AND entry_date = ?`,
        [projectId, employeeId, date]
      );
  
      if (rows.length === 0) {
        return res.json(null); // No time logged
      }
  
      res.json(rows[0]); // Return logged time
    } catch (error) {
      console.error('Error fetching time:', error);
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;
