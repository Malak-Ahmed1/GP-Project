import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Removed API import to fix 'no-unused-vars' warning
import CandidateTable from "../components/CandidateTable";
import RankControls from "../components/RankControls";

function RankingPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [rankingApplied, setRankingApplied] = useState(false);

  // --- Modal & Selection States ---
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Selection Table, 2: Mail Content
  const [actionType, setActionType] = useState(""); // "Approval" or "Quiz"
  const [selectedIds, setSelectedIds] = useState([]);
  const [emailBody, setEmailBody] = useState("");

  const handleApplyRanking = (rankingParams) => {
    // Apply ranking logic here
     fetchRanking(); // Refresh data with ranking applied
    setRankingApplied(true);
  };

  const fetchRanking = async () => {
    setLoading(true);
    // Simulating data fetch
    setTimeout(() => {
      const mockData = [
        { id: 1, name: "John Doe", email: "john@example.com", score: 92.5, appliedAt: "2026-02-10 14:30" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", score: 85.2, appliedAt: "2026-02-11 09:15" },
        { id: 3, name: "Mike Ross", email: "mike@example.com", score: 78.0, appliedAt: "2026-02-12 11:00" },
      ];
      setCandidates(mockData);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
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

  const handleSendEmails = () => {
    console.log(`Sending ${actionType} to IDs:`, selectedIds, "Content:", emailBody);
    alert(`Success: ${actionType} emails sent!`);
    setShowModal(false);
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
                {isClosed ? "Status: Closed" : "Status: Open"}
              </span>
              <label className="switch">
                <input type="checkbox" checked={isClosed} onChange={() => setIsClosed(!isClosed)} />
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
            <CandidateTable candidates={candidates} showScore={isClosed} />
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
            : `Compose ${actionType} Mail`}
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
        ) : (
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
                className="primary-btn-send"
                onClick={handleSendEmails}
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

    </div>
  );
}

export default RankingPage;