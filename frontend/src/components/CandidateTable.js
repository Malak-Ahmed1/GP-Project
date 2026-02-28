import { useNavigate, useLocation } from 'react-router-dom';

function CandidateTable({ candidates, showScore, onViewDetails }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCandidateClick = (candidateId) => {
    navigate(`/candidate/${candidateId}`, { 
      state: { 
        from: 'ranking-page',
        jobId: location.pathname.split('/')[2] // Extract jobId from URL
      } 
    });
  };

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>{showScore ? "Rank" : "#"}</th>
            <th>Name</th>
            <th>Email</th>
            {showScore ? <th>Match Score</th> : <th>Applied At</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, index) => (
            <tr 
              key={c.id}
              onClick={() => handleCandidateClick(c.id)}
              style={{ cursor: 'pointer' }}
              className="candidate-row"
            >
              <td style={{ fontWeight: 'bold', color: '#4e73df' }}>{index + 1}</td>
              <td style={{ fontWeight: '600' }}>{c.name}</td>
              <td>{c.email}</td>
              <td>
                {showScore ? (
                  <span className="score-badge high">
                    {(c.score || 0).toFixed(1)}%
                  </span>
                ) : (
                  <span style={{ color: '#718096', fontSize: '13px' }}>
                    {c.appliedAt}
                  </span>
                )}
              </td>
              <td>
                <button 
                  className="btn-view-details"
                  onClick={() => onViewDetails && onViewDetails(c)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#4299e1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#3182ce'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#4299e1'}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CandidateTable;