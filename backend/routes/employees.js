const express = require('express');
const router = express.Router();
const db = require('../db/connection'); // Ensure connection.js exists in db folder

// Get all employees


// Get all unique departments
router.get('/departmentList', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT DISTINCT department FROM employees WHERE department IS NOT NULL');
      res.json(rows); // Return unique departments
    } catch (error) {
      console.error('Error fetching unique departments:', error);
      res.status(500).json({ error: error.message });
    }
  });
  

  router.get('/department', async (req, res) => {
    const department = req.query.department; // Get department from query params
    if (!department) {
        return res.status(400).json({ error: 'Department is required as a query parameter' });
    }
    try {
        // Query for individual time entries
        const [rows] = await db.query(
            `SELECT 
                te.entry_date, 
                e.name AS employee_name, 
                e.title AS employee_title, 
                p.name AS project_name, 
                te.hours, 
                te.minutes 
             FROM time_entries te
             JOIN employees e ON te.employee_id = e.id
             JOIN projects p ON te.project_id = p.id
             WHERE e.department = ?
             ORDER BY te.entry_date ASC, e.name ASC, p.name ASC`,
            [department]
        );

        // Query for totals
        const [totals] = await db.query(
            `SELECT 
                FLOOR(SUM(te.minutes) / 60) + SUM(te.hours) AS total_hours, 
                SUM(te.minutes) % 60 AS total_minutes
             FROM time_entries te
             JOIN employees e ON te.employee_id = e.id
             WHERE e.department = ?`,
            [department]
        );

        // Add totals row if any entries exist
        if (totals.length > 0) {
            rows.push({
                entry_date: null, // Null to indicate totals row
                employee_name: null, // Leave employee name blank
                employee_title: null, // Leave title blank
                project_name: null, // Leave project name blank
                hours: totals[0].total_hours,
                minutes: totals[0].total_minutes,
            });
        }

        res.json(rows); // Return time entries with totals
    } catch (error) {
        console.error('Error fetching time entries by department:', error);
        res.status(500).json({ error: error.message });
    }
});


router.get('/all', async (req, res) => {
    console.log('Fetching all employees...');
    try {
        const [rows] = await db.query('SELECT id, name FROM employees');
        res.json(rows); // Return all employees
    } catch (error) {
        console.error('Error fetching all employees:', error);
        res.status(500).json({ error: error.message });
    }
});


router.get('/', async (req, res) => {
    const name = req.query.name;
    if (!name) {
        return res.status(400).json({ error: 'Name query parameter is required' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM employees WHERE name LIKE ?', [`%${name}%`]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No employee found with that name' });
        }
        res.json(rows[0]); // Return the first match
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id', async (req, res) => {
    const employeeId = req.params.id;
    try {
        const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [employeeId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all projects for a specific employee
router.get('/:id/projects', async (req, res) => {
    const employeeId = req.params.id;

    try {
        const [rows] = await db.query(
            `SELECT p.id, p.name, s.name AS status, r.name AS role
             FROM projects p
             JOIN statuses s ON p.status_id = s.id
             JOIN employee_project_roles epr ON p.id = epr.project_id
             JOIN roles r ON epr.role_id = r.id
             WHERE epr.employee_id = ?
             ORDER BY 
                FIELD(s.id, '2', '4', '3', '1')`,
            [employeeId]
        );

        // Log the rows for debugging
        console.log('Projects Response:', rows);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: error.message });
    }
});



  

module.exports = router;

