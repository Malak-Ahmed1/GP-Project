import { useState } from "react";

function CandidateForm({ jobId }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", experience: "" });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 40px' }}>
        <div style={{ fontSize: '60px', marginBottom: '24px' }}>✅</div>
        <h2 style={{ marginBottom: '12px' }}>Application Sent!</h2>
        <p style={{ color: '#718096', marginBottom: '30px' }}>
          Good luck! The hiring team will review your CV shortly.
        </p>
        <button className="secondary-btn" onClick={() => setIsSuccess(false)}>
          Apply for another role
        </button>
      </div>
    );
  }

  return (
    // ... inside your return statement
<form onSubmit={handleSubmit} className="candidate-form">
  {/* Name & Email Group */}
  <div className="form-group">
    <label>Full Name</label>
    <input 
      name="name" 
      className="input" /* MUST HAVE THIS */
      placeholder="John Doe" 
      onChange={handleChange} 
      required 
    />
  </div>

  <div className="form-group">
    <label>Email Address</label>
    <input 
      name="email" 
      type="email" 
      className="input" 
      placeholder="john@example.com" 
      onChange={handleChange} 
      required 
    />
  </div>

  {/* Phone & Experience Group */}
  <div className="form-group">
    <label>Phone Number</label>
    <input 
      name="phone" 
      className="input" 
      placeholder="+1 (555) 000-0000" 
      onChange={handleChange} 
      required 
    />
  </div>

  <div className="form-group">
    <label>Years of Experience</label>
    <input 
      name="experience" 
      type="number" 
      className="input" 
      placeholder="e.g. 5" 
      onChange={handleChange} 
      required 
    />
  </div>

  {/* CV Upload */}
  <div className="form-group full-width">
      {/* Row 3 - Full Width */}
      <div className="form-group full-width">
        <label>Upload Resume / CV</label>
        <div className={`file-dropzone ${file ? 'has-file' : ''}`}>
          {file ? (
            <div className="file-name-preview">
              <span>📄</span> {file.name} 
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); setFile(null); }} 
                style={{background:'none', border:'none', color:'#e53e3e', cursor:'pointer', marginLeft:'10px', fontSize: '16px'}}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <p style={{ margin: 0, color: '#4e73df', fontWeight: '600' }}>Drop your CV here</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#718096' }}>PDF, DOCX up to 5MB</p>
            </>
          )}
          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files[0])} required />
        </div>
      </div>
  </div>

  <div className="full-width">
    <button type="submit" className="primary-btn">
      Submit Application
    </button>
  </div>
</form>
  );
}

export default CandidateForm;