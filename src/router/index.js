import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../components/HelloWorld.vue';
import EmployeesPage from '../components/EmployeeList.vue';
import SupervisorView from '../components/SupervisorView.vue';

const routes = [
    { path: '/', name: 'Home', component: HomePage },
    { path: '/employeeView', name: 'Employees', component: EmployeesPage },
    { path: '/reports', name: 'Supervisor', component: SupervisorView },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
