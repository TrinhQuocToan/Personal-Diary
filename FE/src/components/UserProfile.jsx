import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdOutlineCancel } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { Button } from ".";
import { userProfileData } from "../data/dummy";
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
        const response = await axiosInstance.get(
          "/api/user/jwt-current"
        );
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
      <div className="nav-item absolute right-1 top-16 bg-white dark:bg-[#42464D] p-8 rounded-lg w-96">
        <p className="text-center dark:text-gray-200">Loading user data...</p>
      </div>
    );
  }

  if (saveError) {
    return (
      <div className="nav-item absolute right-1 top-16 bg-white dark:bg-[#42464D] p-8 rounded-lg w-96">
        <p className="text-center text-red-500">Error: {saveError}</p>
      </div>
    );
  }

  return (
    <div className="nav-item absolute right-1 top-16 bg-white dark:bg-[#42464D] p-8 rounded-lg w-96">
      <div className="flex justify-between items-center">
        <p className="font-semibold text-lg dark:text-gray-200">User Profile</p>
        <Button
          icon={<MdOutlineCancel />}
          color="rgb(153, 171, 180)"
          bgHoverColor="light-gray"
          size="2xl"
          borderRadius="50%"
        />
      </div>
      <div className="flex gap-5 items-center mt-6 border-color border-b-1 pb-6">
        <img
          className="rounded-full h-24 w-24"
          src={
            profile.avatar
              ? `http://localhost:9999${profile.avatar}`
              : avatarPlaceholder
          }
          alt="user-profile"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ marginLeft: "10px" }}
        />
      </div>
      <div>
        <p className="font-semibold text-xl dark:text-gray-200 mt-4">
          {profile.fullName || "Unknown User"}
        </p>
        <p className="text-gray-500 text-sm dark:text-gray-400">
          {profile.gender || "User"}
        </p>
        <p className="text-gray-500 text-sm font-semibold dark:text-gray-400">
          {profile.dob || ""}
        </p>
      </div>
      <div>
        {userProfileData.map((item, index) => (
          <div
            key={index}
            className="flex gap-5 border-b-1 border-color p-4 hover:bg-light-gray cursor-pointer  dark:hover:bg-[#42464D]"
          >
            <button
              type="button"
              style={{ color: item.iconColor, backgroundColor: item.iconBg }}
              className=" text-xl rounded-lg p-3 hover:bg-light-gray"
            >
              {item.icon}
            </button>

            <div>
              <p className="font-semibold dark:text-gray-200 ">{item.title}</p>
              <p className="text-gray-500 text-sm dark:text-gray-400">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <button
          className={`w-full p-3 rounded-[10px] text-white`}
          style={{ backgroundColor: currentColor }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
