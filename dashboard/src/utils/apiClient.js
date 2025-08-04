import axios from 'axios';

// Create axios instance with interceptors
const apiClient = axios.create();

// Store the logout function to be set by App component
let logoutFunction = null;

export const setLogoutFunction = (logoutFn) => {
    logoutFunction = logoutFn;
};

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // If we get 401 unauthorized, auto-logout
        if (error.response?.status === 401 && logoutFunction) {
            console.log('Authentication expired, logging out...');
            logoutFunction();
        }
        return Promise.reject(error);
    }
);

export default apiClient;
