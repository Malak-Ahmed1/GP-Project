import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import "../styles/CreateJobPage.css";

function CreateJobPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [jobTitle, setJobTitle] = useState("");
  const [closingDate, setClosingDate] = useState(""); // New: Optional closing date
  const [fields, setFields] = useState([
    { id: 1, label: "Full Name", type: "text", isRequired: true },
    { id: 2, label: "Email", type: "email", isRequired: true },
    { id: 3, label: "Upload CV", type: "file", isRequired: false },
  ]);
  const [jobDescription, setJobDescription] = useState("");

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

      console.log("Creating new job...");
      const res = await fetch("http://localhost:5000/api/job/add-job", {
        method: "POST",
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
        showError(data.message || "Failed to create job");
        return;
      }

      console.log("Job created successfully:", data);
      showSuccess("Job created successfully!");      
      navigate("/dashboard");

    } catch (err) {
      console.error("Job creation error:", err);
      showError("Network error. Please try again.");
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <h1>Create Application Form</h1>
        <p style={{ color: '#718096', marginBottom: '24px' }}>
          Define information and deadline for your candidates.
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
              style={{ marginBottom: 0 }} // Override previous margin
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
          Save and Publish Form
        </button>
      </div>
    </div>
  );
}

export default CreateJobPage;