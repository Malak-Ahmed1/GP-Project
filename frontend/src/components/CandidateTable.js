import { useNavigate, useLocation } from 'react-router-dom';

function CandidateTable({ candidates, showScore }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CandidateTable;