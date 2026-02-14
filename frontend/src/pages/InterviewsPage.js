import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function InterviewsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/jobs")
      .then((res) => {
        if (res.data.length === 0) {
          setJobs([
            { id: "test-123", title: "Frontend Developer", status: "open" },
            { id: "test-456", title: "Backend Engineer", status: "open" }
          ]);
        } else {
          setJobs(res.data.filter(job => job.status === "open"));
        }
        setLoading(false);
      })
      .catch(() => {
        setJobs([
          { id: "test-123", title: "Frontend Developer", status: "open" },
          { id: "test-456", title: "Backend Engineer", status: "open" }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: '1000px' }}>
        <div className="header-section">
          <div>
            <h1>Interviews</h1>
            <p style={{ color: '#718096', margin: 0 }}>Select a job to manage interviews</p>
          </div>
        </div>

        {loading ? (
          <p>Loading jobs...</p>
        ) : (
          <div className="job-grid">
            {jobs.map((job) => (
              <div key={job.id} className="job-card" onClick={() => navigate(`/interview-details/${job.id}`)} style={{ cursor: 'pointer' }}>
                <div className="job-card-header">
                  <div>
                    <span className={`status-pill ${job.status}`}>
                      {job.status === "open" ? "● Opening" : "● Closed"}
                    </span>
                    <h3>{job.title}</h3>
                  </div>
                </div>

                <div className="job-actions">
                  <button className="view-btn closed">
                    Manage Interviews
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

export default InterviewsPage;
