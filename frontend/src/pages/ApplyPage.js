import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import CandidateForm from "../components/CandidateForm";
import "../styles/ApplyPage.css";

function ApplyPage() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const fetchJobDetails = async () => {
      try {
        console.log("Fetching job details for apply page:", jobId);
        const res = await fetch(`http://localhost:5000/api/job/details/${jobId}`);
        const data = await res.json();
        
        console.log("Apply page job details response:", { status: res.status, data });
        
        if (res.ok) {
          console.log("Loading job for apply:", data);
          setJob(data);
          
          if (data.fields && Array.isArray(data.fields)) {
            console.log("Loading fields for apply:", data.fields);
            // Map backend field format to frontend format
            const mappedFields = data.fields.map(field => ({
              id: field.id,
              label: field.field_name,
              type: field.field_type,
              isRequired: field.is_required
            }));
            setFields(mappedFields);
          } else {
            console.log("No fields found for apply");
          }
        } else {
          console.error("Failed to fetch job details for apply:", data.message);
        }
      } catch (err) {
        console.error("Error fetching job details for apply:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  if (loading) return (
    <div className="apply-page">
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    </div>
  );

  if (!job) return (
    <div className="apply-page">
      <div className="card">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h2>Job Not Found</h2>
          <p style={{ color: '#718096', marginTop: '8px' }}>The job you're looking for doesn't exist or has been closed.</p>
        </div>
      </div>
    </div>
  );

  // Check if job is available
  if (job.status === "closed") return ( 
    <div className="apply-page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Sorry, This Position is No Longer Available</h2>
            <p style={{ color: '#718096', marginTop: '8px' }}>This job has been closed and is no longer accepting applications.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="apply-page">
      <div className="apply-card">
        <div className="apply-header">
         
          <h1>{job.title}</h1>
          <p>{job.job_desc}</p>
        </div>

        <div className="candidate-form-wrapper">
          <CandidateForm 
            jobId={jobId}
            fields={fields}
          />
        </div>

       <footer className="apply-footer">
  <p>
    By submitting, you agree to our 
    <a href="/terms"> Terms of Service </a> 
    and 
    <a href="/privacy"> Privacy Policy</a>.
  </p>
</footer>
      </div>
    </div>
  );
}

export default ApplyPage;
