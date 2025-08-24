import axios from "axios";
const axiosInstance = axios.create({
    baseURL: "http://localhost:9999",
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Chỉ redirect nếu không phải đang ở trang login
            const currentPath = window.location.pathname;
            if (currentPath !== "/login" && currentPath !== "/register") {
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
