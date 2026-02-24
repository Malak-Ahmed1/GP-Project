-- updated version of init.sql with additional fields and tables for enhanced functionality
-- =========================================
-- HR TABLE
-- =========================================
CREATE TABLE hr (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company_email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    company_name VARCHAR(255),
    position VARCHAR(255),
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
-- JOB APPLICATION TABLE
-- =========================================
CREATE TABLE job_application (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES job(id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES candidate(id) ON DELETE CASCADE,
    score_cv NUMERIC(5,2),
    cgpa NUMERIC(4,2) DEFAULT 0,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    passed BOOLEAN DEFAULT FALSE,

    UNIQUE(job_id, candidate_id)
);

-- =========================================
-- PHASE TABLE
-- =========================================
CREATE TABLE phase (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES job(id) ON DELETE CASCADE,
    phase_order INTEGER NOT NULL,
    ranked BOOLEAN DEFAULT FALSE,
    method VARCHAR(50),
    time_limit INTEGER,
    available BOOLEAN DEFAULT TRUE,
    num_questions INTEGER,
    severity INTEGER,
    quiz_sent BOOLEAN DEFAULT FALSE,  -- <-- default is FALSE

    end_date DATE,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, phase_order)
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




ALTER TABLE job
ADD COLUMN company VARCHAR(255);

ALTER TABLE job_application
ADD COLUMN passed BOOLEAN DEFAULT FALSE;
