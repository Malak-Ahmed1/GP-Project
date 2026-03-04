import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, Play, ArrowLeft } from 'lucide-react';

function StartInterviewPage() {
  const { jobId, phaseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);


const handleStartInterview = async () => {
  const params = new URLSearchParams(window.location.search);
  const pcId = params.get("pcId");

  if (!pcId) {
    alert("Invalid link: pcId missing. Please use the email link.");
    return;
  }

  try {
    // 1) Start screen share ONCE here

    // 2) Go to interview page
    window.location.href = `/interview/?jobId=${jobId}&phaseId=${phaseId}&pcId=${pcId}&q=0`;
  } catch (e) {
    console.error(e);
  }
};

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          

          <h1 style={{ margin: '0 0 40px 0', fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
            Technical Interview
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', marginBottom: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <Clock size={32} color="#4e73df" style={{ marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
                Time Limit
              </h3>
              <p style={{ margin: '0', fontSize: '24px', fontWeight: '700', color: '#4e73df' }}>
                45 minutes
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <AlertTriangle size={32} color="#f59e0b" style={{ marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
                Questions
              </h3>
              <p style={{ margin: '0', fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                15 questions
              </p>
            </div>
          </div>

          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '12px', 
            padding: '20px', 
            marginBottom: '40px',
            textAlign: 'left'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
              Important Notice
            </h4>
            <ul style={{ margin: '0', paddingLeft: '20px', color: '#7f1d1d', lineHeight: '1.6' }}>
              <li>Keep your camera enabled throughout the interview</li>
              <li>Screen monitoring is enabled for academic integrity</li>
              <li>Opening new tabs will be flagged</li>
              <li>No external resources or assistance allowed</li>
            </ul>
          </div>

          <button 
            className="primary-btn"
            onClick={handleStartInterview}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            <Play size={20} />
            Start Interview
          </button>

          <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: '#718096' }}>
            By starting, you agree to comply with all interview requirements
          </p>
        </div>
      </div>
    </div>
  );
}

export default StartInterviewPage;