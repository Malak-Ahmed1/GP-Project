import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-page">

      {/* ── NAVIGATION ── */}
      <nav className="landing-nav">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">C</span>
          ComfyHire
        </Link>
        <div className="nav-links">
          <a href="#home"      className="nav-link active">Home</a>
          <a href="#features"  className="nav-link">Features</a>
          <a href="#how"       className="nav-link">How it works</a>
          <Link to="/login"    className="nav-link">Login</Link>
          <Link to="/login"    className="btn-login">Log in</Link>
          <Link to="/signup"   className="btn-create">Get Started Free</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" id="home">
        {/*
          drawing2.svg — man looking at candidate list — sits as background
          Place your SVG files in: public/drawing1.svg, drawing2.svg, drawing3.svg, drawings4.svg
        */}
        <img src="/drawing2.svg" alt="" className="hero-bg-img" draggable={false} />
        <div className="hero-inner">
          <div className="hero-left">
            <div className="breadcrumb">AI-Powered &nbsp;|&nbsp; Hiring &nbsp;|&nbsp; Platform</div>
            <h1 className="hero-title">
              Hire Smarter,<br />
              Faster &amp; Fairer<br />
              with AI
            </h1>
            <p className="hero-subtitle">
              ComfyHire automates your entire hiring pipeline — from AI CV ranking
              to intelligent interview questions and live online AI interviews.
              Find the best talent in minutes, not weeks.
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="hero-btn primary">Start Hiring Free</Link>
              <Link to="/demo"   className="hero-btn secondary">Watch Demo &rarr;</Link>
            </div>
            <div className="slider-dots">
              <span className="slider-dot active"></span>
              <span className="slider-dot"></span>
              <span className="slider-dot"></span>
              <span className="slider-dot"></span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="trust-bar">
        <span>Trusted by 500+ companies</span>
        <div className="trust-logos">
          <span className="trust-logo">Acme Corp</span>
          <span className="trust-logo">TechFlow</span>
          <span className="trust-logo">HireBase</span>
          <span className="trust-logo">Nexora</span>
          <span className="trust-logo">PeopleCo</span>
        </div>
      </div>

      {/* ── WHAT WE OFFER ── */}
      <section className="section-what" id="features">
        <div className="section-inner">
          <p className="section-eyebrow">What ComfyHire offers</p>
          <h2 className="section-title">Everything you need to hire the best</h2>
          <p className="section-sub">
            Three powerful AI tools, one seamless hiring platform.
          </p>

          <div className="features-grid">

            {/* Feature 1 — CV Ranking */}
            <div className="feature-card">
              <div className="feature-img-wrap">
                <img src="/drawing1.svg" alt="AI CV Ranking" className="feature-img" />
              </div>
              <div className="feature-card-body">
                <div className="feature-badge">CV Ranking</div>
                <h3 className="feature-card-title">AI-Powered CV Ranking</h3>
                <p className="feature-card-desc">
                  Upload hundreds of CVs and let our AI instantly rank candidates
                  by skill match, experience, and role fit — removing bias and
                  saving your team hours of manual screening.
                </p>
                <ul className="feature-list">
                  <li>Ranks CVs in seconds</li>
                  <li>Bias-free scoring engine</li>
                  <li>Custom weighting per role</li>
                  <li>Export shortlist as PDF or CSV</li>
                </ul>
                <Link to="/features/cv-ranking" className="feature-link">Learn more &rarr;</Link>
              </div>
            </div>

            {/* Feature 2 — Interview Questions */}
            <div className="feature-card feature-card--reverse">
              <div className="feature-img-wrap">
                <img src="/drawing4.svg" alt="Interview Question Maker" className="feature-img" />
              </div>
              <div className="feature-card-body">
                <div className="feature-badge feature-badge--green">Interview Prep</div>
                <h3 className="feature-card-title">AI Interview Question Maker</h3>
                <p className="feature-card-desc">
                  Generate tailored, role-specific interview questions in seconds.
                  Our AI reads the job description and candidate CV, then produces
                  a structured question set — behavioural, technical, and situational.
                </p>
                <ul className="feature-list">
                  <li>Questions matched to the CV &amp; JD</li>
                  <li>Behavioural, technical &amp; cultural fit</li>
                  <li>Editable question bank</li>
                  <li>Scoring rubric included</li>
                </ul>
                <Link to="/features/interview-questions" className="feature-link">Learn more &rarr;</Link>
              </div>
            </div>

            {/* Feature 3 — Online AI Interview */}
            <div className="feature-card">
              <div className="feature-img-wrap">
                <img src="/drawing3.svg" alt="Online AI Interview" className="feature-img" />
              </div>
              <div className="feature-card-body">
                <div className="feature-badge feature-badge--purple">AI Interview</div>
                <h3 className="feature-card-title">Online AI Interview</h3>
                <p className="feature-card-desc">
                  Conduct fully automated video interviews 24/7. Candidates answer
                  AI-generated questions on camera; our engine analyses responses,
                  tone, and confidence to produce a detailed interview report.
                </p>
                <ul className="feature-list">
                  <li>Video interview on any device</li>
                  <li>Real-time answer analysis</li>
                  <li>Confidence &amp; clarity scoring</li>
                  <li>Full report for hiring managers</li>
                </ul>
                <Link to="/features/ai-interview" className="feature-link">Learn more &rarr;</Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section-how" id="how">
        <div className="section-inner">
          <p className="section-eyebrow">How it works</p>
          <h2 className="section-title">From job post to hired in 4 steps</h2>

          <div className="steps-row">
            <div className="step-card">
              <div className="step-number">01</div>
              <h4 className="step-title">Post your role</h4>
              <p className="step-desc">Add the job description and required skills. ComfyHire sets up the pipeline automatically.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h4 className="step-title">AI ranks CVs</h4>
              <p className="step-desc">Candidates apply and our AI instantly scores and ranks every CV against your criteria.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h4 className="step-title">AI conducts interview</h4>
              <p className="step-desc">Top candidates are invited to a structured AI video interview — no scheduling headaches.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">04</div>
              <h4 className="step-title">Review &amp; hire</h4>
              <p className="step-desc">Get a ranked shortlist with full interview reports. Make confident, data-backed decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="section-stats">
        <div className="stats-inner">
          <div className="stat-item">
            <span className="stat-number">10×</span>
            <span className="stat-label">Faster screening</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">85%</span>
            <span className="stat-label">Reduction in time-to-hire</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">Companies onboarded</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">98%</span>
            <span className="stat-label">Hiring manager satisfaction</span>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section-testimonials">
        <div className="section-inner">
          <p className="section-eyebrow">What our customers say</p>
          <h2 className="section-title">Loved by hiring teams worldwide</h2>
          <div className="testimonials-row">
            <div className="testimonial-card">
              <p className="testimonial-text">"ComfyHire cut our screening time from 3 weeks to 2 days. The CV ranking is scary accurate — it consistently surfaces candidates we'd have missed."</p>
              <div className="testimonial-author">
                <div className="author-avatar">S</div>
                <div>
                  <div className="author-name">Sarah Mitchell</div>
                  <div className="author-role">Head of Talent, TechFlow</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">"The AI interview feature is a game-changer for us. Candidates can interview at midnight if they want. Our offer acceptance rate jumped 40%."</p>
              <div className="testimonial-author">
                <div className="author-avatar">J</div>
                <div>
                  <div className="author-name">James Okafor</div>
                  <div className="author-role">CEO, Nexora</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">"The question generator alone saves each interviewer 45 minutes per candidate. Multiply that by 200 hires a year and it's transformative."</p>
              <div className="testimonial-author">
                <div className="author-avatar">L</div>
                <div>
                  <div className="author-name">Lena Brandt</div>
                  <div className="author-role">HR Director, Acme Corp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="section-cta">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to transform your hiring?</h2>
          <p className="cta-sub">Join 500+ companies already hiring smarter with ComfyHire. Free for your first 10 hires.</p>
          <div className="cta-buttons">
            <Link to="/signup" className="hero-btn primary cta-btn">Start for free</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="nav-logo">
              <span className="logo-icon">C</span>
              ComfyHire
            </Link>
            <p className="footer-tagline">AI hiring, made human.</p>
          </div>
          <div className="footer-links-group">
            <span className="footer-group-label">Product</span>
            <a href="#features">CV Ranking</a>
            <a href="#features">Interview Questions</a>
            <a href="#features">AI Interview</a>
          </div>
          <div className="footer-links-group">
            <span className="footer-group-label">Company</span>
            <a href="#about">About</a>
            <a href="#careers">Careers</a>
            <a href="#blog">Blog</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-links-group">
            <span className="footer-group-label">Legal</span>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#gdpr">GDPR</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ComfyHire. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;