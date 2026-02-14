import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FiBriefcase, 
  FiCalendar, 
  FiBarChart2, 
  FiUser,
  FiMenu,
  FiX,
  FiHome
} from "react-icons/fi";

function MenuPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    {
      id: 1,
      title: "My Jobs",
      subtitle: "Dashboard",
      icon: <FiBriefcase size={20} />,
      path: "/dashboard",
      color: "#4e73df"
    },
    {
      id: 2,
      title: "Interviews",
      subtitle: "Manage interviews",
      icon: <FiCalendar size={20} />,
      path: "/interviews",
      color: "#10b981"
    },
    {
      id: 3,
      title: "Analysis",
      subtitle: "View analytics",
      icon: <FiBarChart2 size={20} />,
      path: "/analysis",
      color: "#f59e0b"
    },
    {
      id: 4,
      title: "Profile",
      subtitle: "Account settings",
      icon: <FiUser size={20} />,
      path: "/profile",
      color: "#8b5cf6"
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  const isActivePath = (path) => {
    return location.pathname === path || 
           (path === "/dashboard" && location.pathname === "/") ||
           (path !== "/dashboard" && location.pathname.startsWith(path));
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="28" stroke="#4e73df" stroke-width="2"/>
              <path d="M30 15C33.866 15 37 18.134 37 22C37 25.866 33.866 29 30 29C26.134 29 23 25.866 23 22C23 18.134 26.134 15 30 15Z" fill="#4e73df"/>
              <path d="M20 35C20 32.2386 22.2386 30 25 30H35C37.7614 30 40 32.2386 40 35V40C40 42.7614 37.7614 45 35 45H25C22.2386 45 20 42.7614 20 40V35Z" fill="#4e73df"/>
              <circle cx="25" cy="22" r="2" fill="white"/>
              <circle cx="35" cy="22" r="2" fill="white"/>
              <path d="M25 38H35" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div className="sidebar-title">
            <h3>AI Hiring</h3>
            <span>HR Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${isActivePath(item.path) ? 'nav-item-active' : ''}`}
              onClick={() => handleNavigation(item.path)}
              style={{ '--item-color': item.color }}
            >
              <div className="nav-item-icon" style={{ color: item.color }}>
                {item.icon}
              </div>
              <div className="nav-item-content">
                <div className="nav-item-title">{item.title}</div>
                <div className="nav-item-subtitle">{item.subtitle}</div>
              </div>
              {isActivePath(item.path) && (
                <div className="nav-item-indicator" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="home-btn"
            onClick={() => handleNavigation("/dashboard")}
          >
            <FiHome size={18} />
            <span>Home</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}

export default MenuPage;