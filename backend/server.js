require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const employeesRoutes = require('./routes/employees');
const projectsRoutes = require('./routes/projects');
const rolesRoutes = require('./routes/roles');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/employees', employeesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/reports', reportsRoutes);

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
