import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import { FiPlus, FiTrash2, FiEdit2, FiX, FiSave } from "react-icons/fi";

function PrepareQuestions() {
  const { jobId } = useParams();
  // Store multiple custom Q&A before adding to phase
  const [customQuestions, setCustomQuestions] = useState([
    { question: "", answer: "" }
  ]);
  const [job, setJob] = useState(null);
  const [phases, setPhases] = useState([]);
  const [activePhase, setActivePhase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [excelFile, setExcelFile] = useState(null);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      API.get(`/job/${jobId}`),
      API.get(`/phase/job/${jobId}`),
      API.get(`/questions/job/${jobId}`)
    ])
      .then(([jobRes, phaseRes, questionsRes]) => {
        const jobData = jobRes.data;
        setJob(jobData);

        // Map questions by phase
        const questionsByPhase = {};
        questionsRes.data.forEach(q => {
          if (!questionsByPhase[q.phase_id]) questionsByPhase[q.phase_id] = [];
          questionsByPhase[q.phase_id].push({
            id: q.id,
            text: q.ques_text,
            answer: q.correct_answer,
            isEditing: false,
            isEditingAnswer: false,
            isCustom: false
          });
        });

        // Map severity numbers to strings
        const difficultyMapReverse = { 1: "easy", 2: "medium", 3: "hard", 4: "mixed" };

        // Merge questions and backend fields into phases
        const fetchedPhases = phaseRes.data.map(phase => ({
          ...phase,
          generatedQuestions: questionsByPhase[phase.id] || [],
          isEditingName: false,
          jobDescription: jobData.job_desc || "",

          // Map backend fields to frontend fields
          numberOfQuestions: phase.num_questions || 5,         // <-- number of questions
          interviewTime: phase.time_limit || 30,              // <-- time limit
          difficultyLevel: difficultyMapReverse[phase.severity] || "easy", // <-- severity
          closeDate: phase.end_date || ""                     // <-- close date
        }));

        setPhases(fetchedPhases);

        if (fetchedPhases.length > 0) setActivePhase(fetchedPhases[0].id);
      })
      .catch(err => console.error("Error fetching job/phases/questions:", err))
      .finally(() => setLoading(false));
  }, [jobId]);


  useEffect(() => {
    if (!job || phases.length === 0) return;

    setPhases(prev =>
      prev.map(phase => ({
        ...phase,
        jobDescription: job.job_desc || ""  // <-- Fill job description here
      }))
    );
  }, [job]);



const uploadExcelQuestions = async (e) => {
  e?.preventDefault();
  e?.stopPropagation();

  alert("✅ Click worked");        // IMPORTANT: alert proves the click works
  console.log("✅ Upload button clicked");

  if (!excelFile) return alert("Please choose an Excel file first.");
  if (!currentPhase?.id) return alert("Choose a phase first.");

  try {
    const fd = new FormData();
    fd.append("file", excelFile);

    const res = await API.post(
      `/questions/upload-excel/${currentPhase.id}`,
      fd
    );

    const createdQuestions = res.data.questions.map(q => ({
      id: q.id,
      text: q.ques_text,
      answer: q.correct_answer,
      isEditing: false,
      isEditingAnswer: false,
      isCustom: true
    }));

    setPhases(prev =>
      prev.map(p =>
        p.id === currentPhase.id
          ? { ...p, generatedQuestions: [...p.generatedQuestions, ...createdQuestions] }
          : p
      )
    );

    setExcelFile(null);
    alert(`Uploaded ${res.data.createdCount} questions ✅`);
  } catch (err) {
    console.error("❌ Upload failed:", err);
    alert(err.response?.data?.error || err.message || "Upload failed");
  }
};

  const createPhase = () => {
    const currentPhase = phases.find(p => p.id === activePhase) || {};

    // Map difficulty string to integer (matches your DB)
    const difficultyMap = {
      easy: 1,
      medium: 2,
      hard: 3,
      mixed: 4
    };

    const phaseData = {
      job_id: jobId,
      time_limit: Number(currentPhase.interviewTime) || 30,
      num_questions: Number(currentPhase.numberOfQuestions) || 5,
      severity: difficultyMap[currentPhase.difficultyLevel || "easy"], // <-- mapped to integer
      end_date: currentPhase.closeDate || null,
      method: "quiz",
      ranked: false,
      available: true,
      link: null
    };

    console.log("DEBUG: Sending phaseData:", phaseData);

    API.post("/phase", phaseData)
      .then(res => {
        const phase = res.data.phase;

        const newPhase = {
          ...phase,
          generatedQuestions: [],
          isEditingName: false,
          interviewTime: phase.time_limit,
          numberOfQuestions: phase.num_questions,
          difficultyLevel: currentPhase.difficultyLevel || "easy", // keep string for frontend
          closeDate: phase.end_date,
          jobDescription: job?.job_desc || ""
        };

        setPhases(prev => [...prev, newPhase]);
        setActivePhase(newPhase.id);

        console.log("Phase created successfully:", newPhase);
      })
      .catch(err => {
        console.error("Error creating phase:", err.response?.data || err);
      });
  };



  // Update phase
  const updatePhase = (phaseId, field, value) => {
    setPhases(phases.map(phase =>
      phase.id === phaseId ? { ...phase, [field]: value } : phase
    ));
  };



  const deletePhase = async (phaseId) => {
    try {
      // Call backend force delete
      await API.delete(`/phase/force/${phaseId}`);

      // Remove from frontend
      const updatedPhases = phases.filter(phase => phase.id !== phaseId);
      setPhases(updatedPhases);

      if (activePhase === phaseId && updatedPhases.length > 0) {
        setActivePhase(updatedPhases[0].id);
      } else if (updatedPhases.length === 0) {
        setActivePhase(null);
      }

      console.log("Phase deleted successfully (backend + frontend)");

    } catch (err) {
      console.error("Error deleting phase:", err);
      alert("Cannot delete phase. It may have questions or server error.");
    }
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

  const toggleAnswerEdit = async (phaseId, questionId) => {

    const phase = phases.find(p => p.id === phaseId);
    const question = phase.generatedQuestions.find(q => q.id === questionId);

    if (question.isEditingAnswer) {

      try {

        console.log("DEBUG: Updating answer:", questionId);

        await API.put(`/questions/${questionId}`, {
          correct_answer: question.answer
        });

        console.log("DEBUG: Answer updated in backend");

      } catch (err) {
        console.error("ERROR updating answer:", err);
      }
    }

    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          generatedQuestions: phase.generatedQuestions.map(q =>
            q.id === questionId
              ? { ...q, isEditingAnswer: !q.isEditingAnswer }
              : { ...q, isEditingAnswer: false }
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

  const deleteQuestion = async (phaseId, questionId) => {
    try {
      console.log("DEBUG: Deleting question:", questionId);

      await API.delete(`/questions/${questionId}`);

      let updatedPhases = phases.map(phase => {
        if (phase.id === phaseId) {
          return {
            ...phase,
            generatedQuestions: phase.generatedQuestions.filter(q => q.id !== questionId)
          };
        }
        return phase;
      });

      // Check if phase is empty -> delete phase automatically
      const phase = updatedPhases.find(p => p.id === phaseId);
      if (phase.generatedQuestions.length === 0) {
        try {
          await API.delete(`/phase/force/${phaseId}`); // delete phase in backend
          updatedPhases = updatedPhases.filter(p => p.id !== phaseId); // remove from frontend
          if (activePhase === phaseId && updatedPhases.length > 0) {
            setActivePhase(updatedPhases[0].id);
          } else if (updatedPhases.length === 0) {
            setActivePhase(null);
          }
          console.log("Phase automatically deleted as it has no questions");
        } catch (err) {
          console.error("Error auto-deleting empty phase:", err);
        }
      }

      setPhases(updatedPhases);
      console.log("Question deleted successfully (backend + frontend)");

    } catch (err) {
      console.error("ERROR deleting question:", err);
    }
  };



  const toggleQuestionEdit = async (phaseId, questionId) => {

    const phase = phases.find(p => p.id === phaseId);
    const question = phase.generatedQuestions.find(q => q.id === questionId);

    // if saving mode
    if (question.isEditing) {

      try {
        console.log("DEBUG: Updating question:", questionId);

        await API.put(`/questions/${questionId}`, {
          ques_text: question.text
        });

        console.log("DEBUG: Question updated in backend");

      } catch (err) {
        console.error("ERROR updating question:", err);
      }
    }

    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          generatedQuestions: phase.generatedQuestions.map(q =>
            q.id === questionId
              ? { ...q, isEditing: !q.isEditing }
              : { ...q, isEditing: false }
          )
        };
      }
      return phase;
    }));
  };


  // const addCustomQuestion = (phaseId) => {
  //   const phase = phases.find(p => p.id === phaseId);
  //   if (!phase) return;

  //   const customText = phase.additionalQuestions?.trim();
  //   if (!customText) return;

  //   const newQuestion = {
  //     id: Date.now(),
  //     text: customText,
  //     answer: newCustomAnswer || '',
  //     difficulty: phase.difficultyLevel,
  //     isEditing: false,
  //     isEditingAnswer: false,
  //     isCustom: true
  //   };

  //   setPhases(phases.map(p => {
  //     if (p.id === phaseId) {
  //       return {
  //         ...p,
  //         generatedQuestions: [...p.generatedQuestions, newQuestion],
  //         additionalQuestions: "" // Clear question input
  //       };
  //     }
  //     return p;
  //   }));

  //   setNewCustomAnswer(""); // Clear answer input after adding
  // };




  // Add a new empty Q&A row
  const addNewCustomQA = () => {
    setCustomQuestions([...customQuestions, { question: "", answer: "" }]);
  };

  // Update question or answer text for a specific index
  const updateCustomQA = (index, field, value) => {
    const updated = [...customQuestions];
    updated[index][field] = value;
    setCustomQuestions(updated);
  };

  // Add all custom Q&A to the phase
  const addAllCustomQuestions = async (phaseId) => {
    try {
      const phase = phases.find(p => p.id === phaseId);
      if (!phase) return;

      const validQuestions = customQuestions.filter(q => q.question.trim() !== "");

      if (validQuestions.length === 0) return;

      const createdQuestions = [];

      for (const q of validQuestions) {
        console.log("DEBUG: Creating question:", q);

        const res = await API.post("/questions", {
          phase_id: phaseId,
          ques_text: q.question,
          correct_answer: q.answer
        });

        createdQuestions.push({
          id: res.data.question.id,
          text: res.data.question.ques_text,
          answer: res.data.question.correct_answer,
          isEditing: false,
          isEditingAnswer: false,
          isCustom: true
        });
      }


      // **Update phase info in backend**
      const difficultyMap = {
        easy: 1,
        medium: 2,
        hard: 3,
        mixed: 4
      };

      const updatedPhaseData = {
        num_questions: phase.numberOfQuestions,
        time_limit: phase.interviewTime,
        severity: difficultyMap[phase.difficultyLevel || "easy"],
        end_date: phase.closeDate
      };

      await API.put(`/phase/${phaseId}`, updatedPhaseData);
      console.log("DEBUG: Phase updated in backend", updatedPhaseData);

      setPhases(prevPhases =>
        prevPhases.map(p => {
          if (p.id === phaseId) {
            return {
              ...p,
              generatedQuestions: [...p.generatedQuestions, ...createdQuestions]
            };
          }
          return p;
        })
      );


      setCustomQuestions([{ question: "", answer: "" }]);

      console.log("DEBUG: Questions saved to backend");

    } catch (err) {
      console.error("ERROR creating question:", err);
    }
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
    <div className="page-container prepare-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="card prepare-questions-card" style={{
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
        padding: '25px',
      }}>
        {/* Header with Job Info */}
        <div className="prepare-header">
          <div className="header-left">
            <div className="job-info-badge">
              <span className="job-id">
                Job #{String(job?.id).slice(-6) || '000000'}
              </span>
              <h1>{job?.title}</h1>
            </div>
            <p className="subtitle">Prepare and manage interview questions for each phase</p>
          </div>
          <button type="button" className="create-phase-btn" onClick={createPhase}>
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
                    placeholder="Type or edit the job description..."
                  />
                </div>
              </div>

              <div className="custom-qa-section">
                {customQuestions.map((qa, index) => (
                  <div key={index} className="custom-qa-row" style={{ marginBottom: '15px' }}>
                    <input
                      type="text"
                      className="input question-edit-input"
                      placeholder="Type your question..."
                      value={qa.question}
                      onChange={(e) => updateCustomQA(index, 'question', e.target.value)}
                      style={{ marginBottom: '8px', width: '100%' }}
                    />
                    <textarea
                      className="input answer-edit-input"
                      placeholder="Type expected answer..."
                      value={qa.answer}
                      onChange={(e) => updateCustomQA(index, 'answer', e.target.value)}
                      rows={2}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}

                <button
                  className="generate-btn"
                  onClick={addNewCustomQA}
                  style={{ marginRight: '10px', display: 'inline-flex', alignItems: 'center' }}
                >
                  <FiPlus size={18} style={{ marginRight: '6px' }} /> Add Question
                </button>

                <input
  type="file"
  accept=".xlsx,.xls"
  onChange={(e) => {
    const f = e.target.files?.[0];
    console.log("✅ selected file:", f);
    alert(f ? `✅ Selected: ${f.name}` : "❌ No file selected");
    setExcelFile(f || null);
  }}
style={{ marginTop: "10px", pointerEvents: "auto", zIndex: 9999, position: "relative" }}/>

                <button
  type="button"
  className="generate-btn"
  onClick={(e) => uploadExcelQuestions(e)}
style={{ marginTop: "10px", pointerEvents: "auto", zIndex: 9999, position: "relative" }}>
  Upload Questions From Excel
</button>


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
                  onClick={() => addAllCustomQuestions(currentPhase.id)}
                  disabled={customQuestions.every(q => q.question.trim() === "")} // <-- enable only if there's a question
                >
                  <FiPlus size={18} style={{ marginRight: '8px' }} />
                  Generate Quiz
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
                    <div
                      key={question.id}
                      className="question-card modern-card generated-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',       // Make it full width of parent container
                        maxWidth: '900px',   // Optional: prevent it from being too wide
                        padding: '20px',
                        marginBottom: '20px',
                        borderRadius: '10px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        background: '#fff'
                      }}
                    >
                      <div className="question-number-badge">{index + 1}</div>

                      <div className="question-content">
                        {/* Question Section */}
                        <div className="question-section">
                          {question.isEditing ? (
                            <input
                              type="text"
                              className="input question-input"
                              value={question.text}
                              onChange={(e) => editQuestion(currentPhase.id, question.id, e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && toggleQuestionEdit(currentPhase.id, question.id)}
                              autoFocus
                            />
                          ) : (
                            <p className="question-text">{question.text}</p>
                          )}
                          <div className="action-buttons">
                            <button
                              className="edit-btn"
                              onClick={() => toggleQuestionEdit(currentPhase.id, question.id)}
                              title={question.isEditing ? "Save Question" : "Edit Question"}
                            >
                              {question.isEditing ? <FiSave /> : <FiEdit2 />}
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => deleteQuestion(currentPhase.id, question.id)}
                              title="Delete Question"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>

                        {/* Answer Section */}
                        <div className="answer-section">
                          {question.isEditingAnswer ? (
                            <textarea
                              className="input answer-input"
                              rows="3"
                              value={question.answer || ''}
                              onChange={(e) => editAnswer(currentPhase.id, question.id, e.target.value)}
                            />
                          ) : (
                            <p className="answer-text">{question.answer || "No answer yet."}</p>
                          )}
                          <div className="action-buttons">
                            <button
                              className="edit-btn"
                              onClick={() => toggleAnswerEdit(currentPhase.id, question.id)}
                              title={question.isEditingAnswer ? "Save Answer" : "Edit Answer"}
                            >
                              {question.isEditingAnswer ? <FiSave /> : <FiEdit2 />}
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


