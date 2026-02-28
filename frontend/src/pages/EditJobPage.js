import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/CreateJobPage.css";
import { useToast } from "../contexts/ToastContext";

function EditJobPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [fields, setFields] = useState([]);
  const [jobDescription, setJobDescription] = useState("");

  useEffect(() => {
    if (!jobId) {
      console.error("No job ID provided for edit");
      navigate("/dashboard");
      return;
    }

    const fetchJobDetails = async () => {
      try {
        console.log("Fetching job details for ID:", jobId);
        const res = await fetch(`http://localhost:5000/api/job/details/${jobId}`);
        const data = await res.json();
        
        console.log("Job details response:", { status: res.status, data });
        
        if (res.ok) {
          console.log("Loading job data:", data);
          setJobTitle(data.title || "");
          setJobDescription(data.job_desc || "");
          setClosingDate(data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : "");
          
          if (data.fields && Array.isArray(data.fields)) {
            console.log("Loading fields:", data.fields);
            // Map backend field format to frontend format
            const mappedFields = data.fields.map(field => ({
              id: field.id,
              label: field.field_name,
              type: field.field_type,
              isRequired: field.is_required
            }));
            setFields(mappedFields);
          } else {
            console.log("No fields found, using defaults");
          }
        } else {
          console.error("Failed to fetch job details:", data.message);
          showError("Failed to load job details: " + (data.message || "Unknown error"));
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
        showError("Network error while loading job details");
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, navigate]);

  const addField = () => {
    const newField = {
      id: Date.now(),
      label: "New Field",
      type: "text",
      isRequired: false,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id, key, value) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      )
    );
  };

  const deleteField = (id) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const saveForm = async () => {
    console.log("Save form clicked!");
    console.log("Form data:", {
      jobTitle,
      jobDescription,
      closingDate,
      fields
    });
    
    try {
      const storedUser = JSON.parse(localStorage.getItem("hrUser"));
      console.log("Stored user:", storedUser);
      
      if (!storedUser) {
        showError("Please login first");
        return;
      }

      if (!jobTitle.trim()) {
        showError("Please enter a job title");
        return;
      }

      const jobData = {
        hr_id: storedUser.id,
        title: jobTitle,
        jobDescription,
        closingDate,
        fields,
      };

      console.log("Updating job:", jobId);
      const res = await fetch(`http://localhost:5000/api/job/update-job/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });
    
      console.log("Sending request to backend...");
      const data = await res.json();
      console.log("Response status:", res.status);
      console.log("Response data:", data);

      if (!res.ok) {
        showError(data.message || "Failed to update job");
        return;
      }

      console.log("Job updated successfully:", data);
      showSuccess("Job updated successfully!");
      
      navigate("/dashboard");

    } catch (err) {
      console.error("Job update error:", err);
      showError("Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <h2>Loading Job Details...</h2>
            <p style={{ color: '#718096' }}>Please wait while we fetch the job information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card">
        <h1>Edit Job</h1>
        <p style={{ color: '#718096', marginBottom: '24px' }}>
          Update job information and form fields.
        </p>

        {/* Layout for Title and Optional Date */}
        <div className="job-info-grid">
          <div className="date-input-group">
            <label>Job Title</label>
            <input
              className="job-title-input"
              placeholder="e.g. Senior Software Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          
          <div className="date-input-group">
            <label>Closing Date (Optional)</label>
            <input
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
            />
          </div>
        </div>

        <div className="job-description-section">
          <label>Job Description</label>
          <textarea
            className="job-description-textarea"
            placeholder="Describe the job responsibilities, requirements, qualifications, and what makes this position exciting..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
          />
        </div>

        <h3 style={{ borderTop: '1px solid #edf2f7', paddingTop: '20px' }}>Form Fields</h3>

        {fields.map((field) => (
          <div key={field.id} className="field-row">
            <input
              value={field.label}
              onChange={(e) => updateField(field.id, "label", e.target.value)}
              placeholder="Field name"
            />

            <select
              value={field.type}
              onChange={(e) => updateField(field.id, "type", e.target.value)}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="number">Number</option>
              <option value="file">File</option>
              <option value="textarea">Long Text</option>
            </select>

            <div className="required-checkbox-wrapper">
              <label className="required-label">
                <input
                  type="checkbox"
                  checked={field.isRequired}
                  onChange={(e) => updateField(field.id, "isRequired", e.target.checked)}
                />
                <span className="checkmark"></span>
                Required
              </label>
            </div>

            <button className="delete-btn" onClick={() => deleteField(field.id)}>
              Delete
            </button>
          </div>
        ))}

        <button className="secondary-btn" onClick={addField}>
          + Add New Field
        </button>

        <button className="primary-btn" onClick={saveForm}>
          Update Job
        </button>
      </div>
    </div>
  );
}

export default EditJobPage;
