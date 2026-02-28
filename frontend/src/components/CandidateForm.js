import { useState, useEffect } from "react";
import { useToast } from "../contexts/ToastContext";

function CandidateForm({ jobId, fields }) {
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    const initial = {};
    fields.forEach((field) => { initial[field.id] = ""; });
    setForm(initial);
  }, [fields]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFile(files[0]);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const answers = [];
      let name = "", email = "", phone_number = "";
      let cv_link = file ? file.name : null;

      fields.forEach((field) => {
        const val = form[field.id] || "";
        const label = field.label.toLowerCase();
        if (label.includes("name") && !name) name = val;
        else if (label.includes("email") && !email) email = val;
        else if (label.includes("phone") && !phone_number) phone_number = val;
        else if (field.type !== "file") answers.push({ job_field_id: field.id, value: val });
      });

      const res = await fetch(`http://localhost:5000/api/candidate/apply/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone_number, cv_link, answers }),
      });

      if (!res.ok) throw new Error("Submission failed");
      showSuccess("Application submitted successfully!");
      setIsSuccess(true);
    } catch (error) {
      showError(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="success-state">
        <div className="success-badge">✓</div>
        <h2>Application Received</h2>
        <p>We’ve received your profile for this role. Our team will contact you if there is a match.</p>
        
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="modern-form">
      <div className="form-grid">
        {fields.filter(field => field.type !== "file").map((field) => (
          <div key={field.id} className={`field-container ${field.type === "textarea" ? "span-2" : ""}`}>
            <label className="field-label">
              {field.label} {field.isRequired && <span>*</span>}
            </label>

            {field.type === "textarea" ? (
              <textarea name={field.id} onChange={handleChange} required={field.isRequired} placeholder={`Your ${field.label.toLowerCase()}...`} rows={4} />
            ) : (
              <input type={field.type} name={field.id} onChange={handleChange} required={field.isRequired} placeholder={`Enter ${field.label.toLowerCase()}`} />
            )}
          </div>
        ))}
      </div>
      
      {/* File upload field always at the bottom */}
      {fields.filter(field => field.type === "file").map((field) => (
        <div key={field.id} className="field-container span-2">
          <label className="field-label">
            {field.label} {field.isRequired && <span>*</span>}
          </label>
          <div className="upload-zone">
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleChange} required={field.isRequired} />
            <div className="upload-content">
              <p>{file ? `Selected: ${file.name}` : "Click to upload Resume (PDF/DOCX)"}</p>
            </div>
          </div>
        </div>
      ))}
      
      <button type="submit" disabled={isSubmitting} className="primary-submit">
        {isSubmitting ? "Processing..." : "Submit Application"}
      </button>
    </form>
  );
}

export default CandidateForm;