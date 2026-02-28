import React, { useState, useEffect } from 'react';
import { Mail, Building, Lock, ArrowLeft, Check } from 'lucide-react';
import "../styles/ProfilePage.css";
import { useToast } from "../contexts/ToastContext";
import PhoneInput from "../components/PhoneInput";

function ProfilePage() {
  const { showSuccess, showError } = useToast();
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordStep, setPasswordStep] = useState('request');
  const [emailCode, setEmailCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyEmail: '',
    company: '',
    phoneNumber: '',
    country: 'EG', // Default to Egypt
    profilePhoto: null
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("hrUser"));
        console.log("Stored user from localStorage:", storedUser);
        
        if (!storedUser) {
          console.log("No stored user found");
          setIsLoading(false);
          return;
        }

        // Check if user has missing required fields and show notification
        if (!storedUser.phone_number || !storedUser.company_email) {
          showSuccess("Please complete your profile information to continue using the platform.");
        }

        console.log("Fetching profile for user ID:", storedUser.id);
        const res = await fetch(
          `http://localhost:5000/api/hr/profile/${storedUser.id}`
        );

        console.log("Profile fetch response status:", res.status);
        const data = await res.json();
        console.log("Profile fetch data:", data);

        if (!res.ok) {
          console.error("Profile fetch error:", data.message);
          setIsLoading(false);
          return;
        }

        // Split name into first + last
        const nameParts = data.name.split(" ");

        setProfile({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(" ") || '',
          email: data.email,
          companyEmail: data.company_email || '',
          company: data.company_name,
          phoneNumber: data.phone_number || '',
          country: 'EG', // Default to Egypt
          profilePhoto: null
        });
        
        setIsLoading(false);

      } catch (err) {
        console.error("Profile fetch error:", err);
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleRequestPasswordChange = () => {
    setPasswordStep('verify');
  };

  const handleVerifyCode = () => {
    if (emailCode.length === 6) {
      setPasswordStep('new');
    }
  };

  const handleChangePassword = () => {
    if (newPassword === confirmPassword && newPassword.length >= 6) {
      setPasswordStep('success');
      setTimeout(() => {
        setShowPasswordSection(false);
        setPasswordStep('request');
        setEmailCode('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    }
  };

  const getInitials = () => {
    return `${(profile.firstName || '')[0]}${(profile.lastName || '')[0]}`.toUpperCase();
  };

  const handleSaveProfile = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("hrUser"));
      if (!storedUser) {
        showError("No user found");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/hr/profile/${storedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile, null, 2),
      });

      const data = await response.json();

      if (response.ok) {
        // Transform backend data to frontend format
        const backendData = data.hr || data;
        const nameParts = backendData.name.split(" ");
        
        const updatedProfile = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(" ") || '',
          email: backendData.email,
          companyEmail: backendData.company_email || '',
          company: backendData.company_name,
          phoneNumber: backendData.phone_number || '',
          country: 'EG', // Default to Egypt
          profilePhoto: null
        };
        
        setProfile(updatedProfile);
        showSuccess("Profile updated successfully!");
        setIsEditing(false);
      } else {
        showError(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      showError("Network error. Please try again.");
    }
  };

  return (
    <div className="page-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-header-content">
            <h1>Profile</h1>
            <p>View and edit your account information</p>
            <button 
              className="edit-profile-btn"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="profile-content-simple">
          {showPasswordSection ? (
            <div className="password-section">
              <button 
                className="back-btn" 
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordStep('request');
                  setEmailCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <ArrowLeft size={18} />
                Back to Profile
              </button>

              <div className="password-change-container">
                <div className="password-header">
                  <div className="password-icon-wrapper">
                    <Lock size={32} />
                  </div>
                  <h2>Change Password</h2>
                  <p>Secure your account with a new password</p>
                </div>

                {passwordStep === 'request' && (
                  <div className="password-step">
                    <div className="email-verification-card">
                      <div className="email-icon-wrapper">
                        <Mail size={28} />
                      </div>
                      <h3>Email Verification Required</h3>
                      <p>
                        We'll send a verification code to <strong>{profile.email}</strong> to confirm it's you.
                      </p>
                    </div>
                    <button 
                      className="primary-action-btn"
                      onClick={handleRequestPasswordChange}
                    >
                      Send Verification Code
                    </button>
                  </div>
                )}

                {passwordStep === 'verify' && (
                  <div className="password-step">
                    <div className="verification-card">
                      <div className="verification-header">
                        <p>Enter the 6-digit code sent to <strong>{profile.email}</strong></p>
                      </div>
                      <div className="code-input-wrapper">
                        <input
                          type="text"
                          maxLength="6"
                          placeholder="000000"
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                          className="code-input"
                        />
                      </div>
                      <button 
                        className="primary-action-btn"
                        onClick={handleVerifyCode}
                        disabled={emailCode.length !== 6}
                      >
                        Verify Code
                      </button>
                    </div>
                    <div className="resend-section">
                      <p className="resend-text">
                        Didn't receive it? <button className="resend-link">Resend code</button>
                      </p>
                    </div>
                  </div>
                )}

                {passwordStep === 'new' && (
                  <div className="password-step">
                    <div className="password-form-card">
                      <div className="password-field">
                        <label>New Password</label>
                        <div className="password-input-wrapper">
                          <Lock size={18} className="password-input-icon" />
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                          />
                        </div>
                        {newPassword && (
                          <div className="password-strength-bar">
                            <div className={`password-strength-fill ${newPassword.length < 6 ? 'weak' : newPassword.length < 10 ? 'medium' : 'strong'}`}></div>
                          </div>
                        )}
                      </div>
                      <div className="password-field">
                        <label>Confirm Password</label>
                        <div className="password-input-wrapper">
                          <Lock size={18} className="password-input-icon" />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                      {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="error-message">⚠ Passwords do not match</p>
                      )}
                    </div>
                    <button 
                      className="primary-action-btn"
                      onClick={handleChangePassword}
                      disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
                    >
                      Update Password
                    </button>
                  </div>
                )}

                {passwordStep === 'success' && (
                  <div className="password-step">
                    <div className="success-card">
                      <div className="success-icon-wrapper">
                        <Check size={40} />
                      </div>
                      <h3>Password Updated!</h3>
                      <p>Your password has been changed successfully.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : isLoading ? (
            <div className="profile-loading">
              <div className="loading-spinner"></div>
              <p>Loading profile information...</p>
            </div>
          ) : (
            <>
              <div className="profile-left-simple">
                <div className="photo-section-simple">
                  <div className="profile-photo-container">
                    {profile.profilePhoto ? (
                      <img 
                        src={profile.profilePhoto} 
                        alt="Profile" 
                        className="profile-photo"
                      />
                    ) : (
                      <div className="profile-photo-placeholder">
                        <span className="profile-initials">{getInitials()}</span>
                      </div>
                    )}
                  </div>
                  <h2 className="profile-name">{profile.firstName} {profile.lastName}</h2>
                </div>
              </div>

              <div className="profile-right-simple">
                <div className="info-section">
                  <h3>Account Information</h3>
                  
                  <div className="info-grid">
                    <div className="info-item">
                      <label>First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                          className="info-input"
                        />
                      ) : (
                        <div className="info-value">{profile.firstName}</div>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                          className="info-input"
                        />
                      ) : (
                        <div className="info-value">{profile.lastName}</div>
                      )}
                    </div>

                    <div className="info-item full-width">
                      <label>
                        <Mail size={14} />
                        Work Email
                      </label>
                      <div className="info-value">{profile.email}</div>
                    </div>

                    <div className="info-item full-width">
                      <label>
                        <Mail size={14} />
                        Company Email
                      </label>
                      <div className="info-value">{profile.companyEmail || 'Not provided'}</div>
                    </div>

                    <div className="info-item full-width">
                      <label>
                        <Building size={14} />
                        Company
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          onChange={(e) => setProfile({...profile, company: e.target.value})}
                          className="info-input"
                        />
                      ) : (
                        <div className="info-value">{profile.company}</div>
                      )}
                    </div>

                    <div className="info-item full-width">
                      <label>
                        <Building size={14} />
                        Phone Number
                      </label>
                      {isEditing ? (
                        <PhoneInput
                          value={profile.phoneNumber}
                          onChange={(value) => setProfile({...profile, phoneNumber: value})}
                          name="phoneNumber"
                          country={profile.country}
                        />
                      ) : (
                        <div className="info-value">{profile.phoneNumber || 'Not provided'}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="security-section">
                  <h3>Security</h3>
                  <div className="security-item">
                    <div className="security-info">
                      <div className="security-icon">
                        <Lock size={20} />
                      </div>
                      <div>
                        <div className="security-title">Password</div>
                      </div>
                    </div>
                  </div>
                  
                  {isEditing && (
                    <button 
                      className="save-profile-btn"
                      onClick={handleSaveProfile}
                    >
                      <Check size={16} />
                      Save Profile
                    </button>
                  )}
                  
                  <button 
                    className="change-password-btn"
                    onClick={() => setShowPasswordSection(true)}
                  >
                    Change
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;