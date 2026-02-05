import axios from 'axios';

// Create an instance with default config
const api = axios.create({
    baseURL: 'http://localhost:5232/api', // Adjust port if needed based on dotnet launch
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
