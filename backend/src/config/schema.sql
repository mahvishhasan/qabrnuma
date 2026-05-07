-- QabrNuma Database Schema
-- PostgreSQL / Neon Serverless

-- Drop tables if exist (in reverse order of dependencies)
DROP TABLE IF EXISTS case_status_history CASCADE;
DROP TABLE IF EXISTS funeral_services CASCADE;
DROP TABLE IF EXISTS family_plot_members CASCADE;
DROP TABLE IF EXISTS family_plot_groups CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS burial_records CASCADE;
DROP TABLE IF EXISTS death_cases CASCADE;
DROP TABLE IF EXISTS graves CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS cemeteries CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    cnic VARCHAR(15),
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'admin', 'staff', 'cemetery_manager', 'funeral_coordinator')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Cemeteries table
CREATE TABLE cemeteries (
    cemetery_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    total_capacity INT DEFAULT 0,
    available_plots INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
    type VARCHAR(50) CHECK (type IN ('premium', 'heritage', 'standard')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cemeteries_city ON cemeteries(city);
CREATE INDEX idx_cemeteries_status ON cemeteries(status);

-- Sections table
CREATE TABLE sections (
    section_id SERIAL PRIMARY KEY,
    cemetery_id INT NOT NULL REFERENCES cemeteries(cemetery_id) ON DELETE CASCADE,
    section_name VARCHAR(100) NOT NULL,
    section_code VARCHAR(20) NOT NULL,
    total_plots INT DEFAULT 0,
    available_plots INT DEFAULT 0,
    description TEXT
);

CREATE INDEX idx_sections_cemetery ON sections(cemetery_id);

-- Graves table
CREATE TABLE graves (
    grave_id SERIAL PRIMARY KEY,
    section_id INT NOT NULL REFERENCES sections(section_id) ON DELETE CASCADE,
    plot_id VARCHAR(50) UNIQUE NOT NULL,
    plot_type VARCHAR(50) DEFAULT 'standard' CHECK (plot_type IN ('standard', 'family', 'cremation', 'estate')),
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied')),
    dimensions VARCHAR(50),
    capacity INT DEFAULT 1,
    premium_tier VARCHAR(50),
    base_price NUMERIC(10,2),
    maintenance_plan VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_graves_section ON graves(section_id);
CREATE INDEX idx_graves_status ON graves(status);
CREATE INDEX idx_graves_plot_id ON graves(plot_id);

-- Death cases table
CREATE TABLE death_cases (
    case_id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    deceased_name VARCHAR(255) NOT NULL,
    gender VARCHAR(20),
    age INT,
    cnic VARCHAR(15),
    date_of_death DATE,
    cause_of_death TEXT,
    next_of_kin_name VARCHAR(255),
    next_of_kin_contact VARCHAR(20),
    next_of_kin_relation VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'allocated', 'completed')),
    submitted_by_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    assigned_staff_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_death_cases_status ON death_cases(status);
CREATE INDEX idx_death_cases_registration ON death_cases(registration_number);
CREATE INDEX idx_death_cases_submitted_by ON death_cases(submitted_by_user_id);

-- Burial records table
CREATE TABLE burial_records (
    record_id SERIAL PRIMARY KEY,
    record_number VARCHAR(50) UNIQUE NOT NULL,
    case_id INT NOT NULL REFERENCES death_cases(case_id) ON DELETE CASCADE,
    grave_id INT NOT NULL REFERENCES graves(grave_id) ON DELETE CASCADE,
    funeral_director VARCHAR(255),
    burial_type VARCHAR(100),
    date_of_service TIMESTAMPTZ,
    officiating_clergy VARCHAR(255),
    religious_affiliation VARCHAR(100),
    vault_type VARCHAR(100),
    memorial_type VARCHAR(100),
    plot_ownership VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_burial_records_case ON burial_records(case_id);
CREATE INDEX idx_burial_records_grave ON burial_records(grave_id);

-- Reservations table
CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    reservation_number VARCHAR(50) UNIQUE NOT NULL,
    grave_id INT NOT NULL REFERENCES graves(grave_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    primary_contact VARCHAR(255),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    reservation_purpose TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled', 'expired')),
    holding_fee NUMERIC(10,2),
    expiry_date TIMESTAMPTZ,
    linked_case_id INT REFERENCES death_cases(case_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_grave ON reservations(grave_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Family plot groups table
CREATE TABLE family_plot_groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    preferred_section VARCHAR(100),
    number_of_members INT DEFAULT 1,
    special_requirements TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_groups_user ON family_plot_groups(user_id);

-- Family plot members table
CREATE TABLE family_plot_members (
    member_id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES family_plot_groups(group_id) ON DELETE CASCADE,
    grave_id INT NOT NULL REFERENCES graves(grave_id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_members_group ON family_plot_members(group_id);

-- Funeral services table
CREATE TABLE funeral_services (
    service_id SERIAL PRIMARY KEY,
    case_id INT NOT NULL REFERENCES death_cases(case_id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('ghusl', 'kafan', 'janaza', 'transport', 'other')),
    scheduled_datetime TIMESTAMPTZ,
    assigned_staff_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
    notes TEXT,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_funeral_services_case ON funeral_services(case_id);
CREATE INDEX idx_funeral_services_status ON funeral_services(status);

-- Case status history table
CREATE TABLE case_status_history (
    history_id SERIAL PRIMARY KEY,
    case_id INT NOT NULL REFERENCES death_cases(case_id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    notes TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_history_case ON case_status_history(case_id);
