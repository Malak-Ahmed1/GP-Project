import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Unlock, ChevronLeft, User, AlertTriangle, CheckCircle, Mail, Clock } from 'lucide-react';

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
  const [rankingOption, setRankingOption] = useState('all');
  
  // Candidate detail view
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    // Fetch job details and phases
    setTimeout(() => {
      setJob({
        id: jobId,
        title: 'Frontend Developer',
        company: 'TechCorp Inc.'
      });
      
      // Mock phases data
      setPhases([
        {
          id: 1,
          name: 'Phase 1: Technical Screening',
          status: 'completed',
          quizSent: true,
          phaseTimeLimit: '60 minutes',
          candidates: [
            {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              score: 92,
              maxScore: 100,
              cheatingFlags: ['Multiple face detections', 'Tab switch detected'],
              submittedAt: '2026-02-10 14:30',
              timeSpent: '45 min',
              answers: [
                { question: 'What is React?', answer: 'React is a JavaScript library for building user interfaces.', idealAnswer: 'React is a JavaScript library for building user interfaces, specifically single-page applications with complex UI updates.', score: 10, maxScore: 10 },
                { question: 'Explain useState hook', answer: 'useState is a Hook that lets you add React state to function components.', idealAnswer: 'useState is a React Hook that allows functional components to have local state. It returns an array with the current state value and a setter function.', score: 9, maxScore: 10 },
                { question: 'What are props?', answer: 'Props are arguments passed into React components.', idealAnswer: 'Props (short for properties) are read-only data passed from parent to child components in React.', score: 10, maxScore: 10 }
              ]
            },
            {
              id: 2,
              name: 'Jane Smith',
              email: 'jane@example.com',
              score: 88,
              maxScore: 100,
              cheatingFlags: [],
              submittedAt: '2026-02-11 09:15',
              timeSpent: '38 min',
              answers: [
                { question: 'What is React?', answer: 'A frontend library', idealAnswer: 'React is a JavaScript library for building user interfaces, specifically for single-page applications.', score: 8, maxScore: 10 },
                { question: 'Explain useState hook', answer: 'State management hook', idealAnswer: 'useState is a React Hook that allows functional components to have local state with a getter and setter function.', score: 10, maxScore: 10 },
                { question: 'What are props?', answer: 'Component properties', idealAnswer: 'Props are read-only data passed from parent to child components in React.', score: 10, maxScore: 10 }
              ]
            },
            {
              id: 3,
              name: 'Mike Ross',
              email: 'mike@example.com',
              score: 75,
              maxScore: 100,
              cheatingFlags: ['Copy-paste detected'],
              submittedAt: '2026-02-12 11:00',
              timeSpent: '52 min',
              answers: [
                { question: 'What is React?', answer: 'Framework', idealAnswer: 'React is a JavaScript library for building user interfaces, primarily for single-page applications.', score: 7, maxScore: 10 },
                { question: 'Explain useState hook', answer: 'For state', idealAnswer: 'useState is a React Hook that enables functional components to manage internal state.', score: 8, maxScore: 10 },
                { question: 'What are props?', answer: 'Data passing', idealAnswer: 'Props are the mechanism for passing data from parent to child components in React.', score: 10, maxScore: 10 }
              ]
            }
          ]
        },
        {
          id: 2,
          name: 'Phase 2: Coding Challenge',
          status: 'active',
          quizSent: false,
          phaseTimeLimit: '90 minutes',
          candidates: [
            { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', score: 0, status: 'pending' },
            { id: 5, name: 'Tom Brown', email: 'tom@example.com', score: 0, status: 'pending' },
            { id: 6, name: 'Lisa Chen', email: 'lisa@example.com', score: 0, status: 'pending' }
          ]
        },
        {
          id: 3,
          name: 'Phase 3: Final Interview',
          status: 'locked',
          phaseTimeLimit: '120 minutes',
          candidates: []
        }
      ]);
      
      setActivePhase(1);
      setLoading(false);
    }, 500);
  }, [jobId]);

  const handleSendAcceptanceClick = () => {
    setModalType('acceptance');
    setModalStep(1);
    setSelectedCandidates([]);
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

  const handleSendEmails = () => {
    setPhases(prev => prev.map(p => 
      p.id === activePhase ? { ...p, quizSent: true } : p
    ));
    setShowModal(false);
    alert(`${modalType === 'acceptance' ? 'Acceptance mails' : 'Quiz links'} sent to ${selectedCandidates.length} candidates!`);
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

  const handleRankingChange = (option) => {
    setRankingOption(option);
    setShowFilter(false);
  };

  const getSortedCandidates = (candidates) => {
    let sortedCandidates = [...candidates].sort((a, b) => b.score - a.score);
    
    if (rankingOption === 'phase') {
      // Rank by current phase score only
      sortedCandidates = [...candidates].sort((a, b) => b.score - a.score);
    } else if (rankingOption === 'all') {
      // Rank by all phase scores (sum of scores across all phases)
      const candidatesWithAllScores = candidates.map(candidate => ({
        ...candidate,
        totalScore: candidate.answers?.reduce((sum, item) => sum + item.score, 0) || candidate.score
      }));
      
      sortedCandidates = [...candidatesWithAllScores].sort((a, b) => b.totalScore - a.totalScore);
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
                {currentPhase?.status === 'closed' && (
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
                        <button 
                          className="filter-option"
                          onClick={() => handleRankingChange('phase')}
                        >
                          Rank by Phase Score
                        </button>
                        <button 
                          className="filter-option"
                          onClick={() => handleRankingChange('all')}
                        >
                          Rank by All Phase Scores
                        </button>
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
                    <span className="phase-number">Phase {phase.id}</span>
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
                  </div>

                  <div className="candidates-list">
                    {getSortedCandidates(currentPhase.candidates).map((candidate, index) => (
                      <div 
                        key={candidate.id} 
                        className="candidate-result-card"
                        onClick={() => setSelectedCandidate(candidate)}
                      >
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
                            {candidate.score}%
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
                  {currentPhase.candidates.some(c => c.score > 0) && (
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
