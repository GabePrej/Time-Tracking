const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Get all time entries for a specific employee
router.get('/employee', async (req, res) => {
    const { names } = req.query; // Get employee names as an array from query params

    if (!names || !Array.isArray(names) || names.length === 0) {
        return res.status(400).json({ error: 'Employee names are required as an array' });
    }

    try {
        const placeholders = names.map(() => '?').join(', '); // Create placeholders for the query
        const [rows] = await db.query(
            `SELECT 
                te.entry_date, 
                p.name AS project_name, 
                te.hours, 
                te.minutes,
                e.name AS employee_name
             FROM time_entries te
             JOIN projects p ON te.project_id = p.id
             JOIN employees e ON te.employee_id = e.id
             WHERE e.name IN (${placeholders})
             ORDER BY te.entry_date ASC, e.name ASC, p.name ASC`,
            names
        );

        // Calculate totals for the selected employees
        const [totals] = await db.query(
            `SELECT 
                FLOOR(SUM(te.minutes) / 60) + SUM(te.hours) AS total_hours, 
                SUM(te.minutes) % 60 AS total_minutes
             FROM time_entries te
             JOIN employees e ON te.employee_id = e.id
             WHERE e.name IN (${placeholders})`,
            names
        );

        if (totals.length > 0) {
            rows.push({
                entry_date: null,
                project_name: null,
                employee_name: 'Total',
                hours: totals[0].total_hours,
                minutes: totals[0].total_minutes,
            });
        }

        res.json(rows);
    } catch (error) {
        console.error('Error fetching time entries for employees:', error);
        res.status(500).json({ error: error.message });
    }
});




// Get all time entries for a specific project
router.get('/project', async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
    }

    try {
        // Query to get all time entries for the project
        const [rows] = await db.query(
            `SELECT 
                te.entry_date, 
                e.name AS employee_name, 
                te.hours, 
                te.minutes 
             FROM time_entries te
             JOIN projects p ON te.project_id = p.id
             JOIN employees e ON te.employee_id = e.id
             WHERE p.name = ?
             ORDER BY te.entry_date ASC, e.name ASC`,
            [name]
        );

        // Query to calculate normalized totals
        const [totals] = await db.query(
            `SELECT 
                FLOOR(SUM(te.minutes) / 60) + SUM(te.hours) AS total_hours, 
                SUM(te.minutes) % 60 AS total_minutes
             FROM time_entries te
             JOIN projects p ON te.project_id = p.id
             WHERE p.name = ?`,
            [name]
        );

        if (totals.length > 0) {
            rows.push({
                entry_date: null, // Null indicates this is the totals row
                employee_name: "Total",
                hours: totals[0].total_hours,
                minutes: totals[0].total_minutes,
            });
        }

        res.json(rows);
    } catch (error) {
        console.error('Error fetching time entries for project:', error);
        res.status(500).json({ error: error.message });
    }
});




// Get all time entries for a specific employee on a specific project
router.get('/employee-project', async (req, res) => {
    const { employee, project } = req.query;

    if (!employee || !project) {
        return res.status(400).json({ error: 'Both employee and project names are required' });
    }

    try {
        // Query to fetch all relevant time entries
        const [rows] = await db.query(
            `SELECT 
                te.entry_date, 
                te.hours, 
                te.minutes 
             FROM time_entries te
             JOIN projects p ON te.project_id = p.id
             JOIN employees e ON te.employee_id = e.id
             WHERE e.name = ? AND p.name = ?
             ORDER BY te.entry_date ASC`,
            [employee, project]
        );

        // Query to calculate totals with normalized minutes
        const [totals] = await db.query(
            `SELECT 
                FLOOR(SUM(te.minutes) / 60) + SUM(te.hours) AS total_hours, 
                SUM(te.minutes) % 60 AS total_minutes
             FROM time_entries te
             JOIN projects p ON te.project_id = p.id
             JOIN employees e ON te.employee_id = e.id
             WHERE e.name = ? AND p.name = ?`,
            [employee, project]
        );

        // Add totals row if any entries exist
        if (totals.length > 0) {
            rows.push({
                entry_date: null, // Null indicates totals row
                hours: totals[0].total_hours,
                minutes: totals[0].total_minutes,
            });
        }

        res.json(rows);
    } catch (error) {
        console.error('Error fetching time entries for employee on project:', error);
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
