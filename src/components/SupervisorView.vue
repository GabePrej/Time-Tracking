<template>
  <div>
    <h2>Reports</h2>

    <!-- Dropdowns to toggle queries -->
    <div class="dropdown-grid">


<select id="employeeDropdown" v-model="selectedEmployees" @change="handleEmployeeSelection" multiple>
        <option disabled value="">Select an Employee</option>
        <option v-for="employee in employees" :key="employee.id" :value="employee.name">
          {{ employee.name }}
        </option>
      </select>

      <select id="projectDropdown" v-model="selectedProjects" multiple @change="fetchProjectReport" >
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

<!-- Combined Dynamic Filter Buttons -->
<div v-if="selectedEmployees.length > 0 || selectedProjects.length > 0" class="filter-buttons">
  <p>Active Filters:</p>
  <div class="filters-container">
    <!-- Employee Filters -->
    <button 
      v-for="(employee, index) in selectedEmployees" 
      :key="'employee-' + index" 
      @click="removeEmployeeFilter(employee)">
      {{ employee }} ✖
    </button>

    <!-- Project Filters -->
    <button 
      v-for="(project, index) in selectedProjects" 
      :key="'project-' + index" 
      @click="removeProjectFilter(project)">
      {{ project }} ✖
    </button>
  </div>
</div>



    <div class="button-row">
        <button @click="generateReport">Generate</button>
        <button @click="resetFilters">Reset</button>
      </div>
    

    <!-- Display results -->
    <div class="results">
      <h3>Results</h3>

      <div v-if="selectedEmployees.length > 0 && !selectedProject && employeeReport.length > 0">
  <h4>Employee Report for {{ selectedEmployees.join(',') }}</h4>
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
      <div v-if="selectedEmployees.length > 0 && selectedProject && employeeProjectReport.length > 0">
  <h4>Report for {{ selectedEmployees.join(',') }} on {{ selectedProject }}</h4>
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
      selectedEmployees: [], // List of selected employees (Updated from single employee)
      selectedProjects: [], // Selected project
      employeeReport: [], // Results for the employee report
      projectReport: [], // Results for the project report
      employeeProjectReport: [],
      selectedDepartment: "",
      departments: [], // Define your department options
      departmentReport: [], // To store the fetched department data
    };
  },

  methods: {

    removeEmployeeFilter(employee) {
    this.selectedEmployees = this.selectedEmployees.filter(name => name !== employee);
    this.fetchEmployeeReport(); // Update report when a filter is removed
  },

  removeProjectFilter(project) {
  this.selectedProjects = this.selectedProjects.filter(name => name !== project);
  this.fetchProjectReport(); // Update the report when a filter is removed
},


    async fetchDepartments() {
      try {
        const response = await api.get('/employees/departmentList');
        this.departments = response.data.map((row) => row.department);
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
        this.departmentReport = response.data;
      } catch (err) {
        console.error('Error fetching department report:', err);
      }
    },

    async fetchEmployees() {
      try {
        const response = await api.get('/employees/all');
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
  if (this.selectedProjects.length === 0) return;

  try {
    const response = await api.get('/reports/project', {
      params: { names: this.selectedProjects }, // Send array directly
      paramsSerializer: params => {
        if (!Array.isArray(params.names)) {
          return `names[]=${encodeURIComponent(params.names)}`; // Fix for single project
        }
        return params.names.map(name => `names[]=${encodeURIComponent(name)}`).join('&');
      }
    });

    console.log("Project Report API Response:", response.data); // Debugging

    this.projectReport = Object.assign([], response.data);
    this.$forceUpdate(); // 🚀 Forces Vue to re-render
    this.employeeReport = [];
    this.departmentReport = [];
    this.employeeProjectReport = [];
  } catch (err) {
    console.error('Error fetching project report:', err);
  }
},



    async fetchEmployeeReport() {
  if (this.selectedEmployees.length === 0) return;

  try {
    const response = await api.get('/reports/employee', {
      params: { names: this.selectedEmployees }, // Send array directly
      paramsSerializer: params => {
        return params.names.map(name => `names[]=${encodeURIComponent(name)}`).join('&'); // Serialize array properly
      }
    });
    console.log("Employee Report API Response:", response.data); // Debugging
    this.employeeReport = response.data;
    this.projectReport = [];
    this.employeeProjectReport = [];
  } catch (err) {
    console.error('Error fetching employee report:', err);
  }
}
,

handleEmployeeSelection(event) {
  this.selectedEmployees = Array.isArray(event.target.selectedOptions)
    ? Array.from(event.target.selectedOptions).map(option => option.value)
    : [event.target.value]; // Ensure it's an array

  this.fetchEmployeeReport();
},

handleProjectSelection(event) {
  this.selectedProjects = Array.isArray(event.target.selectedOptions)
    ? Array.from(event.target.selectedOptions).map(option => option.value)
    : [event.target.value]; // Ensure it's an array

  this.fetchProjectReport();
},





async generateReport() {
  this.employeeReport = [];
  this.projectReport = [];
  this.employeeProjectReport = [];

  try {
    // If multiple employees selected
    if (this.selectedEmployees.length > 0 && this.selectedProjects.length === 0 && !this.selectedDepartment) {
      const response = await api.get('/reports/employee', {
        params: { names: this.selectedEmployees },
        paramsSerializer: params => {
          if (!Array.isArray(params.names)) {
            return `names[]=${encodeURIComponent(params.names)}`;
          }
          return params.names.map(name => `names[]=${encodeURIComponent(name)}`).join('&');
        }
      });
      this.employeeReport = response.data;
    }

    // If multiple projects selected
    if (this.selectedProjects.length > 0 && this.selectedEmployees.length === 0 && !this.selectedDepartment) {
      const response = await api.get('/reports/project', {
        params: { names: this.selectedProjects },
        paramsSerializer: params => {
          if (!Array.isArray(params.names)) {
            return `names[]=${encodeURIComponent(params.names)}`;
          }
          return params.names.map(name => `names[]=${encodeURIComponent(name)}`).join('&');
        }
      });
      this.projectReport = response.data;
    }

    // If both employees and projects are selected
    if (this.selectedEmployees.length > 0 && this.selectedProjects.length > 0 && !this.selectedDepartment) {
      const response = await api.get('/reports/employee-project', {
        params: { employees: this.selectedEmployees, projects: this.selectedProjects },
        paramsSerializer: params => {
          const employees = params.employees.map(name => `employees[]=${encodeURIComponent(name)}`).join('&');
          const projects = params.projects.map(name => `projects[]=${encodeURIComponent(name)}`).join('&');
          return `${employees}&${projects}`;
        }
      });
      this.employeeProjectReport = response.data;
    }
  } catch (err) {
    console.error('Error generating report:', err);
  }
},




    resetFilters() {
      this.selectedEmployees = []; // Reset the selected employees array
      this.selectedProjects =[];
      this.selectedDepartment = "";
      this.employeeReport = [];
      this.projectReport = [];
      this.departmentReport = [];
      this.employeeProjectReport = [];
    },
  },

  mounted() {
    this.fetchEmployees();
    this.fetchProjects();
    this.fetchDepartments();
  },
};

</script>

<style>


/* Apply modern, sleek design */
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f4f6f9; /* Light modern background */
  margin: 0;
  font-family: "Inter", sans-serif;
}

/* Main container */
.results {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  max-width: 1200px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* Dropdown Grid */
.dropdown-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Three equal columns */
  gap: 15px;
  margin-bottom: 20px;
}

/* Dropdown Styling */
select {
  padding: 12px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: 0.3s;
}

select:hover {
  border-color: #3580C3;
}

/* Project Dropdown */
#projectDropdown {
  background-color: #3580C3;
  color: white;
  border: none;
  font-weight: bold;
}

#projectDropdown:hover {
  background-color: #2b6aa8;
}

/* Department Dropdown */
#departmentDropdown {
  background-color: #10A049;
  color: white;
  border: none;
  font-weight: bold;
}

#departmentDropdown:hover {
  background-color: #0d8b3c;
}

/* Centered Buttons */
.button-row {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.button-row button {
  background: #3580C3;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s ease-in-out;
  margin-bottom: 15px;
}

.button-row button:hover {
  background: #2b6aa8;
}

/* Filter Button Container */
.filter-buttons {
  margin-top: 20px;
  padding: 15px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Filter Buttons */
.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.filters-container button {
  color: #333;
  border: none;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: 0.3s ease;
}

.filters-container button:hover {
  background-color: #cc0000;
}

/* Table Styling */
table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
}

/* Table Headers */
th {
  background-color: #3580C3;
  color: white;
  font-weight: bold;
  padding: 12px;
  text-transform: uppercase;
}

/* Table Cells */
td {
  padding: 12px;
  border-bottom: 1px solid #ddd;
}

/* Alternate row colors */
tbody tr:nth-child(odd) {
  background-color: white;
}

tbody tr:nth-child(even) {
  background-color: #f7f9fc;
}

/* Hover effect */
tbody tr:hover {
  background-color: #eef3f7;
}

</style>
