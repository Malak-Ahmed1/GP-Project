import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Unlock, ChevronLeft, User, AlertTriangle, CheckCircle, Mail, Clock } from 'lucide-react';
import axios from 'axios';
function JobInterviewDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [phases, setPhases] = useState([]);
  const [activePhase, setActivePhase] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [emailBody, setEmailBody] = useState('');
  const [modalType, setModalType] = useState('quiz'); // 'quiz' or 'acceptance'

  // Filter and Ranking states
  const [showFilter, setShowFilter] = useState(false);
  const [rankingOption, setRankingOption] = useState({});  // now per phase

  const [selectedCandidate, setSelectedCandidate] = useState(null);



  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Get job info
        // const jobRes = await axios.get(`/api/job/${jobId}`);
        const jobRes = await axios.get(`http://localhost:5000/api/job/${jobId}`);

        setJob(jobRes.data);

        // 2️⃣ Get all phases for this job
        // const phasesRes = await axios.get(`/api/phase/job/${jobId}`);
        const phasesRes = await axios.get(`http://localhost:5000/api/phase/job/${jobId}`);

        const phasesData = phasesRes.data;

        const phasesWithCandidates = await Promise.all(
          phasesData.map(async (phase) => {
            // const candidatesRes = await axios.get(`/api/phase-candidates/phase/${phase.id}`);
            let candidatesRes;
            if (phase.quiz_sent) {
              // Fetch only candidates already assigned to this phase
              candidatesRes = await axios.get(
                `http://localhost:5000/api/phase-candidates/phase/${phase.id}`
              );
            } else {
              // Fetch all eligible candidates for this phase
              candidatesRes = await axios.get(
                `http://localhost:5000/api/quiz/select/${jobId}/${phase.phase_order}`
              );
            }
            console.log('Candidates for phase', phase.id, candidatesRes.data);

            const candidates = candidatesRes.data.map(c => ({
              id: c.candidate_id || c.id,                // Replace id mapping
              name: c.candidate_name || c.name || 'Unknown',
              // VERY IMPORTANT FIX
              phase_candidate_id:
                c.phase_candidate_id ||
                c.id,
              email: c.candidate_email || c.email || '',
              job_application_id: c.job_application_id,  // ADD this line
              score: Number(c.phase_score) || 0,
              cgpa_phase_score: Number(c.cgpa_phase_score) || 0,

              maxScore: 100,
              cheatingFlags: c.cheating_flag ? [String(c.cheating_flag)] : [],
              submittedAt: c.date || null,
              timeSpent: 'N/A',
              answers: []
            }));
            return {
              ...phase, candidates, quizSent: phase.quiz_sent || false,
              acceptanceSent: phase.acceptance_sent || false

            };
          })
        );


        setPhases(phasesWithCandidates);

        // Default active phase
        setActivePhase(phasesWithCandidates[0]?.id || null);
      } catch (err) {
        console.error('Error fetching job or phase data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [jobId]);


  useEffect(() => {
    const savedRanking = localStorage.getItem('rankingOption');
    if (savedRanking) {
      setRankingOption(JSON.parse(savedRanking));
    }
  }, []);
  const handleCandidateClick = async (candidate) => {
    try {
      console.log("Clicked candidate:", candidate);
      console.log("phase_candidate_id:", candidate.phase_candidate_id);
      // Use phase_candidate_id here (NOT candidate.id)
      const res = await axios.get(
        `http://localhost:5000/api/candidate-answer/phase-candidate/${candidate.phase_candidate_id}`
      );
      console.log("API response:", res.data);
      const answers = res.data.map(a => ({
        id: a.id,
        question: a.ques_text,
        rawAnswer: a.raw_answer,
        polishedAnswer: a.polished_answer,
        answer: a.polished_answer || a.raw_answer,
        idealAnswer: a.correct_answer,
        score: a.score,
        maxScore: 100
      }));

      setSelectedCandidate({ ...candidate, answers });
    } catch (err) {
      console.error("Error fetching candidate answers:", err);
      alert("Failed to load candidate answers");
    }
  };
  const handleSendAcceptanceClick = () => {
    const currentPhase = phases.find(p => p.id === activePhase);

    if (!currentPhase) return;

    // ✅ get filtered candidates
    const filtered = getSortedCandidates(currentPhase.candidates, currentPhase.id);

    // ✅ select only filtered candidates by default
    setSelectedCandidates(filtered.map(c => c.id));

    setModalType('acceptance');
    setModalStep(1);
    setEmailBody(`Dear Candidate,

Congratulations! We are pleased to inform you that you have successfully passed the ${currentPhase?.name}.

Your performance has been impressive, and we would like to invite you to the next phase of our hiring process.

Next Steps: [NEXT_PHASE_DETAILS]
Deadline: 3 days from now

Best regards,
HR Team`);
    setShowModal(true);
  };

  const handleSendQuizClick = () => {
    setModalType('quiz');
    setModalStep(1);
    setSelectedCandidates([]);
    setEmailBody(`Dear Candidate,

You have been selected for the next phase of our hiring process. Please complete the technical assessment by clicking the link below.

Assessment Link: [QUIZ_LINK]

Deadline: 3 days from now

Best regards,
HR Team`);
    setShowModal(true);
  };

  const toggleSelectAll = () => {
    const currentPhase = phases.find(p => p.id === activePhase);
    if (selectedCandidates.length === currentPhase.candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(currentPhase.candidates.map(c => c.id));
    }
  };

  const handleCheckbox = (id) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSendEmails = async () => {
    if (selectedCandidates.length === 0) return;

    try {
      const currentPhase = phases.find(p => p.id === activePhase);

      if (!currentPhase) {
        alert('Current phase not found!');
        return;
      }

      if (modalType === 'quiz') {
        const currentPhase = phases.find(p => p.id === activePhase);

        if (!currentPhase) return alert('Current phase not found!');

        // Get jobApplicationIds from selected candidates
        const jobApplicationIds = selectedCandidates.map(id => {
          const candidate = currentPhase.candidates.find(c => c.id === id);
          return candidate.job_application_id; // <-- make sure you have this in your frontend
        });

        const response = await axios.post(
          "http://localhost:5000/api/quiz/assign-and-send",
          {
            phase_id: currentPhase.id,
            phaseOrder: currentPhase.phase_order,
            jobId: jobId,
            jobApplicationIds,
            quizLink: `https://example.com/quiz/${currentPhase.phase_order}`
          }
        );

        alert(response.data.message);

        // Update frontend state to mark quiz sent AND show only selected candidates
        setPhases(prev =>
          prev.map(p =>
            p.id === activePhase
              ? {
                ...p,
                quizSent: true,
                candidates: p.candidates.filter(c => selectedCandidates.includes(c.id))
              }
              : p
          )
        );
        setShowModal(false);
      } else if (modalType === 'acceptance') {
        const currentPhase = phases.find(p => p.id === activePhase);

        const emails = selectedCandidates.map(id => {
          const candidate = currentPhase.candidates.find(c => c.id === id);
          if (!candidate || !candidate.email) return null;

          return {
            to: candidate.email,
            subject: `Congratulations ${candidate.name}! You passed Phase ${currentPhase.phase_order}`,
            body: emailBody
              .replace('{candidateName}', candidate.name)
              .replace('{phaseName}', currentPhase.name)
              .replace('{phaseOrder}', currentPhase.phase_order)
              .replace('{jobTitle}', job.title)
          };
        }).filter(e => e !== null);

        await axios.post('http://localhost:5000/api/send-acceptance', { emails });

        await axios.post(
          "http://localhost:5000/api/phase/mark-acceptance",
          { phase_id: currentPhase.id }
        );

        alert(`Acceptance emails sent to ${emails.length} candidates!`);

        // Prepare jobApplicationIds
        const jobApplicationIds = selectedCandidates.map(id => {
          const candidate = currentPhase.candidates.find(c => c.id === id);
          return candidate.job_application_id;
        });

        // Mark them as passed
        await axios.post("http://localhost:5000/api/phase-candidates/mark-passed", {
          phase_id: currentPhase.id,
          candidate_ids: jobApplicationIds
        });

        // ✅ IMPORTANT FIX: keep ONLY accepted candidates
        setPhases(prev =>
          prev.map(p =>
            p.id === activePhase
              ? {
                ...p,
                acceptanceSent: true,
                candidates: p.candidates.filter(c =>
                  selectedCandidates.includes(c.id)
                )
              }
              : p
          )
        );
        setShowModal(false);
      }


    }
    catch (err) {
      console.error(err);
      alert('Error sending emails: ' + (err.response?.data?.message || err.message));
    }
  };



  const togglePhaseStatus = () => {
    const phase = phases.find(p => p.id === activePhase);
    if (phase) {
      setPhases(prev => prev.map(p =>
        p.id === phase.id
          ? { ...p, status: p.status === 'closed' ? 'open' : 'closed' }
          : p
      ));
    }
  };

  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleRankingChange = (type, filter = null, value = null) => {
    setRankingOption(prev => {
      const newRanking = {
        ...prev,
        [activePhase]: { type, filter, value }
      };
      localStorage.setItem('rankingOption', JSON.stringify(newRanking));
      return newRanking;
    });
    setShowFilter(false);
  };

  const getSortedCandidates = (candidates, phaseId) => {
    if (!candidates) return [];

    const currentPhase = phases.find(p => p.id === phaseId);

    // ✅ if acceptance already sent → DO NOT FILTER
    if (currentPhase?.acceptanceSent) {
      return [...candidates].sort((a, b) =>
        (b.score || 0) - (a.score || 0)
      );
    }

    const sortedCandidates = [...candidates];
    const option = rankingOption[phaseId] || {
      type: 'phase_score',
      filter: null,
      value: null
    };

    const key = option.type === 'cgpa'
      ? 'cgpa_phase_score'
      : 'score';

    sortedCandidates.sort((a, b) =>
      (b[key] || 0) - (a[key] || 0)
    );

    if (option.filter === 'top' && option.value) {
      return sortedCandidates.slice(0, option.value);
    }

    if (option.filter === 'threshold' && option.value != null) {
      return sortedCandidates.filter(c =>
        (c[key] || 0) >= option.value
      );
    }

    return sortedCandidates;
  };

  const currentPhase = phases.find(p => p.id === activePhase);

  if (loading) {
    return (
      <div className={`page-container ${showModal ? 'blurred' : ''}`}>
        <div className="card" style={{ maxWidth: '1100px', textAlign: 'center', padding: '60px' }}>
          Loading...
        </div>
      </div>
    );
  }

  // Candidate Detail View
  if (selectedCandidate) {
    return (
      <div className={`page-container ${showModal ? 'blurred' : ''}`}>
        <div className="card" style={{ maxWidth: '900px' }}>
          <button
            className="back-btn"
            onClick={() => setSelectedCandidate(null)}
            style={{ marginBottom: '20px' }}
          >
            <ChevronLeft size={18} />
            Back to Results
          </button>

          <div className="candidate-detail-header">
            <div className="candidate-info">
              <div className="candidate-avatar-large">
                {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <button
                  className="candidate-name-link"
                  onClick={() => navigate(`/candidate/${selectedCandidate.id}`, {
                    state: {
                      from: 'job-interview-details',
                      jobId: jobId
                    }
                  })}
                >
                  {selectedCandidate.name}
                </button>
                <p>{selectedCandidate.email}</p>
              </div>
            </div>

            <div className="candidate-stats">
              <div className="stat-box">
                <div className="stat-value">{selectedCandidate?.score || 0}/{selectedCandidate?.maxScore || 0}</div>
                <div className="stat-label">Score</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{selectedCandidate?.timeSpent?.replace(' min', '') || '0'}/{selectedCandidate?.phaseTimeLimit?.replace(' minutes', '') || 'N/A'}</div>
                <div className="stat-label">Time</div>
              </div>

            </div>
          </div>

          {selectedCandidate.cheatingFlags?.length > 0 && (
            <div className="cheating-alert">
              <AlertTriangle size={20} />
              <div>
                <strong>Cheating Flags Detected:</strong>
                <ul>
                  {selectedCandidate.cheatingFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="answers-section">
            <h3>Question Responses</h3>
            {selectedCandidate.answers?.map((item, idx) => (
              <div key={idx} className="answer-card">
                <div className="answer-header">
                  <span className="question-number">Q{idx + 1}</span>
                  <span className={`score-badge ${item.score === item.maxScore ? 'perfect' : item.score >= item.maxScore * 0.7 ? 'good' : 'poor'}`}>
                    {item.score}/{item.maxScore}
                  </span>
                </div>
                <div className="question-text">{item.question}</div>
                <div className="answer-text">
                  <strong>Candidate Answer:</strong>
                  <p>{item.answer}</p>
                </div>
                <div className="ideal-answer">
                  <strong>Ideal Answer:</strong>
                  <p>{item.idealAnswer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`page-container ${showModal ? 'blurred' : ''}`}>
        <div className="card" style={{ maxWidth: '1100px' }}>
          {/* Header */}
          <div className="job-details-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <button
                  className="back-link"
                  onClick={() => navigate('/interviews')}
                >
                  <ChevronLeft size={16} />
                  Back to Interviews
                </button>
                <h1>{job?.title}</h1>
                <p className="job-meta">{job?.company} • Job #{jobId}</p>
              </div>

              {/* Phase Status Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="phase-status-toggle">
                  <span className={`status-label ${currentPhase?.status === 'closed' ? 'status-closed' : 'status-open'}`}>
                    {currentPhase?.status === 'closed' ? 'Status: Closed' : 'Status: Open'}
                  </span>
                  <button
                    className="toggle-switch"
                    onClick={togglePhaseStatus}
                  >
                    {currentPhase?.status === 'closed' ? <Unlock size={16} /> : <Lock size={16} />}
                  </button>
                </div>

                {/* Filter Dropdown - Only show when phase is closed */}
                {currentPhase?.status === 'closed' && !currentPhase.acceptanceSent && (
                  <div className="phase-filter-dropdown">
                    <button
                      className="filter-button"
                      onClick={toggleFilter}
                    >
                      <span>Filter</span>
                      <ChevronLeft size={14} className={`filter-icon ${showFilter ? 'open' : ''}`} />
                    </button>
                    {showFilter && (
                      <div className="filter-menu">
                        {/* Ranking Type */}
                        <button
                          className="filter-option"
                          onClick={() => handleRankingChange('phase_score')}
                        >
                          Rank by Phase Score
                        </button>
                        <button
                          className="filter-option"
                          onClick={() => handleRankingChange('cgpa')}
                        >
                          Rank by CGPA
                        </button>

                        {/* Top K / Threshold Inputs */}
                        <div className="filter-extra" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <input
                            type="number"
                            placeholder="Top K"
                            style={{ padding: '4px' }}
                            onBlur={(e) => handleRankingChange(
                              rankingOption[activePhase]?.type || 'phase_score',
                              'top',
                              Number(e.target.value)
                            )}
                          />
                          <input
                            type="number"
                            placeholder="Threshold"
                            style={{ padding: '4px' }}
                            onBlur={(e) => handleRankingChange(
                              rankingOption[activePhase]?.type || 'phase_score',
                              'threshold',
                              Number(e.target.value)
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phase Tabs */}
          <div className="phase-tabs-container">
            <div className="phase-tabs">
              {phases.map((phase) => (
                <button
                  key={phase.id}
                  className={`phase-tab ${activePhase === phase.id ? 'active' : ''} ${phase.status === 'locked' ? 'locked' : ''}`}
                  onClick={() => phase.status !== 'locked' && setActivePhase(phase.id)}
                  disabled={phase.status === 'locked'}
                >
                  <div className="tab-content">
                    <span className="phase-number">Phase {phase.phase_order}</span>
                    <span className="phase-name">{phase.name}</span>
                    {phase.quizSent && (
                      <span className="quiz-badge">
                        {phase.status === 'completed' ? 'Completed' : 'Quiz Sent'}
                      </span>
                    )}
                  </div>
                  {phase.status === 'locked' && <Lock size={14} />}
                  {phase.status === 'completed' && <CheckCircle size={14} className="completed-icon" />}
                </button>
              ))}
            </div>
          </div>

          {/* Phase Content */}
          {currentPhase && (
            <div className="phase-content">
              {!currentPhase.quizSent ? (
                // Show Send Quiz Button
                <div className="quiz-action-section">
                  <div className="quiz-action-card">
                    <div className="quiz-icon">
                      <Mail size={40} />
                    </div>
                    <h3>Send Quiz Links</h3>
                    <p>Select candidates and send them quiz links for this phase.</p>
                    <button
                      className="send-quiz-btn"
                      onClick={handleSendQuizClick}
                      disabled={currentPhase.quizSent} // <-- added
                    >
                      <Mail size={18} />
                      Send Quiz Link
                    </button>

                  </div>
                </div>
              ) : (
                // Show Candidates Results
                <div className="results-section">
                  <div className="results-header">
                    <h3>Candidate Results</h3>
                    <span className="results-count">
                      {currentPhase.candidates.length} candidates
                    </span>
                    <div className="ranking-label">
                      Ranking by: {rankingOption[currentPhase.id]?.type === 'cgpa' ? 'CGPA' : 'Phase Score'}
                      {rankingOption[currentPhase.id]?.filter === 'top' && rankingOption[currentPhase.id]?.value
                        ? ` (Top ${rankingOption[currentPhase.id].value})`
                        : ''}
                      {rankingOption[currentPhase.id]?.filter === 'threshold' && rankingOption[currentPhase.id]?.value
                        ? ` (Above ${rankingOption[currentPhase.id].value})`
                        : ''}
                    </div>
                  </div>

                  <div className="candidates-list">
                    {getSortedCandidates(currentPhase.candidates, currentPhase.id).map((candidate, index) => (
                      <div key={candidate.id} className="candidate-result-card" onClick={() => handleCandidateClick(candidate)}>
                        <div className="candidate-rank">#{index + 1}</div>

                        <div className="candidate-avatar">
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </div>

                        <div className="candidate-details">
                          <div className="candidate-name">{candidate.name}</div>
                          <div className="candidate-email">{candidate.email}</div>
                          {candidate.cheatingFlags?.length > 0 && (
                            <div className="cheating-warning">
                              <AlertTriangle size={12} />
                              {candidate.cheatingFlags.length} flag{candidate.cheatingFlags.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        <div className="candidate-score-section">
                          <div className={`score-circle ${candidate.score >= 80 ? 'high' : candidate.score >= 60 ? 'medium' : 'low'}`}>
                            {rankingOption[currentPhase.id]?.type === 'cgpa' ? candidate.cgpa_phase_score : candidate.score}%
                          </div>
                          {candidate.submittedAt && (
                            <div className="submitted-time">
                              <Clock size={12} />
                              {candidate.submittedAt}
                            </div>
                          )}
                        </div>

                        <div className="view-details-arrow">→</div>
                      </div>
                    ))}
                  </div>

                  {/* Send Acceptance Mail Button - At bottom of ranking */}
                  {currentPhase.candidates.some(c => c.score > 0) && !currentPhase.acceptanceSent && (
                    <div className="acceptance-mail-section">
                      <div className="acceptance-mail-card">
                        <div className="mail-icon">
                          <Mail size={40} />
                        </div>
                        <h3>Send Acceptance Mail</h3>
                        <p>Select candidates to send acceptance emails for this phase.</p>
                        <button
                          className="send-acceptance-btn centered"
                          onClick={handleSendAcceptanceClick}
                        >
                          <Mail size={18} />
                          Send Acceptance Mail
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Candidate Selection Modal - Outside page-container to avoid blur */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalStep === 1
                  ? modalType === 'acceptance'
                    ? 'Select Candidates for Acceptance Mail'
                    : 'Select Candidates for Quiz'
                  : modalType === 'acceptance'
                    ? 'Compose Acceptance Email'
                    : 'Compose Quiz Email'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {modalStep === 1 ? (
                <>
                  <div className="modal-actions">
                    <button className="secondary-btn" onClick={toggleSelectAll}>
                      {selectedCandidates.length === currentPhase?.candidates?.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                    <span className="selected-count">
                      {selectedCandidates.length} selected
                    </span>
                  </div>

                  <div className="table-wrapper">
                    <table className="selection-table">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Name</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPhase?.candidates?.map(c => (
                          <tr key={c.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedCandidates.includes(c.id)}
                                onChange={() => handleCheckbox(c.id)}
                              />
                            </td>
                            <td>{c.name}</td>
                            <td>{c.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="modal-footer">
                    <button className="secondary-btn" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button
                      className="primary-btn"
                      disabled={selectedCandidates.length === 0}
                      onClick={() => setModalStep(2)}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mail-info">
                    {modalType === 'acceptance'
                      ? `Sending acceptance mail to ${selectedCandidates.length} candidates`
                      : `Sending quiz link to ${selectedCandidates.length} candidates`
                    }
                  </p>

                  <textarea
                    className="email-textarea"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows="8"
                  />

                  <div className="modal-footer">
                    <button className="secondary-btn" onClick={() => setModalStep(1)}>
                      Back
                    </button>
                    <button className="primary-btn-send" onClick={handleSendEmails}>
                      {modalType === 'acceptance' ? 'Send Acceptance Mail' : 'Send Quiz Links'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default JobInterviewDetails;
