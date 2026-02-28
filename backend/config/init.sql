-- HR TABLE
-- =========================================
CREATE TABLE hr (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company_email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone_number VARCHAR(20),
    company_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE hr_google_tokens (
  id SERIAL PRIMARY KEY,
  hr_id INTEGER REFERENCES hr(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  refresh_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- JOB TABLE
-- =========================================
CREATE TABLE job (
    id SERIAL PRIMARY KEY,
    hr_id INTEGER NOT NULL REFERENCES hr(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    job_desc TEXT,
    available BOOLEAN DEFAULT TRUE,
    end_date DATE,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- CANDIDATE TABLE
-- =========================================
CREATE TABLE candidate (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    cv_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- JOB CUSTOM FIELD TABLE
-- =========================================
CREATE TABLE job_field (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES job(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, 
    -- examples: text, number, date, boolean, file, url
    is_required BOOLEAN DEFAULT TRUE
);

-- =========================================
-- JOB APPLICATION TABLE
-- =========================================
CREATE TABLE job_application (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES job(id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES candidate(id) ON DELETE CASCADE,
    score_cv NUMERIC(5,2),
    total_score NUMERIC(4,2) DEFAULT 0,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, candidate_id)
);
-- =========================================
-- JOB APPLICATION FIELD ANSWERS
-- =========================================
CREATE TABLE job_application_field_answer (
    id SERIAL PRIMARY KEY,
    job_application_id INTEGER NOT NULL 
        REFERENCES job_application(id) ON DELETE CASCADE,
    job_field_id INTEGER NOT NULL 
        REFERENCES job_field(id) ON DELETE CASCADE,
    value TEXT, -- store all answers as text
    UNIQUE(job_application_id, job_field_id)
);


-- =========================================
-- PHASE CANDIDATES
-- =========================================
CREATE TABLE phase_candidates (
    id SERIAL PRIMARY KEY,
    phase_id INTEGER NOT NULL REFERENCES phase(id) ON DELETE CASCADE,
    job_application_id INTEGER NOT NULL REFERENCES job_application(id) ON DELETE CASCADE,
    phase_score NUMERIC(5,2),
    passed BOOLEAN DEFAULT FALSE,
    cheating_flag BOOLEAN DEFAULT FALSE,
    video_url TEXT,
    time_enter TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date DATE DEFAULT CURRENT_DATE
);

-- =========================================
-- QUESTIONS ITEMS
-- =========================================
CREATE TABLE questions_items (
    id SERIAL PRIMARY KEY,
    phase_id INTEGER NOT NULL REFERENCES phase(id) ON DELETE CASCADE,
    ques_text TEXT NOT NULL,
    correct_answer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CANDIDATE ANSWER DETAILS
-- =========================================
CREATE TABLE candidate_answer_details (
    id SERIAL PRIMARY KEY,
    phase_candidate_id INTEGER NOT NULL REFERENCES phase_candidates(id) ON DELETE CASCADE,
    question_item_id INTEGER NOT NULL REFERENCES questions_items(id) ON DELETE CASCADE,
    raw_answer TEXT,
    polished_answer TEXT,
    score NUMERIC(5,2),
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
