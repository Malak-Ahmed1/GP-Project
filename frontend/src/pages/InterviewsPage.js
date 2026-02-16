import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function InterviewsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); // Track which dropdown is open
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch jobs dynamically from backend
    API.get("/job", { params: { hr_id: 1 } }) // replace hr_id dynamically if needed
      .then((res) => {
        const jobsData = res.data.map((job) => ({
          ...job,
          status: job.available ? "open" : "closed",
        }));

        setJobs(
          jobsData.length
            ? jobsData
            : [
                { id: "test-123", title: "Frontend Developer", status: "open" },
                { id: "test-456", title: "Backend Engineer", status: "open" },
              ]
        );
        setLoading(false);
      })
      .catch(() => {
        setJobs([
          { id: "test-123", title: "Frontend Developer", status: "open" },
          { id: "test-456", title: "Backend Engineer", status: "open" },
        ]);
        setLoading(false);
      });
  }, []);

  // Copy job link function
  const copyLink = (id) => {
    const link = `${window.location.origin}/apply/${id}`;
    navigator.clipboard.writeText(link);
    alert("Job link copied!");
    setActiveMenu(null); // close menu after copy
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
          <p>Loading jobs...</p>
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
