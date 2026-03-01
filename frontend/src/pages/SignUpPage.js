import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaLinkedin } from "react-icons/fa";
import { FaMicrosoft } from "react-icons/fa";
import PhoneInput from "../components/PhoneInput.js";
import "../styles/PhoneInput.css";
import { useToast } from "../contexts/ToastContext";

function SignUpPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyEmail: "",
    phoneNumber: ""
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignUp = async (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    showError("Passwords don't match!");
    return;
  }

  if (formData.password.length < 8) {
    showError("Password must be at least 8 characters!");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/hr/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        phoneNumber: formData.phoneNumber,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showSuccess(data.message);
      navigate("/login");
    } else {
      showError(data.message);
    }

  } catch (err) {
    console.error("Signup error:", err);
    showError("Server error");
  }
};


const handleSocialSignUp = async (providerName) => {
  try {
    // Simulate getting user info from provider
    const dummyData = {
      Google: { email: "hr_google@example.com", name: "John Google" },
      GitHub: { email: "hr_github@example.com", name: "Jane GitHub" },
      LinkedIn: { email: "hr_linkedin@example.com", name: "Linda LinkedIn" },
      Microsoft: { email: "hr_microsoft@example.com", name: "Mike Microsoft" },
    };

    const socialUser = dummyData[providerName];

    const response = await fetch("http://localhost:5000/api/hr/social-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(socialUser),
    });

    const data = await response.json();

    if (response.ok) {
      // Save token in localStorage for now
      localStorage.setItem("token", data.token);
      console.log("User info:", data.user);
      
      // Check if required fields are missing
      if (!data.user.phone_number || !data.user.company_email) {
        // Save user data and redirect to profile page to complete registration
        localStorage.setItem("hrUser", JSON.stringify(data.user));
        showSuccess("Social login successful! Please complete your profile information.");
        navigate("/profile");
      } else {
        // User has complete info, go to dashboard
        localStorage.setItem("hrUser", JSON.stringify(data.user));
        showSuccess("Login successful!");
        navigate("/dashboard");
      }
    } else {
      showError(data.message);
    }
  } catch (err) {
    console.error(err);
    showError("Social login failed");
  }
};



  return (
    <div className="page-container">
      <div className="card auth-card-light">

        <div className="auth-header">
          <div className="auth-icon">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="28" stroke="#4e73df" stroke-width="2"/>
              <path d="M30 15C33.866 15 37 18.134 37 22C37 25.866 33.866 29 30 29C26.134 29 23 25.866 23 22C23 18.134 26.134 15 30 15Z" fill="#4e73df"/>
              <path d="M20 35C20 32.2386 22.2386 30 25 30H35C37.7614 30 40 32.2386 40 35V40C40 42.7614 37.7614 45 35 45H25C22.2386 45 20 42.7614 20 40V35Z" fill="#4e73df"/>
              <circle cx="25" cy="22" r="2" fill="white"/>
              <circle cx="35" cy="22" r="2" fill="white"/>
              <path d="M25 38H35" stroke="white" stroke-width="2" stroke-linecap="round"/>
              <circle cx="18" cy="18" r="3" fill="#667eea" opacity="0.6" class="pulse-dot"/>
              <circle cx="42" cy="18" r="3" fill="#667eea" opacity="0.6" class="pulse-dot"/>
              <circle cx="18" cy="42" r="3" fill="#667eea" opacity="0.6" class="pulse-dot"/>
              <circle cx="42" cy="42" r="3" fill="#667eea" opacity="0.6" class="pulse-dot"/>
            </svg>
          </div>
          <h1>Create HR Account</h1>
          <p>
            Join thousands of HR professionals using AI  
            to find the perfect candidates faster.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="auth-form-light">
          
          <div className="form-group full-width">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              className="input"
              placeholder="John"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              className="input"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Work Email</label>
            <input
              type="email"
              name="email"
              className="input"
              placeholder="john@company.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Company Name</label>
            <input
              type="text"
              name="companyName"
              className="input"
              placeholder="Acme Corp"
              value={formData.companyName}
              onChange={handleInputChange}
              required
            />
          </div>
        <div className="form-group full-width">
            <label>Company Email</label>
            <input
              type="email"
              name="companyEmail"
              className="input"
              placeholder="company@company.com"
              value={formData.companyEmail}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group full-width">
            <label>Phone Number</label>
            <PhoneInput
  value={formData.phoneNumber}
  onChange={(value) =>
    handleInputChange({ target: { name: "phoneNumber", value } })
  }
/>
          </div>
          <div className="form-group full-width">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength="8"
            />
          </div>

          <div className="form-group full-width">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="input"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              minLength="8"
            />
          </div>

          <button type="submit" className="primary-btn">
            Create Account
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Social Sign Up Buttons */}
        <div className="social-login-container">
          <button 
            className="social-btn google-btn"
            onClick={() => handleSocialSignUp('Google')}
          >
            <FcGoogle size={20} />
            Sign up with Google
          </button>
          
         
          
          <button 
            className="social-btn linkedin-btn"
            onClick={() => handleSocialSignUp('LinkedIn')}
          >
            <FaLinkedin size={20} />
            Sign up with LinkedIn
          </button>
          
          <button 
            className="social-btn microsoft-btn"
            onClick={() => handleSocialSignUp('Microsoft')}
          >
            <FaMicrosoft size={20} />
            Sign up with Microsoft
          </button>
        </div>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>
            Sign In
          </span>
        </p>

      </div>
    </div>
  );
}

export default SignUpPage;