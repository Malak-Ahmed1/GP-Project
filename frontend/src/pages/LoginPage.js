import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaLinkedin } from "react-icons/fa";
import { FaMicrosoft } from "react-icons/fa";
import { useToast } from "../contexts/ToastContext";

function LoginPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 const handleLogin = async (e) => {
  e.preventDefault();
  
  try {
    console.log("Attempting login with:", { email, password });
    
    const res = await fetch("http://localhost:5000/api/hr/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    console.log("Response status:", res.status);
    console.log("Response ok:", res.ok);

    const data = await res.json();
    console.log("Response data:", data);

    if (!res.ok) {
      showError(data.message);
      return;
    }

    console.log("Login success:", data.hr);

    // Save HR info locally
    const userToStore = {
      id: data.hr.id,
      email: data.hr.email,
      name: data.hr.name
    };
    console.log("Storing user data:", userToStore);
    localStorage.setItem("hrUser", JSON.stringify(userToStore));
    showSuccess("Login successful!");
    navigate("/dashboard");

  } catch (err) {
    console.error("Login error:", err);
    showError("Network error. Please check your connection.");
  }
};


  const handleSocialLogin = async (provider) => {
    try {
      // Simulate getting user info from provider
      const dummyData = {
        Google: { email: "hr_google@example.com", name: "John Google" },
        GitHub: { email: "hr_github@example.com", name: "Jane GitHub" },
        LinkedIn: { email: "hr_linkedin@example.com", name: "Linda LinkedIn" },
        Microsoft: { email: "hr_microsoft@example.com", name: "Mike Microsoft" },
      };

      const socialUser = dummyData[provider];

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
          <h1>AI Hiring Platform</h1>
          <p>
            Hire smarter. Rank candidates instantly.  
            Let AI identify top talent in seconds.
          </p>
        </div>

        <form onSubmit={handleLogin} className="auth-form-light">
          
          <div className="form-group full-width">
            <label>Email (Work or Company)</label>
            <input
              type="email"
              className="input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="primary-btn">
            Login to Dashboard
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Social Login Buttons */}
        <div className="social-login-container">
          <button 
            className="social-btn google-btn"
            onClick={() => handleSocialLogin('Google')}
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>
          
          
          
          <button 
            className="social-btn linkedin-btn"
            onClick={() => handleSocialLogin('LinkedIn')}
          >
            <FaLinkedin size={20} />
            Continue with LinkedIn
          </button>
          
          <button 
            className="social-btn microsoft-btn"
            onClick={() => handleSocialLogin('Microsoft')}
          >
            <FaMicrosoft size={20} />
            Continue with Microsoft
          </button>
        </div>

        <p className="auth-footer-text">
          New to the platform?{" "}
          <span onClick={() => navigate("/signup")}>
            Create HR Account
          </span>
        </p>

      </div>
    </div>
  );
}

export default LoginPage;
