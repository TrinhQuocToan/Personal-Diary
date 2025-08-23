import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UserProfile.css";
import axiosInstance from "./Authentication/helper/axiosInstance";
const UserProfilePage = () => {
  const [profile, setProfile] = useState({
    _id: "",
    fullName: "",
    dob: "",
    gender: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [fullNameError, setFullNameError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(
          "http://localhost:9999/api/user/jwt-current"
        );
        setProfile({
          _id: response.data._id || "",
          fullName: response.data.fullName || "",
          dob: response.data.dob ? response.data.dob.split("T")[0] : "",
          gender: response.data.gender || "",
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

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSaveError("");
    setFullNameError("");

    // Validation for fullName
    if (!profile.fullName || profile.fullName.trim() === "") {
      setFullNameError("Full Name is required.");
      setSaving(false);
      return;
    }

    if (profile.fullName.length > 50) {
      setFullNameError("Full Name cannot exceed 50 characters.");
      setSaving(false);
      return;
    }

    if (/\d/.test(profile.fullName)) {
      setFullNameError("Full Name cannot contain numbers.");
      setSaving(false);
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        fullName: profile.fullName,
        dob: profile.dob,
        gender: profile.gender,
      };
      const response = await axiosInstance.put(
        `/api/user/${profile._id}`,
        updateData
      );
      setProfile({
        ...response.data,
        dob: response.data.dob ? response.data.dob.split("T")[0] : "",
      });
      setMessage("Profile updated successfully.");
    } catch (error) {
      setSaveError(
        error.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="profile-form-row">
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={profile.fullName}
            onChange={(e) => {
              handleChange(e);
              if (fullNameError) {
                setFullNameError("");
              }
            }}
            className="form-control"
          />
          {fullNameError && (
            <p className="text-danger" style={{ marginTop: "0.25rem" }}>
              {fullNameError}
            </p>
          )}
        </div>
        <div className="profile-form-row">
          <label htmlFor="dob">Date of Birth</label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={profile.dob}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        <div className="profile-form-row">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            className="form-control"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="mt-3 text-center">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
        {message && <p className="text-success">{message}</p>}
        {saveError && <p className="text-danger">{saveError}</p>}
      </form>
    </div>
  );
};

export default UserProfilePage;
