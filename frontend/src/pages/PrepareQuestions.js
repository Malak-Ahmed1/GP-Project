import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import { FiPlus, FiTrash2, FiEdit2, FiX, FiSave } from "react-icons/fi";

function PrepareQuestions() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [phases, setPhases] = useState([]);
  const [activePhase, setActivePhase] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch job details
  useEffect(() => {
    API.get(`/jobs/${jobId}`)
      .then((res) => {
        if (res.data) {
          setJob(res.data);
        } else {
          // Mock data
          setJob({
            id: jobId,
            title: "Frontend Developer",
            description: "We are looking for a skilled Frontend Developer proficient in React, JavaScript, and modern web technologies. The ideal candidate will have experience with responsive design, state management, and API integration.",
            status: "open"
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setJob({
          id: jobId,
          title: "Frontend Developer",
          description: "We are looking for a skilled Frontend Developer proficient in React, JavaScript, and modern web technologies. The ideal candidate will have experience with responsive design, state management, and API integration.",
          status: "open"
        });
        setLoading(false);
      });
  }, [jobId]);

  // Create new phase
  const createPhase = () => {
    const newPhase = {
      id: Date.now(),
      name: `Phase ${phases.length + 1}`,
      jobDescription: job?.description || "",
      additionalQuestions: "",
      closeDate: "",
      numberOfQuestions: 5,
      difficultyLevel: "medium",
      interviewTime: 30,
      generatedQuestions: [],
      isEditingName: false
    };
    setPhases([...phases, newPhase]);
    setActivePhase(newPhase.id);
  };

  // Update phase
  const updatePhase = (phaseId, field, value) => {
    setPhases(phases.map(phase => 
      phase.id === phaseId ? { ...phase, [field]: value } : phase
    ));
  };

  // Delete phase
  const deletePhase = (phaseId) => {
    const updatedPhases = phases.filter(phase => phase.id !== phaseId);
    setPhases(updatedPhases);
    if (activePhase === phaseId && updatedPhases.length > 0) {
      setActivePhase(updatedPhases[0].id);
    } else if (updatedPhases.length === 0) {
      setActivePhase(null);
    }
  };

  // Generate demo questions with answers
  const generateQuestions = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;

    const demoQuestionsWithAnswers = [
      {
        question: "What is your experience with React and its core concepts?",
        answer: "I have 3+ years of experience with React. I'm proficient in hooks, context API, Redux for state management, and have built multiple production applications using modern React patterns including custom hooks and performance optimization techniques."
      },
      {
        question: "How do you handle state management in large applications?",
        answer: "I use Redux for global state management in large applications, combined with React's built-in useState and useReducer for local component state. For complex state logic, I implement the reducer pattern and use Redux Toolkit to reduce boilerplate code."
      },
      {
        question: "Explain the difference between props and state.",
        answer: "Props are read-only data passed from parent to child components and cannot be modified by the child. State is mutable data owned by the component that can be updated using setState or useState hook, triggering re-renders when changed."
      },
      {
        question: "How do you optimize React application performance?",
        answer: "I use React.memo for component memoization, useMemo for expensive calculations, useCallback for function references, lazy loading with React.lazy and Suspense, code splitting, and virtual scrolling for long lists. I also use the React DevTools Profiler to identify performance bottlenecks."
      },
      {
        question: "Describe your experience with responsive design principles.",
        answer: "I implement mobile-first responsive design using CSS Flexbox, Grid, and media queries. I use relative units (rem, %, vw/vh), CSS variables for theming, and testing across multiple device sizes. I'm experienced with CSS frameworks like Tailwind and styled-components."
      },
      {
        question: "How do you approach debugging complex frontend issues?",
        answer: "I start by reproducing the issue consistently, then use Chrome DevTools for network analysis, console debugging, and React DevTools for component inspection. I add strategic console logs, use debugger statements, and write unit tests to isolate the problem. For async issues, I trace the call stack and check for race conditions."
      },
      {
        question: "What testing strategies do you use for frontend code?",
        answer: "I write unit tests with Jest and React Testing Library, integration tests for component interactions, and E2E tests with Cypress. I follow TDD when possible, maintain high code coverage, and test edge cases, user interactions, and accessibility compliance."
      },
      {
        question: "Explain CSS-in-JS and its benefits over traditional CSS.",
        answer: "CSS-in-JS allows scoped styling per component, preventing global namespace pollution. It enables dynamic styling based on props, automatic vendor prefixing, and dead code elimination. Popular libraries include styled-components and Emotion, which provide better maintainability and theming capabilities."
      },
      {
        question: "How do you handle API integration and error handling?",
        answer: "I use Axios or Fetch with async/await, implement request/response interceptors for authentication and logging, create reusable API hooks, and use try-catch blocks for error handling. I display user-friendly error messages and implement retry logic for failed requests."
      },
      {
        question: "Describe a challenging project you worked on and how you solved it.",
        answer: "I built a real-time dashboard handling 10k+ concurrent users. The challenge was performance with frequent data updates. I implemented WebSocket connections, used React.memo and useMemo for optimization, virtualized long lists, and implemented optimistic updates for better UX. Result: 60% reduction in re-renders and smooth 60fps performance."
      }
    ];

    // Select random questions based on numberOfQuestions
    const selectedQuestions = demoQuestionsWithAnswers
      .sort(() => 0.5 - Math.random())
      .slice(0, phase.numberOfQuestions)
      .map((item, index) => ({
        id: Date.now() + index,
        text: item.question,
        answer: item.answer,
        difficulty: phase.difficultyLevel,
        isEditing: false,
        isEditingAnswer: false
      }));

    updatePhase(phaseId, 'generatedQuestions', selectedQuestions);
  };

  // Edit answer
  const editAnswer = (phaseId, questionId, newAnswer) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          generatedQuestions: phase.generatedQuestions.map(q =>
            q.id === questionId ? { ...q, answer: newAnswer } : q
          )
        };
      }
      return phase;
    }));
  };

  // Toggle answer editing
  const toggleAnswerEdit = (phaseId, questionId) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          generatedQuestions: phase.generatedQuestions.map(q =>
            q.id === questionId ? { ...q, isEditingAnswer: !q.isEditingAnswer } : { ...q, isEditingAnswer: false }
          )
        };
      }
      return phase;
    }));
  };

  // Save phase (mock function - would connect to backend)
  const savePhase = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    // Here you would typically send data to backend
    alert(`Phase "${phase.name}" saved successfully with ${phase.generatedQuestions.length} questions!`);
  };

  // Edit question
  const editQuestion = (phaseId, questionId, newText) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          generatedQuestions: phase.generatedQuestions.map(q =>
            q.id === questionId ? { ...q, text: newText } : q
          )
        };
      }
      return phase;
    }));
  };

  // Delete question
  const deleteQuestion = (phaseId, questionId) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          generatedQuestions: phase.generatedQuestions.filter(q => q.id !== questionId)
        };
      }
      return phase;
    }));
  };

  // Toggle question editing
  const toggleQuestionEdit = (phaseId, questionId) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          generatedQuestions: phase.generatedQuestions.map(q =>
            q.id === questionId ? { ...q, isEditing: !q.isEditing } : { ...q, isEditing: false }
          )
        };
      }
      return phase;
    }));
  };

  // Add custom question
  const addCustomQuestion = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;

    const customText = phase.additionalQuestions?.trim();
    if (!customText) return;

    const newQuestion = {
      id: Date.now(),
      text: customText,
      answer: '',
      difficulty: phase.difficultyLevel,
      isEditing: false,
      isEditingAnswer: false,
      isCustom: true
    };

    setPhases(phases.map(p => {
      if (p.id === phaseId) {
        return {
          ...p,
          generatedQuestions: [...p.generatedQuestions, newQuestion],
          additionalQuestions: "" // Clear after adding
        };
      }
      return p;
    }));
  };

  // Rename phase
  const renamePhase = (phaseId, newName) => {
    updatePhase(phaseId, 'name', newName);
    updatePhase(phaseId, 'isEditingName', false);
  };

  if (loading) {
    return <div className="page-container"><p>Loading...</p></div>;
  }

  const currentPhase = phases.find(p => p.id === activePhase);

  return (
    <div className="page-container prepare-container">
      <div className="card prepare-questions-card">
        {/* Header with Job Info */}
        <div className="prepare-header">
          <div className="header-left">
            <div className="job-info-badge">
              <span className="job-id">Job #{job?.id?.slice(-6) || '000000'}</span>
              <h1>{job?.title}</h1>
            </div>
            <p className="subtitle">Prepare and manage interview questions for each phase</p>
          </div>
          <button className="create-phase-btn" onClick={createPhase}>
            <FiPlus size={20} />
            <span>Create New Phase</span>
          </button>
        </div>

        {/* Phase Tabs */}
        {phases.length > 0 && (
          <div className="phase-tabs-container">
            <div className="phase-tabs">
              {phases.map((phase, index) => (
                <div
                  key={phase.id}
                  className={`phase-tab ${activePhase === phase.id ? 'active' : ''}`}
                  onClick={() => setActivePhase(phase.id)}
                >
                  <div className="tab-content">
                    {phase.isEditingName ? (
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                        onBlur={() => renamePhase(phase.id, phase.name)}
                        onKeyPress={(e) => e.key === 'Enter' && renamePhase(phase.id, phase.name)}
                        autoFocus
                        className="phase-name-input"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="phase-number">Phase {index + 1}</span>
                        <span className="phase-name">{phase.name}</span>
                        {phase.generatedQuestions.length > 0 && (
                          <span className="question-count">{phase.generatedQuestions.length} Qs</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="tab-actions">
                    <button
                      className="tab-action-btn edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePhase(phase.id, 'isEditingName', true);
                      }}
                      title="Rename"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      className="tab-action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhase(phase.id);
                      }}
                      title="Delete"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase Content */}
        {currentPhase ? (
          <div className="phase-content">
            {/* Phase Actions Bar */}
            <div className="phase-actions-bar">
              <div className="phase-info">
                <span className="phase-status">Active Phase</span>
                <span className="phase-questions-count">
                  {currentPhase.generatedQuestions.length} questions configured
                </span>
              </div>
              <button
                className="save-phase-btn"
                onClick={() => savePhase(currentPhase.id)}
              >
                <FiSave size={18} />
                Save Phase
              </button>
            </div>

            <div className="phase-form">
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Job Description (Auto-filled)</label>
                  <textarea
                    className="input"
                    rows="4"
                    value={currentPhase.jobDescription}
                    onChange={(e) => updatePhase(currentPhase.id, 'jobDescription', e.target.value)}
                    readOnly
                  />
                </div>
              </div>

              <div className="form-row custom-question-row">
                <div className="form-group full-width">
                  <label className="custom-question-label">
                    <FiPlus size={16} style={{ marginRight: '6px' }} />
                    Add Custom Question
                  </label>
                  <div className="custom-question-input-group">
                    <input
                      type="text"
                      className="input custom-question-input"
                      placeholder="Type your custom question here and click Add..."
                      value={currentPhase.additionalQuestions}
                      onChange={(e) => updatePhase(currentPhase.id, 'additionalQuestions', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomQuestion(currentPhase.id)}
                    />
                    <button
                      className="add-question-btn"
                      onClick={() => addCustomQuestion(currentPhase.id)}
                      disabled={!currentPhase.additionalQuestions?.trim()}
                    >
                      <FiPlus size={18} />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Close Date</label>
                  <input
                    type="date"
                    className="input"
                    value={currentPhase.closeDate}
                    onChange={(e) => updatePhase(currentPhase.id, 'closeDate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Questions per Interview</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    max="50"
                    value={currentPhase.numberOfQuestions}
                    onChange={(e) => updatePhase(currentPhase.id, 'numberOfQuestions', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Difficulty Level</label>
                  <select
                    className="input"
                    value={currentPhase.difficultyLevel}
                    onChange={(e) => updatePhase(currentPhase.id, 'difficultyLevel', e.target.value)}
                  >
                    <option value="easy"> Easy</option>
                    <option value="medium"> Medium</option>
                    <option value="hard"> Hard</option>
                    <option value="mixed"> Mixed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Time Limit (minutes)</label>
                  <input
                    type="number"
                    className="input"
                    min="5"
                    max="180"
                    value={currentPhase.interviewTime}
                    onChange={(e) => updatePhase(currentPhase.id, 'interviewTime', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="generate-section">
                <button
                  className="generate-btn"
                  onClick={() => generateQuestions(currentPhase.id)}
                >
                  <FiSave size={18} style={{ marginRight: '8px' }} />
                  Generate Questions
                </button>
              </div>
            </div>

            {/* Generated Questions */}
            {currentPhase.generatedQuestions.length > 0 && (
              <div className="generated-questions">
                <div className="questions-header">
                  <h3>
                    <span className="question-icon"></span>
                    Interview Questions & Answers
                    <span className="question-badge">{currentPhase.generatedQuestions.length}</span>
                  </h3>
                </div>
                <div className="questions-list">
                  {currentPhase.generatedQuestions.map((question, index) => (
                    <div key={question.id} className={`question-item ${question.isCustom ? 'custom' : ''}`}>
                      <div className="question-number">{index + 1}</div>
                      <div className="question-content">
                        {/* Question Section */}
                        <div className="question-section">
                          <label className="section-label">Question:</label>
                          {question.isEditing ? (
                            <input
                              type="text"
                              className="input question-edit-input"
                              value={question.text}
                              onChange={(e) => editQuestion(currentPhase.id, question.id, e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && toggleQuestionEdit(currentPhase.id, question.id)}
                              autoFocus
                            />
                          ) : (
                            <p className="question-text">{question.text}</p>
                          )}
                          <div className="question-actions-row">
                            <button
                              className="question-action-btn edit"
                              onClick={() => toggleQuestionEdit(currentPhase.id, question.id)}
                              title={question.isEditing ? "Save Question" : "Edit Question"}
                            >
                              {question.isEditing ? <FiSave size={16} /> : <FiEdit2 size={16} />}
                            </button>
                            <button
                              className="question-action-btn delete"
                              onClick={() => deleteQuestion(currentPhase.id, question.id)}
                              title="Delete Question"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Answer Section */}
                        <div className="answer-section">
                          <label className="section-label">Expected Answer:</label>
                          {question.isEditingAnswer ? (
                            <textarea
                              className="input answer-edit-input"
                              rows="3"
                              value={question.answer || ''}
                              onChange={(e) => editAnswer(currentPhase.id, question.id, e.target.value)}
                            />
                          ) : (
                            <p className="answer-text">{question.answer || 'No answer provided yet.'}</p>
                          )}
                          <div className="answer-actions-row">
                            <button
                              className="answer-action-btn edit"
                              onClick={() => toggleAnswerEdit(currentPhase.id, question.id)}
                              title={question.isEditingAnswer ? "Save Answer" : "Edit Answer"}
                            >
                              {question.isEditingAnswer ? <FiSave size={16} /> : <FiEdit2 size={16} />}
                            </button>
                          </div>
                        </div>
                        
                        {question.isCustom && <span className="custom-badge">Custom</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-phase">
            <p>No phases created yet. Click "Create Phase" to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PrepareQuestions;