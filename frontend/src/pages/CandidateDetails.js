import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, User, Mail, Phone, MapPin, Briefcase, Award, Calendar, TrendingUp, Target, FileText, Download } from 'lucide-react';

function CandidateDetails() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [candidate, setCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Determine back navigation based on where user came from
  const getBackPath = () => {
    // Check if coming from JobInterviewDetails
    if (location.state?.from === 'job-interview-details') {
      return location.state.jobId ? `/interview-details/${location.state.jobId}` : '/interviews';
    }
    // Check if coming from RankingPage
    if (location.state?.from === 'ranking-page') {
      return location.state.jobId ? `/ranking/${location.state.jobId}` : '/interviews';
    }
    // Default to candidates list
    return '/candidates';
  };

  const handleBack = () => {
    navigate(getBackPath());
  };

  useEffect(() => {
    // Fetch candidate details and applications
    setTimeout(() => {
      // Mock candidate data from form
      const mockCandidate = {
        id: candidateId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, New York, NY 10001',
        bio: 'Experienced frontend developer with 5+ years in React, TypeScript, and modern web technologies.',
        experience: '5 years',
        education: 'Bachelor of Science in Computer Science',
        skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Node.js', 'Git'],
        portfolio: 'https://johndoe-portfolio.com',
        linkedin: 'https://linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe',
        resume: '/resumes/john-doe-resume.pdf',
        dateApplied: '2026-02-01',
        status: 'active'
      };

      // Mock job applications data
      const mockApplications = [
        {
          id: 1,
          jobId: 'JOB001',
          jobTitle: 'Frontend Developer',
          company: 'TechCorp Inc.',
          status: 'completed',
          dateApplied: '2026-02-01',
          phases: [
            {
              id: 1,
              name: 'Phase 1: Technical Screening',
              status: 'completed',
              score: 92,
              maxScore: 100,
              timeSpent: '45 min',
              timeLimit: '60 minutes',
              submittedAt: '2026-02-10 14:30',
              rank: 1,
              totalCandidates: 15
            },
            {
              id: 2,
              name: 'Phase 2: Coding Challenge',
              status: 'completed',
              score: 88,
              maxScore: 100,
              timeSpent: '75 min',
              timeLimit: '90 minutes',
              submittedAt: '2026-02-12 16:45',
              rank: 3,
              totalCandidates: 12
            },
            {
              id: 3,
              name: 'Phase 3: Final Interview',
              status: 'in_progress',
              score: 0,
              maxScore: 100,
              timeSpent: '0 min',
              timeLimit: '120 minutes',
              rank: null,
              totalCandidates: 8
            }
          ],
          overallScore: 90,
          overallRank: 2
        },
        {
          id: 2,
          jobId: 'JOB002',
          jobTitle: 'Senior React Developer',
          company: 'StartupXYZ',
          status: 'rejected',
          dateApplied: '2026-01-15',
          phases: [
            {
              id: 1,
              name: 'Phase 1: Technical Screening',
              status: 'completed',
              score: 78,
              maxScore: 100,
              timeSpent: '52 min',
              timeLimit: '60 minutes',
              submittedAt: '2026-01-20 10:15',
              rank: 8,
              totalCandidates: 20
            }
          ],
          overallScore: 78,
          overallRank: 8
        },
        {
          id: 3,
          jobId: 'JOB003',
          jobTitle: 'Full Stack Developer',
          company: 'Digital Agency Co.',
          status: 'pending',
          dateApplied: '2026-02-05',
          phases: [],
          overallScore: 0,
          overallRank: null
        }
      ];

      setCandidate(mockCandidate);
      setApplications(mockApplications);
      setLoading(false);
    }, 500);
  }, [candidateId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: '900px', textAlign: 'center', padding: '60px' }}>
          <p>Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: '900px', textAlign: 'center', padding: '60px' }}>
          <h2>Candidate Not Found</h2>
          <p>The candidate you're looking for doesn't exist.</p>
          <button 
            className="primary-btn"
            onClick={handleBack}
          >
            Back to Candidates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: '1000px' }}>
        {/* Header */}
        <div className="candidate-header">
          <button 
            className="back-btn"
            onClick={handleBack}
          >
            <ChevronLeft size={20} />
            Back to Candidates
          </button>
          <h1>{candidate.name}</h1>
          <span className={`status-badge ${candidate.status}`}>
            {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
          </span>
        </div>

        {/* Single Tab Content */}
        <div className="tab-content">
          {/* Contact Information */}
          <div className="content-section">
            <h3><Mail size={18} /> Contact Information</h3>
            <div className="contact-list">
              <div className="contact-item">
                <Mail size={16} />
                <span>{candidate.email}</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>{candidate.phone}</span>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>{candidate.address}</span>
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="content-section">
            <h3><Briefcase size={18} /> Professional Summary</h3>
            <p>{candidate.bio}</p>
            <div className="info-grid">
              <div className="info-item">
                <label>Experience:</label>
                <span>{candidate.experience}</span>
              </div>
              <div className="info-item">
                <label>Education:</label>
                <span>{candidate.education}</span>
              </div>
              <div className="info-item">
                <label>Date Applied:</label>
                <span>{candidate.dateApplied}</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="content-section">
            <h3><Award size={18} /> Skills</h3>
            <div className="skills-container">
              {candidate.skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Profile Links */}
          <div className="content-section">
            <h3>Quick Links</h3>
            <div className="links-grid">
              {candidate.portfolio && (
                <a href={candidate.portfolio} target="_blank" rel="noopener noreferrer" className="link-btn">
                  Portfolio
                </a>
              )}
              {candidate.linkedin && (
                <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" className="link-btn">
                  LinkedIn
                </a>
              )}
              {candidate.github && (
                <a href={candidate.github} target="_blank" rel="noopener noreferrer" className="link-btn">
                  GitHub
                </a>
              )}
            </div>
          </div>

          {/* CV/Resume Section */}
          <div className="content-section">
            <h3><FileText size={18} /> Curriculum Vitae</h3>
            <div className="cv-simple">
              <p>Download the candidate's CV/Resume in PDF format</p>
              <button className="download-btn">
                <Download size={16} />
                Download CV/Resume
              </button>
            </div>
          </div>

          {/* Applications */}
          <div className="content-section">
            <h3><Briefcase size={18} /> Job Applications</h3>
            {applications.length === 0 ? (
              <div className="empty-state">
                <Briefcase size={48} />
                <h3>No Applications Found</h3>
                <p>This candidate hasn't applied to any jobs yet.</p>
              </div>
            ) : (
              <div className="applications-list">
                {applications.map((application) => (
                  <div key={application.id} className="application-card">
                    <div className="application-header">
                      <div className="job-info">
                        <h4>{application.jobTitle}</h4>
                        <p className="company">{application.company}</p>
                        <p className="job-id">Job ID: {application.jobId}</p>
                      </div>
                      <div className="application-status">
                        <span className={`status-badge ${application.status}`}>
                          {application.status.replace('_', ' ').charAt(0).toUpperCase() + 
                           application.status.replace('_', ' ').slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="application-details">
                      <div className="detail-row">
                        <Calendar size={14} />
                        <label>Applied:</label>
                        <span>{application.dateApplied}</span>
                      </div>
                      
                      {application.overallScore > 0 && (
                        <div className="detail-row">
                          <TrendingUp size={14} />
                          <label>Overall Score:</label>
                          <span className="score-display">{application.overallScore}%</span>
                        </div>
                      )}
                      
                      {application.overallRank && (
                        <div className="detail-row">
                          <Target size={14} />
                          <label>Overall Rank:</label>
                          <span className="rank-display">
                            #{application.overallRank} of {application.phases[0]?.totalCandidates || 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Phase Performance */}
                    {application.phases.length > 0 && (
                      <div className="phases-section">
                        <h5>Phase Performance</h5>
                        <div className="phases-list">
                          {application.phases.map((phase) => (
                            <div key={phase.id} className="phase-item">
                              <div className="phase-header">
                                <span className="phase-name">{phase.name}</span>
                                <span className={`phase-status ${phase.status}`}>
                                  {phase.status.replace('_', ' ').charAt(0).toUpperCase() + 
                                   phase.status.replace('_', ' ').slice(1)}
                                </span>
                              </div>
                              
                              <div className="phase-details">
                                {phase.score > 0 && (
                                  <>
                                    <div className="phase-metric">
                                      <label>Score:</label>
                                      <span className="score-value">{phase.score}%</span>
                                    </div>
                                    <div className="phase-metric">
                                      <label>Rank:</label>
                                      <span className="rank-value">
                                        #{phase.rank} of {phase.totalCandidates}
                                      </span>
                                    </div>
                                  </>
                                )}
                                
                                <div className="phase-metric">
                                  <label>Time:</label>
                                  <span>{phase.timeSpent} / {phase.timeLimit}</span>
                                </div>
                                
                                {phase.submittedAt && (
                                  <div className="phase-metric">
                                    <label>Submitted:</label>
                                    <span>{phase.submittedAt}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateDetails;
