import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function InterviewsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); // Track which dropdown is open
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("hrUser"));

        if (!storedUser) {
          console.error('No HR user found in localStorage');
          setLoading(false);
          return;
        }

        console.log("Fetching HR data for user ID:", storedUser.id);

        const res = await fetch(
          `http://localhost:5000/api/hr/${storedUser.id}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message);
        }

        console.log("HR jobs fetched:", data);

        // Fetch details for each job to check available field
        const jobsWithDetails = await Promise.all(
          data.map(async (job) => {
            try {
              const detailRes = await fetch(`http://localhost:5000/api/job/details/${job.id}`);
              const detailData = await detailRes.json();
              
              if (detailRes.ok) {
                console.log(`Job ${job.id} - Available field: ${detailData.available}, Calculated status: ${detailData.status}`);
                return {
                  ...job,
                  status: detailData.status, // Use the calculated status from backend
                  available: detailData.available // Keep available for debugging
                };
              }
              return job;
            } catch (err) {
              console.error(`Failed to fetch details for job ${job.id}:`, err);
              return job;
            }
          })
        );

        console.log("Jobs with details:", jobsWithDetails);
        setJobs(jobsWithDetails);
        setLoading(false);

      } catch (err) {
        console.error("Fetch jobs error:", err);
        
        // Only show fallback data in development, not in production
        if (process.env.NODE_ENV === 'development') {
          console.log("Showing development fallback data");
          setJobs([
            { id: "test-123", title: "Frontend Developer", status: "open" },
            { id: "test-456", title: "Backend Engineer", status: "open" },
          ]);
        } else {
          setJobs([]); // Empty array in production if DB fails
        }
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Copy job link function
  const copyLink = (id) => {
    const link = `${window.location.origin}/apply/${id}`;
    navigator.clipboard.writeText(link);
    alert("Job link copied!");
    setActiveMenu(null); // close menu after copy
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No end date set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isExpired = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) <= new Date();
  };

  return (
    <div className="page-container" onClick={() => setActiveMenu(null)}>
      <div className="card" style={{ maxWidth: "1000px" }}>
        <div className="header-section">
          <div>
            <h1>Interviews</h1>
            <p style={{ color: "#718096", margin: 0 }}>
              Select a job to manage interviews
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading jobs from database...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No Jobs Found</h3>
            <p style={{ color: '#718096' }}>
              You haven't created any jobs yet. 
              <button 
                onClick={() => navigate('/create-job')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#3182ce', 
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginLeft: '5px'
                }}
              >
                Create your first job
              </button>
            </p>
          </div>
        ) : (
          <div className="job-grid">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="job-card"
                onClick={() => navigate(`/interview-details/${job.id}`)}
                style={{ cursor: "pointer" }}
              >
                {/* Job header with status and menu */}
                <div className="job-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span className={`status-pill ${job.status}`}>
                      {job.status === "open" ? "● Opening" : "● Closed"}
                    </span>
                    <h3>{job.title}</h3>
                    <div className="job-meta">
                      <span className={`end-date ${isExpired(job.end_date) ? 'expired' : ''}`}>
                        {formatDate(job.end_date)}
                      </span>
                      {job.end_date && isExpired(job.end_date) && (
                        <span className="expired-badge">Expired</span>
                      )}
                    </div>
                  </div>

                  {/* Three dots menu */}
                  <div className="menu-container" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="dots-btn"
                      onClick={() =>
                        setActiveMenu(activeMenu === job.id ? null : job.id)
                      }
                    >
                      ⋮
                    </button>
                    {activeMenu === job.id && (
                      <div className="dropdown-menu">
                        <button
                          className="dropdown-item"
                          onClick={() => copyLink(job.id)}
                        >
                          Copy Job Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job actions */}
                <div className="job-actions">
                  <button className="view-btn closed">Manage Interviews</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewsPage;