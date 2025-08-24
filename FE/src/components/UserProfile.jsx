import React, { useEffect, useState } from "react";
import {
  MdOutlineCancel,
  MdCameraAlt,
  MdSettings,
  MdAccountBox,
  MdNotifications,
  MdSecurity,
  MdHelp,
  MdLogout,
  MdEdit,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { useStateContext } from "../contexts/ContextProvider";
import avatarPlaceholder from "../data/avatar.jpg";
import axiosInstance from "../pages/Authentication/helper/axiosInstance";

const UserProfile = () => {
  const { currentColor, setIsLoggedIn } = useStateContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    _id: "",
    fullName: "",
    dob: "",
    gender: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axiosInstance.get("/api/user/jwt-current");
        setProfile({
          _id: response.data._id || "",
          fullName: response.data.fullName || "",
          dob: response.data.dob ? response.data.dob.split("T")[0] : "",
          gender: response.data.gender || "",
          avatar: response.data.avatar || "",
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error.response || error);
        setLoading(false);
        setSaveError("Failed to fetch user data.");
      }
    };
    fetchCurrentUser();
  }, []);

  const handleLogout = () => {
    try {
      // Clear local storage
      localStorage.removeItem("token");

      // Update authentication state
      if (setIsLoggedIn) {
        setIsLoggedIn(false);
      }

      // Redirect to login page with page reload to ensure clean state
      window.location.href = "/login";

      // Alternative: using navigate (might need page reload)
      // navigate("/login", { replace: true });
      // window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      setSaveError("Logout failed. Please try again.");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const token = localStorage.getItem("accessToken");
      const response = await axiosInstance.post(
        `/api/user/${profile._id}/avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProfile((prev) => ({ ...prev, avatar: response.data.avatar }));
    } catch (error) {
      console.error("Error uploading avatar:", error.response || error);
      setSaveError("Failed to upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed right-4 top-16 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading user data...</span>
        </div>
      </div>
    );
  }

  if (saveError) {
    return (
      <div className="fixed right-4 top-16 w-96 bg-white rounded-3xl shadow-2xl border border-red-200 p-8">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <p className="text-red-600">{saveError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-16 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-md bg-opacity-98 z-50">
      {/* Header với gradient background */}
      <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        <div className="relative flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">User Profile</h3>
          <button
            type="button"
            onClick={() => { }}
            className="text-2xl p-3 hover:drop-shadow-xl hover:bg-light-gray rounded-full"
            style={{ color: "rgb(153, 171, 180)" }}
          >
            <MdOutlineCancel />
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-2 right-16 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-8 w-8 h-8 bg-white/5 rounded-full blur-lg"></div>
      </div>

      {/* Avatar Section */}
      <div className="px-6 pt-4 pb-2 -mt-8 relative z-10">
        <div className="flex flex-col items-center">
          <div className="relative group mb-4">
            {/* Avatar container với hiệu ứng 3D */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 p-0.5 shadow-lg transform group-hover:scale-105 transition-all duration-300">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-white">
                  {profile.avatar ? (
                    <img
                      src={`http://localhost:9999${profile.avatar}`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={avatarPlaceholder}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Status indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </div>

          {/* User info */}
          <div className="text-center mb-4">
            <h4 className="font-bold text-gray-800 text-lg mb-1 flex items-center justify-center gap-2">
              {profile.fullName || "Unknown User"}
              <MdEdit
                className="text-gray-400 text-sm cursor-pointer hover:text-blue-500 transition-colors"
                onClick={() => navigate("/profile")}
              />
            </h4>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-6 pb-6">
        <button
          onClick={handleLogout}
          className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group text-white`}
          style={{ backgroundColor: currentColor }}
        >
          <MdLogout className="text-lg group-hover:translate-x-1 transition-transform duration-200" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
