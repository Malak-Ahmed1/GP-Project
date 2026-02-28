import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Removed API import to fix 'no-unused-vars' warning
import CandidateTable from "../components/CandidateTable";
import RankControls from "../components/RankControls";
import "../styles/RankingPage.css";
import { useToast } from "../contexts/ToastContext";

function RankingPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [rankingApplied, setRankingApplied] = useState(false);

  // --- Modal & Selection States ---
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Selection Table, 2: Mail Content, 3: Email Credentials
  const [actionType, setActionType] = useState(""); // "Approval" or "Quiz"
  const [selectedIds, setSelectedIds] = useState([]);
  const [emailBody, setEmailBody] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Email credentials state
  const [hrEmail, setHrEmail] = useState("");
  const [hrPassword, setHrPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Candidate details modal state
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState(null);
  const [loadingCandidate, setLoadingCandidate] = useState(false);

  // Fetch job details
  const fetchJobDetails = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/job/details/${jobId}`);
      const data = await res.json();
      
      if (res.ok) {
        setIsClosed(data.status === 'closed');
        setJobTitle(data.title);
      }
    } catch (err) {
      console.error("Failed to fetch job details:", err);
    }
  };

  // Update job status in database
  const updateJobStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const endpoint = newStatus === 'closed' 
        ? `http://localhost:5000/api/job/close-job/${jobId}`
        : `http://localhost:5000/api/job/open-job/${jobId}`;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setIsClosed(newStatus === 'closed');
      showSuccess(`Job ${newStatus === 'closed' ? 'closed' : 'opened'} successfully!`);
      
    } catch (err) {
      console.error("Failed to update job status:", err);
      showError("Failed to update job status");
      // Revert the toggle on error
      setIsClosed(!newStatus === 'closed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusToggle = () => {
    const newStatus = !isClosed ? 'closed' : 'open';
    updateJobStatus(newStatus);
  };

  const handleApplyRanking = (rankingParams) => {
    // Apply ranking logic here
     fetchRanking(); // Refresh data with ranking applied
    setRankingApplied(true);
  };

  const fetchRanking = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/candidate/candidates/${jobId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCandidates(data.candidates || []);
      } else {
        throw new Error(data.message || 'Failed to fetch candidates');
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      // Fallback to empty array on error
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
    fetchRanking();
  }, [jobId]);

  // --- Logic Functions ---
  const openModal = (type) => {
    setActionType(type);
    setModalStep(1);
    setSelectedIds([]);
    setShowModal(true);
    setEmailBody(type === "Approval" 
      ? "Congratulations! You have been moved to the next round." 
      : "Please complete this technical quiz to proceed: [Link Here]");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map(c => c.id));
    }
  };

  const handleCheckbox = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSendEmails = async () => {
    console.log("handleSendEmails called");
    console.log("hrEmail:", hrEmail);
    console.log("hrPassword:", hrPassword ? "provided" : "missing");
    console.log("hrPassword length:", hrPassword.length);
    console.log("selectedIds:", selectedIds);
    console.log("actionType:", actionType);
    console.log("emailBody:", emailBody);
    
    try {
      // Get selected candidates' details
      const selectedCandidates = candidates.filter(c => selectedIds.includes(c.id));
      console.log("selectedCandidates:", selectedCandidates.length);
      
      if (selectedCandidates.length === 0) {
        showError("No candidates selected");
        return;
      }
      
      // Prepare email data with HR's custom content
      const emails = selectedCandidates.map(candidate => ({
        to: candidate.email,
        subject: actionType === "Approval" 
          ? `Congratulations! Next Round - ${jobTitle}`
          : `Technical Assessment - ${jobTitle}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${actionType === "Approval" ? "🎉 Congratulations!" : "📝 Technical Assessment"}</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px;">
              <h2 style="color: #2d3748; margin-top: 0;">Dear ${candidate.name},</h2>
              
              <p style="color: #4a5568; line-height: 1.6;">
                ${actionType === "Approval" 
                  ? `We are pleased to inform you that your application for <strong>${jobTitle}</strong> has been successful! You have been selected to proceed to the next round of our hiring process.`
                  : `Thank you for your interest in the <strong>${jobTitle}</strong> position. We would like to invite you to complete a technical assessment as part of our evaluation process.`
                }
              </p>
              
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #2d3748; margin: 0; white-space: pre-wrap;">${emailBody}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  ${actionType === "Approval" ? "View Next Steps" : "Take Assessment"}
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                This email was sent regarding your application for ${jobTitle}. If you have any questions, please don't hesitate to contact us.
              </p>
              
              <p style="color: #718096; font-size: 12px; margin-top: 20px;">
                Best regards,<br>
                The Hiring Team<br>
                <small>Sent from: ${hrEmail}</small>
              </p>
            </div>
          </div>
        `
      }));

      console.log("Prepared emails:", emails.length);

      // Send emails via backend API with HR credentials
      const response = await fetch('http://localhost:5000/api/email/send-acceptance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          emails,
          hrEmail: hrEmail,
          hrPassword: hrPassword
        })
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send emails');
      }

      showSuccess(`${actionType} emails sent successfully to ${selectedCandidates.length} candidates from ${hrEmail}!`);
      setShowModal(false);
      
      // Reset credentials after successful send
      setHrEmail("");
      setHrPassword("");
      setShowPassword(false);
      
    } catch (error) {
      console.error('Error sending emails:', error);
      showError(`Failed to send emails: ${error.message}`);
    }
  };

  // Handle viewing candidate details
  const handleViewCandidateDetails = async (candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(true);
    setLoadingCandidate(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/candidate/details/${candidate.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setCandidateDetails(data);
      } else {
        throw new Error(data.message || 'Failed to fetch candidate details');
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      showError('Failed to load candidate details');
    } finally {
      setLoadingCandidate(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: '1100px' }}>
        <div className="ranking-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button 
              onClick={() => navigate('/dashboard')}
              style={{ background: 'none', color: '#4e73df', padding: '0', marginBottom: '8px', fontSize: '13px', cursor: 'pointer', border: 'none', fontWeight: '600' }}
            >
              ← Back to Dashboard
            </button>
            <h1>{isClosed ? "Ranking Insights" : "Active Applicants"}</h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <div className="status-toggle-container">
              <span className="status-label" style={{ color: isClosed ? '#e53e3e' : '#48bb78', fontSize: '12px', fontWeight: 'bold' }}>
                {updatingStatus ? "Updating..." : (isClosed ? "Status: Closed" : "Status: Open")}
              </span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={isClosed} 
                  onChange={handleStatusToggle}
                  disabled={updatingStatus}
                />
                <span className="slider"></span>
              </label>
            </div>

          </div>
        </div>

        {isClosed && (
          <div className="fade-in-controls">
            <div className="controls-wrapper" style={{ marginBottom: '30px' }}>
              <RankControls onRank={handleApplyRanking} />
            </div>
          </div>
        )}

        <div className="table-container">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>
          ) : (
            <CandidateTable candidates={candidates} showScore={isClosed} onViewDetails={handleViewCandidateDetails} />
          )}
        </div>
        
            {isClosed && rankingApplied && (
              <div className="action-bar" style={{textAlign: 'center'}}>
                <button className="btn-send btn-approval" onClick={() => openModal("Approval")}>
                   Send Approval Mails
                </button>
                
              </div>
            )}
      </div>

      {/* --- MODERN CENTER MODAL --- */}
{showModal && (
  <div className="modal-overlay" onClick={() => setShowModal(false)}>
    <div 
      className="modal-container"
      onClick={(e) => e.stopPropagation()}  // Prevent closing when clicking inside
    >
      <div className="modal-header">
        <h2>
          {modalStep === 1
            ? `Select Candidates • ${actionType}`
            : modalStep === 2
            ? `Compose ${actionType} Mail`
            : `Email Credentials • ${actionType}`}
        </h2>
        <button 
          className="modal-close"
          onClick={() => setShowModal(false)}
        >
          ✕
        </button>
      </div>

      <div className="modal-body">
        {modalStep === 1 ? (
          <>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={toggleSelectAll}>
                {selectedIds.length === candidates.length
                  ? "Deselect All"
                  : "Select All"}
              </button>

              <span className="selected-count">
                {selectedIds.length} selected
              </span>
            </div>

            <div className="table-wrapper">
              <table className="selection-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Match %</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => handleCheckbox(c.id)}
                        />
                      </td>
                      <td>{c.name}</td>
                      <td>
                        <span className="score-badge">
                          {c.score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className="primary-btn"
                disabled={selectedIds.length === 0}
                onClick={() => setModalStep(2)}
              >
                Next
              </button>
            </div>
          </>
        ) : modalStep === 2 ? (
          <>
            <p className="mail-info">
              Sending to {selectedIds.length} candidates
            </p>

            <textarea
              className="email-textarea"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Write your message..."
            />

            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setModalStep(1)}
              >
                Back
              </button>

              <button
                className="primary-btn"
                onClick={() => setModalStep(3)}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="email-credentials-form">
              <h3>Enter Your Email Credentials</h3>
              <p style={{ color: '#718096', marginBottom: '20px' }}>
                To send emails, we need your Gmail credentials. Your password will be used only for this session and will not be stored.
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  Your Gmail Address
                </label>
                <input
                  type="email"
                  value={hrEmail}
                  onChange={(e) => setHrEmail(e.target.value)}
                  placeholder="your-email@gmail.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  App Password (16-character)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={hrPassword}
                    onChange={(e) => setHrPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#718096',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div style={{ 
                background: '#f7fafc', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '20px',
                fontSize: '14px',
                color: '#4a5568'
              }}>
                <strong>Note:</strong> You need to create an App Password from your Google Account settings. 
                Enable 2FA and visit: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#4299e1' }}>Google App Passwords</a>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setModalStep(2)}
              >
                Back
              </button>

              <button
                className="primary-btn-send"
                onClick={handleSendEmails}
                disabled={!hrEmail || !hrPassword || hrPassword.length < 16}
              >
                Send Emails
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)}

{/* Candidate Details Modal */}
{showCandidateModal && (
  <div className="modal-overlay" onClick={() => setShowCandidateModal(false)}>
    <div 
      className="modal-container"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '600px' }}
    >
      <div className="modal-header">
        <h2>Candidate Details</h2>
        <button 
          className="modal-close"
          onClick={() => setShowCandidateModal(false)}
        >
          ✕
        </button>
      </div>

      <div className="modal-body">
        {loadingCandidate ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Loading candidate details...</div>
          </div>
        ) : selectedCandidate && candidateDetails ? (
          <div className="candidate-details">
            <div className="candidate-info" style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>
                {selectedCandidate.name}
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <strong>Email:</strong> {selectedCandidate.email}
                </div>
                {selectedCandidate.phone_number && (
                  <div>
                    <strong>Phone:</strong> {selectedCandidate.phone_number}
                  </div>
                )}
                {selectedCandidate.appliedAt && (
                  <div>
                    <strong>Applied:</strong> {selectedCandidate.appliedAt}
                  </div>
                )}
                {candidateDetails.cv_link && (
                  <div>
                    <strong>CV:</strong> 
                    <a 
                      href={candidateDetails.cv_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ marginLeft: '8px', color: '#4299e1' }}
                    >
                      View CV
                    </a>
                  </div>
                )}
              </div>
            </div>

            {candidateDetails.answers && candidateDetails.answers.length > 0 && (
              <div className="candidate-answers">
                <h4 style={{ marginBottom: '12px', color: '#2d3748' }}>
                  Application Answers
                </h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {candidateDetails.answers.map((answer, index) => (
                    <div key={index} style={{ 
                      padding: '12px', 
                      backgroundColor: '#f7fafc', 
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', color: '#4a5568' }}>
                        {answer.field_label || `Field ${index + 1}`}
                      </div>
                      <div style={{ color: '#2d3748' }}>
                        {answer.value || 'Not provided'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Failed to load candidate details</div>
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button
          className="secondary-btn"
          onClick={() => setShowCandidateModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default RankingPage;