import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/DashboardPage.css";
import { useToast } from "../contexts/ToastContext";

function DashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); // Track which dropdown is open
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [jobToClose, setJobToClose] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    const hrUser = localStorage.getItem("hrUser");
    if (!hrUser) {
      // If no user is logged in, redirect to login
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("hrUser"));

        if (!storedUser) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://localhost:5000/api/hr/${storedUser.id}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message);
        }

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

        setJobs(jobsWithDetails);
        setLoading(false);

      } catch (err) {
        console.error("Fetch jobs error:", err);
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);



  const copyLink = (id) => {
    const link = `${window.location.origin}/apply/${id}`;
    navigator.clipboard.writeText(link);
    showSuccess("Job link copied to clipboard!");
    setActiveMenu(null);
  };

  const closeJob = async (jobId, jobTitle) => {
    setJobToClose({ id: jobId, title: jobTitle });
    setShowCloseConfirm(true);
    setActiveMenu(null);
  };

 


  const deleteJob = async (jobId, jobTitle) => {
    setJobToDelete({ id: jobId, title: jobTitle });
    setShowDeleteConfirm(true);
    setActiveMenu(null);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      const res = await fetch(`http://localhost:5000/api/job/delete-job/${jobToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      showSuccess("Job deleted successfully!");
      // Refresh jobs list
      window.location.reload();

    } catch (err) {
      console.error("Delete job error:", err);
      showError("Failed to delete job");
    } finally {
      setShowDeleteConfirm(false);
      setJobToDelete(null);
    }
  };

  const cancelDeleteJob = () => {
    setShowDeleteConfirm(false);
    setJobToDelete(null);
  };

  const editJob = async (jobId, jobTitle) => {
    setJobToEdit({ id: jobId, title: jobTitle });
    setShowEditConfirm(true);
    setActiveMenu(null);
  };

  const confirmEditJob = () => {
    if (!jobToEdit) return;

    try {
      // Store job data in localStorage for the edit form
      localStorage.setItem('jobToEdit', JSON.stringify(jobToEdit));
      
      // Navigate to edit form
      navigate(`/edit-job/${jobToEdit.id}`);
    } catch (err) {
      console.error("Edit job error:", err);
      showError("Failed to edit job");
    } finally {
      setShowEditConfirm(false);
      setJobToEdit(null);
    }
  };

  const cancelEditJob = () => {
    setShowEditConfirm(false);
    setJobToEdit(null);
    localStorage.removeItem('jobToEdit');
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No end date setted";
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
                      {job.status === "open" ? "● Opening" : "Closed"}
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
                          <button className="dropdown-item edit" onClick={() => editJob(job.id, job.title)}>
                             Edit Job
                          </button>
                          <button className="dropdown-item delete" onClick={() => deleteJob(job.id, job.title)}>
                            Delete Job
                          </button>
                         
                        </div>
                      )}
                    </div>
                  )}
                   {job.status === "closed" && (
                    <div className="menu-container" onClick={(e) => e.stopPropagation()}>
                      <button className="dots-btn" onClick={() => setActiveMenu(activeMenu === job.id ? null : job.id)}>
                        ⋮
                      </button>
                      {activeMenu === job.id && (
                        <div className="dropdown-menu">
                          
                          <button className="dropdown-item delete" onClick={() => deleteJob(job.id, job.title)}>
                             Delete Job
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

      {showDeleteConfirm && jobToDelete && (
        <div className="confirm-dialog-overlay" onClick={cancelDeleteJob}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-header">
              <h3>Delete Job</h3>
            </div>
            <div className="confirm-dialog-body">
              <p>Are you sure you want to delete "<strong>{jobToDelete.title}</strong>"?</p>
              <p style={{ fontSize: '14px', color: '#dc2626', marginTop: '8px' }}>
                ⚠️ This action cannot be undone. All job data and candidate applications will be permanently deleted.
              </p>
            </div>
            <div className="confirm-dialog-actions">
              <button className="cancel-btn" onClick={cancelDeleteJob}>
                Cancel
              </button>
              <button className="confirm-btn delete" onClick={confirmDeleteJob}>
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditConfirm && jobToEdit && (
        <div className="confirm-dialog-overlay" onClick={cancelEditJob}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-header">
              <h3>Edit Job</h3>
            </div>
            <div className="confirm-dialog-body">
              <p>Edit job "<strong>{jobToEdit.title}</strong>"</p>
              <p style={{ fontSize: '14px', color: '#4299e1', marginTop: '8px' }}>
                You will be redirected to the job form where you can modify all job details.
              </p>
            </div>
            <div className="confirm-dialog-actions">
              <button className="cancel-btn" onClick={cancelEditJob}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={confirmEditJob}>
                 Edit Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;