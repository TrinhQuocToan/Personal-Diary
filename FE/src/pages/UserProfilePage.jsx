import React, { useState, useEffect, useRef } from "react";
import "./UserProfile.css";
import axiosInstance from "./Authentication/helper/axiosInstance";

const UserProfilePage = () => {
  const [activeTab, setActiveTab] = useState("personal"); // personal, contact, security, account
  const [profile, setProfile] = useState({
    _id: "",
    fullName: "",
    dob: "",
    gender: "",
    email: "",
    username: "",
    avatar: "",
    mobileNumber: "",
    address1: "",
    country: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [emailData, setEmailData] = useState({
    newEmail: "",
    password: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({
    fullName: "",
    dob: "",
    general: "",
    avatar: "",
    mobileNumber: "",
    address1: "",
    country: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    newEmail: "",
    password: "",
  });

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/user/jwt-current");

      setProfile({
        _id: response.data._id || "",
        fullName: response.data.fullName || "",
        dob: response.data.dob ? response.data.dob.split("T")[0] : "",
        gender: response.data.gender || "",
        email: response.data.email || "",
        username: response.data.username || "",
        avatar: response.data.avatar || "",
        mobileNumber: response.data.mobileNumber || "",
        address1: response.data.address1 || "",
        country: response.data.country || "",
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      setErrors((prev) => ({
        ...prev,
        general: error.response?.data?.message || "Failed to fetch user data.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const validatePersonalInfo = () => {
    const newErrors = { fullName: "", dob: "", general: "" };
    let isValid = true;

    // Validate Full Name
    if (!profile.fullName || profile.fullName.trim() === "") {
      newErrors.fullName = "Full Name is required.";
      isValid = false;
    } else if (profile.fullName.length > 50) {
      newErrors.fullName = "Full Name cannot exceed 50 characters.";
      isValid = false;
    } else if (/\d/.test(profile.fullName)) {
      newErrors.fullName = "Full Name cannot contain numbers.";
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(profile.fullName)) {
      newErrors.fullName = "Full Name can only contain letters and spaces.";
      isValid = false;
    }

    // Validate Date of Birth
    if (profile.dob) {
      const dobDate = new Date(profile.dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();

      if (dobDate > today) {
        newErrors.dob = "Date of birth cannot be in the future.";
        isValid = false;
      } else if (age > 120) {
        newErrors.dob = "Please enter a valid date of birth.";
        isValid = false;
      } else if (age < 13) {
        newErrors.dob = "You must be at least 13 years old.";
        isValid = false;
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const validateContactInfo = () => {
    const newErrors = { mobileNumber: "", address1: "", country: "" };
    let isValid = true;

    // Validate Mobile Number
    if (
      profile.mobileNumber &&
      !/^\+?[\d\s-()]{8,15}$/.test(profile.mobileNumber)
    ) {
      newErrors.mobileNumber = "Please enter a valid phone number.";
      isValid = false;
    }

    // Validate Address
    if (profile.address1 && profile.address1.length > 200) {
      newErrors.address1 = "Address cannot exceed 200 characters.";
      isValid = false;
    }

    // Validate Country
    if (profile.country && profile.country.length > 50) {
      newErrors.country = "Country name cannot exceed 50 characters.";
      isValid = false;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const validatePassword = () => {
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    let isValid = true;

    // Validate current password
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required.";
      isValid = false;
    }

    // Validate new password
    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required.";
      isValid = false;
    }

    // Validate confirm password
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
      isValid = false;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const validateEmail = () => {
    const newErrors = { newEmail: "", password: "" };
    let isValid = true;

    // Validate new email
    if (!emailData.newEmail) {
      newErrors.newEmail = "New email is required.";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.newEmail)) {
      newErrors.newEmail = "Please enter a valid email address.";
      isValid = false;
    } else if (
      emailData.newEmail.toLowerCase() === profile.email.toLowerCase()
    ) {
      newErrors.newEmail = "New email must be different from current email.";
      isValid = false;
    }

    // Validate password
    if (!emailData.password) {
      newErrors.password = "Password is required to change email.";
      isValid = false;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;

    setEmailData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Only JPEG and PNG images are allowed.",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      setErrors((prev) => ({
        ...prev,
        avatar: "File size must be less than 5MB.",
      }));
      return;
    }

    setUploadingAvatar(true);
    setErrors((prev) => ({ ...prev, avatar: "" }));

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await axiosInstance.post(
        `/api/user/${profile._id}/avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfile((prev) => ({
        ...prev,
        avatar: response.data.avatar,
      }));

      setMessage("Avatar updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setErrors((prev) => ({
        ...prev,
        avatar: error.response?.data?.message || "Failed to upload avatar.",
      }));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setMessage("");
    setErrors((prev) => ({ ...prev, general: "" }));

    // Validate based on active tab
    let isValid = false;
    if (activeTab === "personal") {
      isValid = validatePersonalInfo();
    } else if (activeTab === "contact") {
      isValid = validateContactInfo();
    }

    if (!isValid) return;

    setSaving(true);

    try {
      const updateData = {
        fullName: profile.fullName.trim(),
        dob: profile.dob,
        gender: profile.gender,
        mobileNumber: profile.mobileNumber.trim(),
        address1: profile.address1.trim(),
        country: profile.country.trim(),
      };

      const response = await axiosInstance.put(
        `/api/user/${profile._id}`,
        updateData
      );

      setProfile((prev) => ({
        ...prev,
        ...response.data,
        dob: response.data.dob ? response.data.dob.split("T")[0] : "",
      }));

      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrors((prev) => ({
        ...prev,
        general:
          error.response?.data?.message ||
          "Failed to update profile. Please try again.",
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setErrors((prev) => ({ ...prev, general: "" }));

    if (!validatePassword()) return;

    setChangingPassword(true);

    try {
      await axiosInstance.post(`/api/user/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage("Password changed successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error changing password:", error);
      setErrors((prev) => ({
        ...prev,
        general: error.response?.data?.message || "Failed to change password.",
      }));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();

    setMessage("");
    setErrors((prev) => ({ ...prev, general: "" }));

    if (!validateEmail()) return;

    setChangingEmail(true);

    try {
      const response = await axiosInstance.post(`/api/user/change-email`, {
        newEmail: emailData.newEmail.toLowerCase(),
        password: emailData.password,
      });

      // Update profile with new email
      setProfile((prev) => ({
        ...prev,
        email: response.data.email,
      }));

      setEmailData({
        newEmail: "",
        password: "",
      });

      setMessage("Email changed successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error changing email:", error);
      setErrors((prev) => ({
        ...prev,
        general: error.response?.data?.message || "Failed to change email.",
      }));
    } finally {
      setChangingEmail(false);
    }
  };

  const handleReset = () => {
    if (activeTab === "security") {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else if (activeTab === "account") {
      setEmailData({
        newEmail: "",
        password: "",
      });
    } else {
      fetchCurrentUser();
    }
    setErrors({
      fullName: "",
      dob: "",
      general: "",
      avatar: "",
      mobileNumber: "",
      address1: "",
      country: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      newEmail: "",
      password: "",
    });
    setMessage("");
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>User Profile</h2>

      {errors.general && (
        <div className="alert alert-error">
          <p className="text-danger">{errors.general}</p>
        </div>
      )}

      {message && (
        <div className="alert alert-success">
          <p className="text-success">{message}</p>
        </div>
      )}

      {/* Avatar Section */}
      <div className="profile-info">
        <div className="avatar-section">
          <div className="avatar-container" onClick={handleAvatarClick}>
            {profile.avatar ? (
              <img
                src={`http://localhost:9999${profile.avatar}`}
                alt="Avatar"
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                <span>
                  {profile.fullName
                    ? profile.fullName.charAt(0).toUpperCase()
                    : "U"}
                </span>
              </div>
            )}
            {uploadingAvatar && (
              <div className="avatar-overlay">
                <div className="spinner"></div>
              </div>
            )}
            <div className="avatar-edit-overlay">
              <span>📷</span>
            </div>
          </div>
          <p className="avatar-hint">Click to change avatar</p>
          {errors.avatar && (
            <p className="text-danger error-message">{errors.avatar}</p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleAvatarChange}
          style={{ display: "none" }}
        />
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "personal" ? "active" : ""}`}
          onClick={() => setActiveTab("personal")}
        >
          Personal Info
        </button>
        <button
          className={`tab-button ${activeTab === "contact" ? "active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          Contact Info
        </button>
        <button
          className={`tab-button ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          Account Settings
        </button>
        <button
          className={`tab-button ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>
      </div>

      {/* Personal Info Tab */}
      {activeTab === "personal" && (
        <form onSubmit={handleSubmitProfile}>
          <div className="profile-form-row">
            <label htmlFor="fullName">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={profile.fullName}
              onChange={handleChange}
              className={`form-control ${errors.fullName ? "error" : ""}`}
              placeholder="Enter your full name"
              maxLength="50"
            />
            {errors.fullName && (
              <p className="text-danger error-message">{errors.fullName}</p>
            )}
            <small className="char-count">
              {profile.fullName.length}/50 characters
            </small>
          </div>

          <div className="profile-form-row">
            <label htmlFor="dob">Date of Birth</label>
            <input
              type="date"
              id="dob"
              name="dob"
              value={profile.dob}
              onChange={handleChange}
              className={`form-control ${errors.dob ? "error" : ""}`}
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.dob && (
              <p className="text-danger error-message">{errors.dob}</p>
            )}
          </div>

          <div className="profile-form-row">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              className="form-control form-select"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
              disabled={saving}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || !profile.fullName.trim()}
            >
              {saving ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                "Save Personal Info"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Contact Info Tab */}
      {activeTab === "contact" && (
        <form onSubmit={handleSubmitProfile}>
          <div className="profile-form-row">
            <label htmlFor="mobileNumber">Mobile Number</label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              value={profile.mobileNumber}
              onChange={handleChange}
              className={`form-control ${errors.mobileNumber ? "error" : ""}`}
              placeholder="Enter your phone number"
              maxLength="15"
            />
            {errors.mobileNumber && (
              <p className="text-danger error-message">{errors.mobileNumber}</p>
            )}
          </div>

          <div className="profile-form-row">
            <label htmlFor="address1">Address</label>
            <textarea
              id="address1"
              name="address1"
              value={profile.address1}
              onChange={handleChange}
              className={`form-control ${errors.address1 ? "error" : ""}`}
              placeholder="Enter your address"
              maxLength="200"
              rows="3"
            />
            {errors.address1 && (
              <p className="text-danger error-message">{errors.address1}</p>
            )}
            <small className="char-count">
              {profile.address1.length}/200 characters
            </small>
          </div>

          <div className="profile-form-row">
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              value={profile.country}
              onChange={handleChange}
              className={`form-control ${errors.country ? "error" : ""}`}
              placeholder="Enter your country"
              maxLength="50"
            />
            {errors.country && (
              <p className="text-danger error-message">{errors.country}</p>
            )}
            <small className="char-count">
              {profile.country.length}/50 characters
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
              disabled={saving}
            >
              Reset
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                "Save Contact Info"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Account Settings Tab */}
      {activeTab === "account" && (
        <form onSubmit={handleChangeEmail}>
          <div className="security-info">
            <h4>Change Email Address</h4>
            <p>
              You'll need to enter your password to change your email address.
              Make sure you have access to your new email address.
            </p>
          </div>

          <div className="profile-form-row">
            <label htmlFor="currentEmail">Current Email</label>
            <input
              type="email"
              id="currentEmail"
              value={profile.email}
              className="form-control"
              disabled
            />
          </div>

          <div className="profile-form-row">
            <label htmlFor="newEmail">
              New Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="newEmail"
              name="newEmail"
              value={emailData.newEmail}
              onChange={handleEmailChange}
              className={`form-control ${errors.newEmail ? "error" : ""}`}
              placeholder="Enter your new email address"
            />
            {errors.newEmail && (
              <p className="text-danger error-message">{errors.newEmail}</p>
            )}
          </div>

          <div className="profile-form-row">
            <label htmlFor="password">
              Current Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={emailData.password}
              onChange={handleEmailChange}
              className={`form-control ${errors.password ? "error" : ""}`}
              placeholder="Enter your current password"
            />
            {errors.password && (
              <p className="text-danger error-message">{errors.password}</p>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
              disabled={changingEmail}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={
                changingEmail || !emailData.newEmail || !emailData.password
              }
            >
              {changingEmail ? (
                <>
                  <span className="spinner"></span>
                  Changing Email...
                </>
              ) : (
                "Change Email"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <form onSubmit={handleChangePassword}>
          <div className="security-info">
            <h4>Change Password</h4>
            <p>
              Choose a strong password to keep your account secure. We recommend
              using a combination of uppercase and lowercase letters, numbers,
              and special characters.
            </p>
          </div>

          <div className="profile-form-row">
            <label htmlFor="currentPassword">
              Current Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className={`form-control ${
                errors.currentPassword ? "error" : ""
              }`}
              placeholder="Enter your current password"
            />
            {errors.currentPassword && (
              <p className="text-danger error-message">
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div className="profile-form-row">
            <label htmlFor="newPassword">
              New Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className={`form-control ${errors.newPassword ? "error" : ""}`}
              placeholder="Enter your new password"
            />
            {errors.newPassword && (
              <p className="text-danger error-message">{errors.newPassword}</p>
            )}
          </div>

          <div className="profile-form-row">
            <label htmlFor="confirmPassword">
              Confirm New Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className={`form-control ${
                errors.confirmPassword ? "error" : ""
              }`}
              placeholder="Confirm your new password"
            />
            {errors.confirmPassword && (
              <p className="text-danger error-message">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
              disabled={changingPassword}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={
                changingPassword ||
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword
              }
            >
              {changingPassword ? (
                <>
                  <span className="spinner"></span>
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserProfilePage;
