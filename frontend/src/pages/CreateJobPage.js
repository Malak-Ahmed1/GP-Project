import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateJobPage() {
  const navigate = useNavigate();

  const [jobTitle, setJobTitle] = useState("");
  const [closingDate, setClosingDate] = useState(""); // New: Optional closing date
  const [fields, setFields] = useState([
    { id: 1, label: "Full Name", type: "text" },
    { id: 2, label: "Email", type: "email" },
    { id: 3, label: "Upload CV", type: "file" },
  ]);

  const addField = () => {
    const newField = {
      id: Date.now(),
      label: "New Field",
      type: "text",
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

  const saveForm = () => {
    // Logging the new closingDate alongside the form data
    console.log("Saved Form:", { jobTitle, closingDate, fields });
    navigate("/dashboard");
  };

  return (
    <div className="page-container">
      <div className="card">
        <h1>Create Application Form</h1>
        <p style={{ color: '#718096', marginBottom: '24px' }}>
          Define the information and deadline for your candidates.
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

        <h3 style={{ borderTop: '1px solid #edf2f7', paddingTop: '20px' }}>Form Fields</h3>

        {fields.map((field) => (
          <div key={field.id} className="field-row">
            <input
              value={field.label}
              onChange={(e) => updateField(field.id, "label", e.target.value)}
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