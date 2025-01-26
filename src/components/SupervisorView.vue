<template>
  <div>
    <h2>Reports</h2>

    <!-- Dropdowns to toggle queries -->
    <div class="dropdown-grid">
      <select id="employeeDropdown" v-model="selectedEmployee" @change="fetchEmployeeReport">
        <option disabled value="">Select an Employee</option>
        <option v-for="employee in employees" :key="employee.id" :value="employee.name">
          {{ employee.name }}
        </option>
      </select>

      <select id="projectDropdown" v-model="selectedProject" @change="fetchProjectReport">
        <option disabled value="">Select a Project</option>
        <option v-for="project in projects" :key="project.id" :value="project.name">
          {{ project.name }}
        </option>
      </select>

<select id="departmentDropdown" v-model="selectedDepartment" @change="fetchDepartmentReport">
  <option disabled value="">Select a Department</option>
  <option v-for="department in departments" :key="department" :value="department">
    {{ department }}
  </option>
</select>


      
      
    </div>

    <div class="button-row">
        <button @click="generateReport">Generate</button>
        <button @click="resetFilters">Reset</button>
      </div>
    

    <!-- Display results -->
    <div class="results">
      <h3>Results</h3>

      <div v-if="selectedEmployee && !selectedProject && employeeReport.length > 0">
  <h4>Employee Report for {{ selectedEmployee }}</h4>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Project</th>
        <th>Hours</th>
        <th>Minutes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="entry in employeeReport" :key="entry.entry_date + (entry.project_name || 'total')">
        <td v-if="entry.entry_date">{{ entry.entry_date }}</td>
        <td>{{ entry.project_name }}</td>
        <td>{{ entry.hours }}</td>
        <td>{{ entry.minutes }}</td>
      </tr>
    </tbody>
  </table>
</div>
>


      <!-- Project Report Results -->
      <div v-if="selectedProject && !selectedEmployee && projectReport.length > 0">
  <h4>Project Report for {{ selectedProject }}</h4>
  <table>
    <thead>
      <tr>
        <th>Employee</th>
        <th>Date</th>
        <th>Hours</th>
        <th>Minutes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="entry in projectReport" :key="entry.entry_date + (entry.employee_name || 'total')">
        <td v-if="entry.entry_date">{{ entry.employee_name }}</td>
        <td v-else><strong>{{ entry.employee_name }}</strong></td>
        <td>{{ entry.entry_date || '-' }}</td>
        <td>{{ entry.hours }}</td>
        <td>{{ entry.minutes }}</td>
      </tr>
    </tbody>
  </table>
</div>


      <!-- Employee-Project Report Results -->
      <div v-if="selectedEmployee && selectedProject && employeeProjectReport.length > 0">
  <h4>Report for {{ selectedEmployee }} on {{ selectedProject }}</h4>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Hours</th>
        <th>Minutes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="entry in employeeProjectReport" :key="entry.entry_date || 'totals'">
        <td v-if="entry.entry_date">{{ entry.entry_date }}</td>
        <td v-else><strong>Total</strong></td>
        <td>{{ entry.hours }}</td>
        <td>{{ entry.minutes }}</td>
      </tr>
    </tbody>
  </table>
</div>


      <!-- Display Department Report -->
      <div v-if="selectedDepartment && !selectedEmployee && !selectedProject && departmentReport.length > 0">
  <h4>Department Time Entries for {{ selectedDepartment }}</h4>
  <table>
    <thead>
      <tr>
        <th>Employee</th>
        <th>Title</th>
        <th>Project</th>
        <th>Date</th>
        <th>Hours</th>
        <th>Minutes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="entry in departmentReport" :key="entry.entry_date + entry.employee_name + entry.project_name">
        <td>{{ entry.employee_name || 'Total' }}</td>
        <td>{{ entry.employee_title || '' }}</td>
        <td>{{ entry.project_name || '' }}</td>
        <td>{{ entry.entry_date || '' }}</td>
        <td>{{ entry.hours }}</td>
        <td>{{ entry.minutes }}</td>
      </tr>
    </tbody>
  </table>
</div>



<p v-else>No data available for the selected department.</p>


      <!-- Message if no data -->
      <p v-if="!employeeReport.length && !projectReport.length && !departmentReport.length">
        No data to display. Select a filter to view results.
      </p>
    </div>
  </div>
</template>

<script>
import api from '../services/api';

export default {
  data() {
    return {
      employees: [], // List of employees for the dropdown
      projects: [], // List of projects for the dropdown
      selectedEmployee: "", // Selected employee
      selectedProject: "", // Selected project
      employeeReport: [], // Results for the employee report
      projectReport: [], // Results for the project report
      employeeProjectReport: [],
      selectedDepartment: "",
      departments: [], // Define your department options
      departmentReport: [], // To store the fetched department data
    };
  },

  
  methods: {

    async fetchDepartments() {
  try {
    const response = await api.get('/employees/departmentList'); // Use the new route
    this.departments = response.data.map((row) => row.department); // Map response to department list
  } catch (err) {
    console.error('Error fetching departments:', err);
  }
},

    async fetchDepartmentReport() {
  if (!this.selectedDepartment) {
    console.error('No department selected');
    return;
  }

  try {
    const response = await api.get('/employees/department', {
      params: { department: this.selectedDepartment },
    });
    this.departmentReport = response.data; // Update the department report with the fetched data
    console.log(`Department Report for ${this.selectedDepartment}:`, this.departmentReport);
  } catch (err) {
    console.error('Error fetching department report:', err);
  }
},

    async fetchEmployees() {
  try {
    const response = await api.get('/employees/all'); // Correct endpoint
    this.employees = response.data;
  } catch (err) {
    console.error('Error fetching employees:', err);
  }
},

    async fetchProjects() {
      try {
        const response = await api.get('/projects');
        this.projects = response.data;
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    },

    async fetchProjectReport() {
  if (!this.selectedProject) {
    console.error("No project selected");
    return;
  }

  try {
    const response = await api.get("/reports/project", {
      params: { name: this.selectedProject },
    });
    this.projectReport = response.data;
    this.employeeReport = [];
    this.departmentReport = [];
    this.employeeProjectReport = [];
  } catch (err) {
    console.error("Error fetching project report:", err);
  }
},

    async fetchEmployeeReport() {
        if (!this.selectedEmployee) return;
        try {
            const response = await api.get('/reports/employee', {
                params: { name: this.selectedEmployee },
            });
            this.employeeReport = response.data;
            this.projectReport = [];
            this.employeeProjectReport = [];
        } catch (err) {
            console.error('Error fetching employee report:', err);
        }
    },
    async generateReport() {
  // Clear previous reports
  this.employeeReport = [];
  this.projectReport = [];
  this.employeeProjectReport = [];

  try {
        // If only an employee is selected
        if (this.selectedEmployee && !this.selectedProject && !this.selectedDepartment) {
          const response = await api.get('/reports/employee', {
            params: { name: this.selectedEmployee },
          });
          this.employeeReport = response.data;
        }

        // If only a project is selected
        if (this.selectedProject && !this.selectedEmployee && !this.selectedDepartment) {
          const response = await api.get('/reports/project', {
            params: { name: this.selectedProject },
          });
          this.projectReport = response.data;
        }

        // If only a department is selected
        if (this.selectedDepartment && !this.selectedEmployee && !this.selectedProject) {
          const response = await api.get('/employees/department', {
            params: { department: this.selectedDepartment },
          });
          this.departmentReport = response.data;
        }

        // If both an employee and a project are selected
        if (this.selectedEmployee && this.selectedProject && !this.selectedDepartment) {
          const response = await api.get('/reports/employee-project', {
            params: { employee: this.selectedEmployee, project: this.selectedProject },
          });
          this.employeeProjectReport = response.data;
        }
      } catch (err) {
        console.error('Error generating report:', err);
      }
    },
    resetFilters() {
      this.selectedEmployee = "";
      this.selectedProject = "";
      this.selectedDepartment = "";
      this.employeeReport = [];
      this.projectReport = [];
      this.departmentReport = [];
    },
  },
  mounted() {
    this.fetchEmployees();
    this.fetchProjects();
    this.fetchDepartments(); // Fetch departments on mount
  },
};
</script>

<style>
/* Centering all elements and setting a fixed width for the template */
.dropdown-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr; /* Three equal-width columns */
  gap: 20px; /* Space between columns */
  margin-bottom: 20px; /* Space below the dropdown grid */
  text-align: left; /* Align labels and dropdowns to the left */
}

.dropdown-grid div {
  display: flex;
  flex-direction: column;
}

/* Center Buttons Below the Dropdowns */
.button-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 20px;
  gap: 50px;
}

.button-row div {
  display: flex;
  flex-direction: column;
}

.results {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  max-width: 1200px;
}

/* Styling for dropdowns */
select {
  padding: 10px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  margin: 10px 0;
  outline: none;
}

/* Styling specific dropdowns */
#projectDropdown {
  background-color: #3580C3;
  color: white;
}

#departmentDropdown {
  background-color: #10A049;
  color: white;
}

/* Styling for tables */
table {
  width: 100%;
  max-width: 1200px;
  border-collapse: collapse;
  margin: 20px 0;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

th, td {
  padding: 10px;
  border: 1px solid #ddd;
}

th {
  background-color: #f4f4f4;
  font-weight: bold;
}

/* Alternate row colors */
tbody tr:nth-child(odd) {
  background-color: white;
}

tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

/* Center text in all table cells */
th, td {
  text-align: center;
}

/* Center the entire template */
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  margin: 0;
  font-family: Arial, sans-serif;
}
</style>
