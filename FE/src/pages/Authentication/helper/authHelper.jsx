import { jwtDecode } from "jwt-decode";

export const getUserFromToken = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        console.warn("Không tìm thấy accessToken trong localStorage!");
        return null;
    }
    try {
        const decodedJWT = jwtDecode(token);
        console.log("Decoded JWT:", decodedJWT);
        return decodedJWT?.data || null;
    } catch (error) {
        console.error("Lỗi khi decode token:", error);
        return null;
    }
};
