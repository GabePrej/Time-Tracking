import api from './api';

export const fetchEmployees = async () => {
    const response = await api.get('/employees');
    return response.data;
};
