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
  const [sendingEmails, setSendingEmails] = useState(false);

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

  const handleApplyRanking = async () => {
  try {
    console.log("Applying ranking to all candidates");
    console.log("Current candidates:", candidates);

    if (candidates.length === 0) {
      showError("No candidates available to rank");
      return;
    }

    // Step 1: Assign arbitrary weights to candidates
    console.log("Step 1: Assigning arbitrary weights to candidates...");
    const candidatesWithWeights = candidates.map((candidate, index) => {
      // Generate arbitrary weight (random between 60-100 to simulate ranking scores)
      const arbitraryWeight = Math.floor(Math.random() * 41) + 60; // 60-100 range
      
      return {
        ...candidate,
        score: arbitraryWeight,
        rank: index + 1
      };
    });

    // Step 2: Sort candidates by weight (highest first) and take top 4
    console.log("Step 2: Sorting candidates and taking top 4...");
    const rankedCandidates = candidatesWithWeights
      .sort((a, b) => b.score - a.score)
      .slice(0, 4); // Take only top 4

    // Update candidates state to show only top 4 with their scores
    setCandidates(rankedCandidates);

    // Step 3: Mark top 4 job applications as passed
    console.log("Step 3: Marking top 4 applications as passed...");
    const topCandidateIds = rankedCandidates
      .filter(c => c.id && c.id !== null && c.id !== undefined)
      .map(c => c.id);

    if (topCandidateIds.length === 0) {
      showError("No valid candidates available to add");
      return;
    }

    console.log("Top 4 candidates:", rankedCandidates.map(c => ({ name: c.name, score: c.score })));

    const markPassedResponse = await fetch(`http://localhost:5000/api/candidate/mark-all-passed/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const markPassedResult = await markPassedResponse.json();

    if (!markPassedResponse.ok) {
      throw new Error(markPassedResult.error || 'Failed to mark applications as passed');
    }

    console.log(`Marked ${markPassedResult.count} applications as passed`);
    
    // Success message with ranking information
    showSuccess(
      `CV Ranking Applied Successfully! 🎯\n` +
      `• Top ${rankedCandidates.length} candidates selected\n` +
      `• Scores range: ${Math.min(...rankedCandidates.map(c => c.score))} - ${Math.max(...rankedCandidates.map(c => c.score))}\n` +
      `• Candidates will now appear in Phase 1 quiz selection\n` +
      `• Go to Job Interview Details to send quiz links`
    );

    setRankingApplied(true);

  } catch (error) {
    console.error('Error applying ranking:', error);
    showError(`Failed to apply ranking: ${error.message}`);
  }
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
    console.log("selectedIds:", selectedIds);
    console.log("actionType:", actionType);
    console.log("emailBody:", emailBody);
    
    try {
      setSendingEmails(true);
      
      // Get selected candidates' details
      const selectedCandidates = candidates.filter(c => selectedIds.includes(c.id));
      console.log("selectedCandidates:", selectedCandidates.length);
      
      if (selectedCandidates.length === 0) {
        showError("No candidates selected");
        setSendingEmails(false); // Reset loading state
        return;
      }
      
      if (actionType === "Approval") {
        // Use the same logic as JobInterviewDetails for approval emails (no credentials needed)
        const emails = selectedCandidates.map(candidate => {
          if (!candidate || !candidate.email) return null;

          return {
            to: candidate.email,
            subject: `Congratulations ${candidate.name}! You passed CV Ranking`,
            body: emailBody
              .replace('{candidateName}', candidate.name)
              .replace('{phaseName}', 'CV Ranking')
              .replace('{phaseOrder}', '1')
              .replace('{jobTitle}', jobTitle)
          };
        }).filter(e => e !== null);

        // Send acceptance emails using the same endpoint as JobInterviewDetails (no credentials)
        const response = await fetch('http://localhost:5000/api/email/send-acceptance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emails })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to send emails');
        }

        showSuccess(`Approval emails sent successfully to ${selectedCandidates.length} candidates!`);
        setShowModal(false);
        
      } else {
        // For Quiz emails, use the same logic as JobInterviewDetails (requires credentials)
        if (!hrEmail || !hrPassword) {
          showError("Email credentials are required for sending quiz emails");
          setSendingEmails(false); // Reset loading state
          return;
        }

        // First, we need to get job application IDs for selected candidates
        const jobApplicationIds = await Promise.all(
          selectedCandidates.map(async (candidate) => {
            try {
              const response = await fetch(`http://localhost:5000/api/candidate/applications/${candidate.id}`);
              const data = await response.json();
              
              if (response.ok && data.applications && data.applications.length > 0) {
                // Find the application for this job
                const jobApp = data.applications.find(app => app.job_id === parseInt(jobId));
                return jobApp ? jobApp.id : null;
              }
              return null;
            } catch (error) {
              console.error(`Error getting application for candidate ${candidate.id}:`, error);
              return null;
            }
          })
        );

        const validJobApplicationIds = jobApplicationIds.filter(id => id !== null);

        if (validJobApplicationIds.length === 0) {
          showError('No valid job applications found for selected candidates');
          setSendingEmails(false); // Reset loading state
          return;
        }

        console.log('Sending quiz to jobApplicationIds:', validJobApplicationIds);

        // Get Phase 1 for this job
        const phaseResponse = await fetch(`http://localhost:5000/api/phase/job/${jobId}`);
        const phaseData = await phaseResponse.json();

        if (phaseData.length === 0) {
          showError('No phases found for this job');
          setSendingEmails(false); // Reset loading state
          return;
        }

        const firstPhase = phaseData[0];

        // Send quiz using the same endpoint as JobInterviewDetails (requires credentials)
        const quizResponse = await fetch('http://localhost:5000/api/quiz/assign-and-send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phase_id: firstPhase.id,
            phaseOrder: firstPhase.phase_order,
            jobId: jobId,
            jobApplicationIds: validJobApplicationIds,
            quizLink: `http://localhost:3000/interview/${jobId}/${firstPhase.id}/start`,
            hrEmail: hrEmail,
            hrPassword: hrPassword
          })
        });

        const quizData = await quizResponse.json();

        if (!quizResponse.ok) {
          throw new Error(quizData.message || quizData.error || 'Failed to send quiz');
        }

        showSuccess(`Quiz emails sent successfully to ${validJobApplicationIds.length} candidates!`);
        setShowModal(false);
        
        // Reset credentials after successful send
        setHrEmail("");
        setHrPassword("");
        setShowPassword(false);
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      showError(`Failed to send emails: ${error.message}`);
    } finally {
      setSendingEmails(false);
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
                onClick={actionType === "Approval" ? handleSendEmails : () => setModalStep(3)}
                disabled={sendingEmails || selectedIds.length === 0}
              >
                {sendingEmails ? 'Sending...' : (actionType === "Approval" ? "Send Emails" : "Next")}
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
                disabled={sendingEmails || (actionType !== "Approval" && (!hrEmail || !hrPassword || hrPassword.length < 16))}
              >
                {sendingEmails ? 'Sending...' : 'Send Emails'}
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