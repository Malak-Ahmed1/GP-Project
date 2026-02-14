import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { FaMicrosoft } from "react-icons/fa";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  const handleSocialLogin = (provider) => {
    // Handle social media login logic here
    console.log(`Logging in with ${provider}`);
    navigate("/dashboard");
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
            <label>Work Email</label>
            <input
              type="email"
              className="input"
              placeholder="name@company.com"
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
            className="social-btn github-btn"
            onClick={() => handleSocialLogin('GitHub')}
          >
            <FaGithub size={20} />
            Continue with GitHub
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
