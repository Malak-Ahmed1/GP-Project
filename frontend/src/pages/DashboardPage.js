import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function DashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); // Track which dropdown is open
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/jobs")
      .then((res) => {
        if (res.data.length === 0) {
          // Mock data with status for testing
          setJobs([
            { id: "test-123", title: "Frontend Developer", status: "open" },
            { id: "test-456", title: "Backend Engineer", status: "closed" }
          ]);
        } else {
          setJobs(res.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setJobs([
          { id: "test-123", title: "Frontend Developer", status: "open" },
          { id: "test-456", title: "Backend Engineer", status: "closed" }
        ]);
        setLoading(false);
      });
  }, []);

  const copyLink = (id) => {
    const link = `${window.location.origin}/apply/${id}`;
    navigator.clipboard.writeText(link);
    alert("Job link copied to clipboard!");
    setActiveMenu(null);
  };

  return (
    <div className="page-container" onClick={() => setActiveMenu(null)}>
      <div className="card" style={{ maxWidth: '1000px' }}>
        <div className="header-section">
          <div>
            <h1>HR Dashboard</h1>
            <p style={{ color: '#718096', margin: 0 }}>Manage your job postings and candidates</p>
          </div>
          <button className="primary-btn" style={{ width: 'auto' }} onClick={() => navigate("/create-job")}>
            + Create Job Form
          </button>
        </div>

        {loading ? (
          <p>Loading jobs...</p>
        ) : (
          <div className="job-grid">
            {jobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-card-header">
                  <div>
                    <span className={`status-pill ${job.status}`}>
                      {job.status === "open" ? "● Opening" : "● Closed"}
                    </span>
                    <h3>{job.title}</h3>
                  </div>
                  
                  {/* Three Dots Menu - Only show if open */}
                  {job.status === "open" && (
                    <div className="menu-container" onClick={(e) => e.stopPropagation()}>
                      <button className="dots-btn" onClick={() => setActiveMenu(activeMenu === job.id ? null : job.id)}>
                        ⋮
                      </button>
                      {activeMenu === job.id && (
                        <div className="dropdown-menu">
                          <button className="dropdown-item" onClick={() => copyLink(job.id)}>
                            Copy Job Link
                          </button>
                        
                        </div>
                      )}
                    </div>
                  )}
                </div>

             <div className="job-actions">
  {job.status === "open" ? (
    <button 
      className="view-btn" 
      onClick={() => navigate(`/ranking/${job.id}`)}
    >
      View Job
    </button>
  ) : (
    <button 
      className="view-btn closed" 
      onClick={() => navigate(`/ranking/${job.id}`)}
    >
      View Ranking
    </button>
  )}

  <button 
    className="prepare-btn" 
    onClick={() => navigate(`/prepare-questions/${job.id}`)}
  >
    Prepare Interview Questions
  </button>
</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;