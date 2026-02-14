import { useParams } from "react-router-dom";
import CandidateForm from "../components/CandidateForm";

function ApplyPage() {
  const { jobId } = useParams();

  return (
    <div className="page-container">
      <div className="card apply-card">
        <div className="apply-header">
          {/* A small visual icon or logo placeholder */}
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: '#4e73df', 
            borderRadius: '16px', 
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {jobId?.charAt(0).toUpperCase() || 'J'}
          </div>
          <h1>Join Our Team</h1>
          <p>Please fill out the form below to apply for this position.</p>
        </div>

        <div className="candidate-form-wrapper">
          <CandidateForm jobId={jobId} />
        </div>
        
        <footer style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#a0aec0' }}>
          By submitting, you agree to our Terms of Service and Privacy Policy.
        </footer>
      </div>
    </div>
  );
}

export default ApplyPage;