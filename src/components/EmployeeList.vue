<template>
  <div>
    <h2>Find Employee by ID or Name</h2>
    <div class="search-bar">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Enter Employee ID or Name"
        @keyup.enter="fetchEmployeeDetails"
      />
      <button @click="fetchEmployeeDetails">Search</button>
    </div>

    <!-- Mini Calendar -->
    <div class="calendar">
      <div
        v-for="date in last7Days"
        :key="date.date"
        :class="['calendar-day', { selected: date.date === selectedDate }]"
        @click="selectDate(date.date)"
      >
        <p>{{ date.day }}</p>
        <p>{{ date.date }}</p>
      </div>
    </div>

    <!-- Display employee details if found -->
    <div v-if="employeeDetails && activeProjects.length">
      <h3>Projects Assigned to {{ employeeDetails.name }}</h3>
      <div v-for="project in activeProjects" :key="project.id" class="project">
        <p>
          <strong>{{ project.name }}</strong> (Role: {{ project.role }})
        </p>

        <!-- Display time logged or placeholder -->
        <div v-if="project.timeLogged && !project.editing" >
          <p>
            <strong>Time Logged:</strong> {{ project.hours }} hours and
            {{ project.minutes }} minutes
          </p>
          <button @click="editTime(project)">Edit Time</button>
        </div>

        <div v-else-if="!project.timeLogged || project.editing">
          <p v-if="!project.timeLogged">No time logged for the selected day.</p>
          <p v-else><strong>Editing Time:</strong></p>

          <label for="hours">Hours:</label>
          <select
            v-model="project.hours"
            id="hours"
          >
            <option v-for="hour in hours" :key="hour" :value="hour">{{ hour }}</option>
          </select>

          <label for="minutes">Minutes:</label>
          <select
            v-model="project.minutes"
            id="minutes"
          >
            <option v-for="minute in minutes" :key="minute" :value="minute">
              {{ minute }}
            </option>
          </select>

          <button @click="submitTime(project, selectedDate)">Save</button>
        </div>
      </div>
    </div>

    <!-- Display error message -->
    <p v-if="error" style="color: red;">{{ error }}</p>
  </div>
</template>



  
  <script>

  
  import api from '../services/api';
  
  export default {
    data() {
      return {
        searchQuery: "", // Input for ID or name
        employeeDetails: null, // Fetched employee details
        projects: [], // List of projects the employee is working on
        activeProjects: [], // Projects with status not completed or on hold
        last7Days: [], // List of the last 7 days
        selectedDate: null, // Currently selected date
        error: null, // Error message
        hours: Array.from({ length: 13 }, (_, i) => i), // 0 to 12 hours
        minutes: [0, 15, 30, 45], // 15-minute increments
      };
    },
    methods: {
      generateLast7Days() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
    });
  }
  this.last7Days = days;
  if (!this.selectedDate) {
    this.selectedDate = days[6].date; // Default to the most recent day (today)
  }
},

    selectDate(date) {
      this.selectedDate = date;
      this.fetchTimeEntries(); // Fetch time entries for the selected day

    },
    formatDate(date) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(date).toLocaleDateString('en-US', options);
    },
    editTime(project) {
      project.editing = true; // Toggle editing mode
    },
    
    async fetchEmployeeDetails() {
  console.log('fetchEmployeeDetails triggered'); // Debug log
  this.error = null;
  this.activeProjects = [];
  this.projects = [];
  this.employeeDetails = null;

  if (!this.searchQuery) {
    this.error = "Please enter a valid Employee ID or Name.";
    return;
  }

  // Ensure selectedDate is valid
  if (!this.selectedDate) {
    this.generateLast7Days();
  }

  try {
    let employeeResponse;

    if (!isNaN(this.searchQuery)) {
      employeeResponse = await api.get(`/employees/${this.searchQuery}`);
    } else {
      const nameQuery = this.searchQuery.trim();
      employeeResponse = await api.get(
        `/employees?name=${encodeURIComponent(nameQuery)}`
      );
    }

    this.employeeDetails = employeeResponse.data;

    const projectsResponse = await api.get(
      `/employees/${this.employeeDetails.id}/projects`
    );
    this.projects = projectsResponse.data;

    this.activeProjects = await Promise.all(
      this.projects
        .filter((project) => project.status !== "complete") // Exclude completed projects
        .map(async (project) => {
          const timeResponse = await api.get(
            `/projects/${project.id}/time?employeeId=${this.employeeDetails.id}&date=${this.selectedDate}`
          );
          const timeData = timeResponse.data || { hours: 0, minutes: 0 };

          return {
            ...project,
            hours: timeData.hours,
            minutes: timeData.minutes,
            timeLogged: timeData.hours > 0 || timeData.minutes > 0,
            editing: false, // Add editing mode for each project
          };
        })
    );
  } catch (err) {
    this.error = "Employee not found or unable to fetch data.";
    console.error(err);
  }
},


      getStatusColor(status) {
        switch (status) {
            case 'complete':
                return 'green';
            case 'in progress':
                return 'lightgreen';
            case 'on hold':
                return 'yellow';
            case 'planning':
                return 'blue';
            default:
                return 'white'; // Default color for unknown statuses
        }
    },
    async fetchTimeEntries() {
  this.activeProjects = await Promise.all(
    this.activeProjects.map(async (project) => {
      try {
        const timeResponse = await api.get(
          `/projects/${project.id}/time?employeeId=${this.employeeDetails.id}&date=${this.selectedDate}`
        );
        const timeData = timeResponse.data || { hours: 0, minutes: 0 };

        return {
          ...project,
          hours: timeData.hours,
          minutes: timeData.minutes,
          timeLogged: timeData.hours > 0 || timeData.minutes > 0,
        };
      } catch (err) {
        console.error(`Failed to fetch time for project ${project.id}:`, err);
        return project; // Preserve the project as-is on failure
      }
    })
  );
}, // <-- Correctly close fetchTimeEntries method


async submitTime(project, date) {
  try {
    const response = await api.post(`/projects/${project.id}/time`, {
      employeeId: this.employeeDetails.id,
      date,
      hours: project.hours,
      minutes: project.minutes,
    });

    alert(`Time logged successfully for ${project.name} on ${this.formatDate(date)}!`);
    project.timeLogged = true; // Mark as logged
    project.editing = false; // Exit editing mode
    console.log(response.data);
  } catch (err) {
    this.error = "Failed to log time. Please try again.";
    console.error(err);
  }
},


  mounted() {
    this.generateLast7Days();
  },
},
  }
  
  </script>
  
  <style>
  .project {
  border: 2px solid transparent;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 5px;
  position: relative;
  transition: box-shadow 0.3s ease-in-out;
  background-color: white;
}

.project:hover {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

/* Glowing border for each status */
.status-in-progress {
  box-shadow: 0 0 10px 2px lightgreen;
  border-color: lightgreen;
}

.status-planning {
  box-shadow: 0 0 10px 2px blue;
  border-color: blue;
}

.status-on-hold {
  box-shadow: 0 0 10px 2px yellow;
  border-color: yellow;
}

.status-complete {
  box-shadow: 0 0 10px 2px green;
  border-color: green;
}

  .search-bar {
    margin-bottom: 20px;
  }
  label {
    margin-right: 10px;
  }
  select {
    margin-right: 20px;
    padding: 5px;
  }
  button {
    padding: 5px 10px;
    margin-top: 10px;
  }
  .error {
    color: red;
    font-weight: bold;
  }

  .calendar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}


.calendar-day {
  width: 100px;
  text-align: center;
  padding: 10px;
  border: 2px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.calendar-day.selected {
  background-color: lightblue;
  border-color: blue;
}

.calendar-day:hover {
  background-color: #f0f8ff;
}

  </style>
  