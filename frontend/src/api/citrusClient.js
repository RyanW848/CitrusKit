import axios from 'axios';

const cirtusClient = axios.create({
    baseURL: process.env.BACKEND,
});

citrusClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default citrusClient;