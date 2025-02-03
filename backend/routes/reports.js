const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Get all time entries for a specific employee
router.get('/employee', async (req, res) => {
    let { names } = req.query;

    if (!names || !Array.isArray(names)) {
        return res.status(400).json({ error: 'Employee names are required as an array' });
    }

    if (typeof names === "string") {
        names = [names]; // Convert to array if only one name is passed
    }

    try {
        const [rows] = await db.query(
            `SELECT
                e.name AS employee_name, 
                te.entry_date, 
                p.name AS project_name, 
                te.hours, 
                te.minutes 
             FROM time_entries te
             JOIN projects p ON te.project_id = p.id
             JOIN employees e ON te.employee_id = e.id
             WHERE e.name IN (?)
             ORDER BY te.entry_date ASC, p.name ASC;`,
            [names] 
        );

        let totalHours = 0;
        let totalMinutes = 0;

        rows.forEach(entry => {
            totalHours += entry.hours;
            totalMinutes += entry.minutes;
        });

        // ✅ Convert minutes to hours
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60; // Remainder stays in minutes

        // ✅ Append totals at the end of the response
        rows.push({
            employee_name: "TOTALS",
            entry_date: "TOTALS",
            project_name: "All Projects",
            hours: totalHours,
            minutes: totalMinutes
        });

        res.json(rows);
    } catch (error) {
        console.error('Error fetching time entries for employees:', error);
        res.status(500).json({ error: error.message });
    }
});




// Get all time entries for a specific project
router.get('/project', async (req, res) => {
    let { names } = req.query;

    if (!names) {
        return res.status(400).json({ error: 'Project names are required' });
    }

    if (!Array.isArray(names)) {
        names = [names]; // Convert single string to an array
    }
    
    try {
        // ✅ Fetch all time entries for the selected projects
        const [rows] = await db.query(
            `SELECT 
                p.name AS project_name, 
                te.entry_date, 
                e.name AS employee_name, 
                te.hours, 
                te.minutes 
             FROM time_entries te
             JOIN projects p ON te.project_id = p.id
             JOIN employees e ON te.employee_id = e.id
             WHERE p.name IN (?)
             ORDER BY te.entry_date ASC, e.name ASC;`,
            [names] 
        );

        let totalHours = 0;
        let totalMinutes = 0;

        // ✅ Calculate totals
        rows.forEach(entry => {
            totalHours += entry.hours;
            totalMinutes += entry.minutes;
        });

        // ✅ Convert excess minutes to hours
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;

        // ✅ Append totals at the end
        rows.push({
            project_name: "TOTALS",
            entry_date: "TOTALS",
            employee_name: "All Employees",
            hours: totalHours,
            minutes: totalMinutes
        });

        res.json(rows);
    } catch (error) {
        console.error('Error fetching time entries for projects:', error);
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
