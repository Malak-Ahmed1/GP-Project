import React, { useState, useRef } from 'react';
import { Camera, Edit2, Save, X, Mail, Building, Lock, ArrowLeft, Check } from 'lucide-react';

function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordStep, setPasswordStep] = useState('request');
  const [emailCode, setEmailCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    company: 'TechCorp Inc.',
    profilePhoto: null
  });

  const [editForm, setEditForm] = useState({ ...profile });

  const handleEdit = () => {
    setEditForm({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({ ...profile });
  };

  const handleSave = () => {
    setProfile({ ...editForm });
    setIsEditing(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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
    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  };

  return (
    <div className="page-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-header-content">
            <h1>Profile</h1>
            <p>Manage your account information</p>
          </div>
          {!showPasswordSection && (
            <div className="profile-actions">
              {!isEditing ? (
                <button className="edit-profile-btn" onClick={handleEdit}>
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="cancel-btn" onClick={handleCancel}>
                    <X size={18} />
                    Cancel
                  </button>
                  <button className="save-profile-btn" onClick={handleSave}>
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {showSaveSuccess && (
          <div className="save-success-banner">
            <div className="success-icon">✓</div>
            Profile updated successfully!
          </div>
        )}

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
                  <div className="success-card">
                    <div className="success-icon-wrapper">
                      <Check size={40} />
                    </div>
                    <h3>Password Updated!</h3>
                    <p>Your password has been changed successfully.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="profile-left-simple">
                <div className="photo-section-simple">
                  <div 
                    className={`profile-photo-container ${isEditing ? 'editable' : ''}`}
                    onClick={handlePhotoClick}
                  >
                    {editForm.profilePhoto || profile.profilePhoto ? (
                      <img 
                        src={editForm.profilePhoto || profile.profilePhoto} 
                        alt="Profile" 
                        className="profile-photo"
                      />
                    ) : (
                      <div className="profile-photo-placeholder">
                        <span className="profile-initials">{getInitials()}</span>
                      </div>
                    )}
                    {isEditing && (
                      <div className="photo-overlay">
                        <Camera size={24} />
                        <span>Change</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
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
                          name="firstName"
                          value={editForm.firstName}
                          onChange={handleInputChange}
                          className="profile-input"
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
                          name="lastName"
                          value={editForm.lastName}
                          onChange={handleInputChange}
                          className="profile-input"
                        />
                      ) : (
                        <div className="info-value">{profile.lastName}</div>
                      )}
                    </div>

                    <div className="info-item full-width">
                      <label>
                        <Mail size={14} />
                        Email Address
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleInputChange}
                          className="profile-input"
                        />
                      ) : (
                        <div className="info-value">{profile.email}</div>
                      )}
                    </div>

                    <div className="info-item full-width">
                      <label>
                        <Building size={14} />
                        Company
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="company"
                          value={editForm.company}
                          onChange={handleInputChange}
                          className="profile-input"
                        />
                      ) : (
                        <div className="info-value">{profile.company}</div>
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
                        <div className="security-desc">Last changed 3 months ago</div>
                      </div>
                    </div>
                    <button 
                      className="change-password-btn"
                      onClick={() => setShowPasswordSection(true)}
                    >
                      Change
                    </button>
                  </div>
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