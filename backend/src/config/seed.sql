-- QabrNuma Seed Data
-- Sample data for development and testing

-- Users (password is 'password123' hashed with bcrypt)
INSERT INTO users (full_name, email, password_hash, phone_number, cnic, role, is_active) VALUES
('Admin User', 'admin@qabrnuma.pk', '$2a$10$8K1p/aJi5tGjLvxhI1fOqOQHs5KnvqxhHxEGqD8hxAhHR8uJKYR.e', '03001234567', '35201-1234567-1', 'admin', true),
('Ahmed Khan', 'staff@qabrnuma.pk', '$2a$10$8K1p/aJi5tGjLvxhI1fOqOQHs5KnvqxhHxEGqD8hxAhHR8uJKYR.e', '03011234567', '35201-2345678-2', 'staff', true),
('Fatima Ali', 'manager@qabrnuma.pk', '$2a$10$8K1p/aJi5tGjLvxhI1fOqOQHs5KnvqxhHxEGqD8hxAhHR8uJKYR.e', '03021234567', '35201-3456789-3', 'cemetery_manager', true),
('Muhammad Usman', 'user@qabrnuma.pk', '$2a$10$8K1p/aJi5tGjLvxhI1fOqOQHs5KnvqxhHxEGqD8hxAhHR8uJKYR.e', '03031234567', '35201-4567890-4', 'user', true);

-- Cemeteries
INSERT INTO cemeteries (name, address, city, total_capacity, available_plots, status, type) VALUES
('Miani Sahib Graveyard', 'Jail Road, Lahore', 'Lahore', 5000, 1200, 'active', 'heritage'),
('H-11 Graveyard', 'H-11 Sector, Islamabad', 'Islamabad', 3000, 800, 'active', 'premium');

-- Sections
INSERT INTO sections (cemetery_id, section_name, section_code, total_plots, available_plots, description) VALUES
(1, 'Block A - General', 'MS-A', 500, 120, 'General burial section with standard plots'),
(1, 'Block B - Premium', 'MS-B', 300, 80, 'Premium section with larger plots and better maintenance'),
(2, 'Section 1 - Standard', 'H11-1', 400, 150, 'Standard burial plots'),
(2, 'Section 2 - Family', 'H11-2', 200, 50, 'Family plot section with adjacent grave options');

-- Graves
INSERT INTO graves (section_id, plot_id, plot_type, status, dimensions, capacity, premium_tier, base_price, maintenance_plan) VALUES
(1, 'MS-A-101', 'standard', 'available', '6x3 ft', 1, NULL, 25000.00, 'basic'),
(1, 'MS-A-102', 'standard', 'available', '6x3 ft', 1, NULL, 25000.00, 'basic'),
(1, 'MS-A-103', 'standard', 'occupied', '6x3 ft', 1, NULL, 25000.00, 'basic'),
(2, 'MS-B-201', 'family', 'reserved', '10x6 ft', 4, 'gold', 150000.00, 'premium'),
(2, 'MS-B-202', 'estate', 'available', '12x8 ft', 6, 'platinum', 250000.00, 'premium'),
(3, 'H11-1-001', 'standard', 'available', '6x3 ft', 1, NULL, 35000.00, 'standard'),
(3, 'H11-1-002', 'standard', 'occupied', '6x3 ft', 1, NULL, 35000.00, 'standard'),
(3, 'H11-1-003', 'standard', 'available', '6x3 ft', 1, NULL, 35000.00, 'standard'),
(4, 'H11-2-101', 'family', 'available', '10x6 ft', 4, 'gold', 200000.00, 'premium'),
(4, 'H11-2-102', 'family', 'reserved', '10x6 ft', 4, 'gold', 200000.00, 'premium');

-- Death Cases
INSERT INTO death_cases (registration_number, deceased_name, gender, age, cnic, date_of_death, cause_of_death, next_of_kin_name, next_of_kin_contact, next_of_kin_relation, status, submitted_by_user_id, assigned_staff_id) VALUES
('DC-2026-0001', 'Abdul Rehman', 'Male', 72, '35201-5678901-5', '2026-05-01', 'Natural causes', 'Hassan Rehman', '03041234567', 'Son', 'completed', 4, 2),
('DC-2026-0002', 'Khadija Bibi', 'Female', 85, '35201-6789012-6', '2026-05-03', 'Natural causes', 'Ayesha Fatima', '03051234567', 'Daughter', 'approved', 4, 2),
('DC-2026-0003', 'Imran Malik', 'Male', 45, '35201-7890123-7', '2026-05-05', 'Cardiac arrest', 'Sara Malik', '03061234567', 'Wife', 'under_review', 4, NULL),
('DC-2026-0004', 'Zainab Ahmed', 'Female', 68, '35201-8901234-8', '2026-05-06', 'Respiratory illness', 'Ali Ahmed', '03071234567', 'Son', 'pending', 4, NULL),
('DC-2026-0005', 'Tariq Hussain', 'Male', 55, '35201-9012345-9', '2026-05-07', 'Natural causes', 'Nadia Hussain', '03081234567', 'Wife', 'allocated', 4, 2);

-- Reservations
INSERT INTO reservations (reservation_number, grave_id, user_id, primary_contact, phone_number, email, reservation_purpose, status, holding_fee, expiry_date) VALUES
('RES-2026-0001', 4, 4, 'Muhammad Usman', '03031234567', 'user@qabrnuma.pk', 'Family pre-planning', 'approved', 15000.00, '2027-05-07 00:00:00+05'),
('RES-2026-0002', 10, 4, 'Muhammad Usman', '03031234567', 'user@qabrnuma.pk', 'Personal reservation', 'pending', 20000.00, '2026-08-07 00:00:00+05'),
('RES-2026-0003', 5, 4, 'Muhammad Usman', '03031234567', 'user@qabrnuma.pk', 'Estate plot for extended family', 'approved', 25000.00, '2027-05-07 00:00:00+05');

-- Burial Records (for completed cases)
INSERT INTO burial_records (record_number, case_id, grave_id, funeral_director, burial_type, date_of_service, officiating_clergy, religious_affiliation, vault_type, memorial_type, plot_ownership, remarks) VALUES
('BR-2026-0001', 1, 3, 'Haji Muhammad Akbar', 'Islamic burial', '2026-05-02 14:00:00+05', 'Maulana Tariq Jameel', 'Islam - Sunni', 'Standard', 'Headstone', 'Permanent', 'Burial completed as per Islamic rites');

-- Funeral Services
INSERT INTO funeral_services (case_id, service_type, scheduled_datetime, assigned_staff_id, status, notes, completed_at) VALUES
(1, 'ghusl', '2026-05-02 10:00:00+05', 2, 'completed', 'Ghusl performed at mosque', '2026-05-02 11:00:00+05'),
(1, 'kafan', '2026-05-02 11:30:00+05', 2, 'completed', 'White cotton kafan used', '2026-05-02 12:00:00+05'),
(1, 'janaza', '2026-05-02 13:00:00+05', 2, 'completed', 'Janaza prayer at central mosque', '2026-05-02 13:30:00+05'),
(2, 'ghusl', '2026-05-08 09:00:00+05', 2, 'scheduled', 'Scheduled for tomorrow morning', NULL),
(5, 'transport', '2026-05-08 10:00:00+05', 2, 'scheduled', 'Transport arranged from hospital to cemetery', NULL);

-- Case Status History
INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes) VALUES
(1, 'pending', 'under_review', 2, 'Documents verified'),
(1, 'under_review', 'approved', 1, 'Case approved by admin'),
(1, 'approved', 'allocated', 2, 'Grave MS-A-103 allocated'),
(1, 'allocated', 'completed', 2, 'Burial completed successfully'),
(2, 'pending', 'under_review', 2, 'Initial review started'),
(2, 'under_review', 'approved', 1, 'All documents in order');
