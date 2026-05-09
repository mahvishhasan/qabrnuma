-- QabrNuma Seed Data
-- Realistic data based on Lahore, Pakistan cemeteries
-- All passwords: Demo1234!

-- ============================================
-- USERS (5 users, one per role)
-- ============================================
INSERT INTO users (full_name, email, password_hash, phone_number, cnic, role, is_active) VALUES
('Ahmed Khan', 'ahmed@qabrnuma.pk', '$2b$10$mua24deKOONj5bhBvDRf1unBV/DxyAyvFCb896D6C3hwNAJT0NH0i', '0300-1234567', '35201-1234567-1', 'user', true),
('Sara Malik', 'sara@qabrnuma.pk', '$2b$10$mua24deKOONj5bhBvDRf1unBV/DxyAyvFCb896D6C3hwNAJT0NH0i', '0321-9876543', '35202-9876543-2', 'admin', true),
('Usman Tariq', 'usman@qabrnuma.pk', '$2b$10$mua24deKOONj5bhBvDRf1unBV/DxyAyvFCb896D6C3hwNAJT0NH0i', '0333-5555555', '35203-5555555-3', 'staff', true),
('Nadia Hussain', 'nadia@qabrnuma.pk', '$2b$10$mua24deKOONj5bhBvDRf1unBV/DxyAyvFCb896D6C3hwNAJT0NH0i', '0345-7777777', '35204-7777777-4', 'funeral_coordinator', true),
('Bilal Chaudhry', 'bilal@qabrnuma.pk', '$2b$10$mua24deKOONj5bhBvDRf1unBV/DxyAyvFCb896D6C3hwNAJT0NH0i', '0312-8888888', '35205-8888888-5', 'cemetery_manager', true);

-- ============================================
-- CEMETERIES (3 cemeteries based on real Lahore locations)
-- ============================================
INSERT INTO cemeteries (name, address, city, state, country, postal_code, total_capacity, current_occupancy, contact_phone, contact_email, is_active, type, description, image_url) VALUES
(
  'Jannat ul Baqi Memorial Park',
  'Main Boulevard, Gulberg III',
  'Lahore',
  'Punjab',
  'Pakistan',
  '54660',
  2400,
  1850,
  '042-35761234',
  'info@jannatulbaqi.pk',
  true,
  'premium',
  'Lahore''s premier managed cemetery offering modern facilities, 24/7 security, and perpetual care plans. Located in the heart of Gulberg with easy access from all major areas.',
  'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=1200'
),
(
  'Miani Sahib Graveyard',
  'Mozang Road, Near Data Darbar',
  'Lahore',
  'Punjab',
  'Pakistan',
  '54000',
  5000,
  4200,
  '042-37654321',
  'admin@mianisahib.pk',
  true,
  'heritage',
  'One of Lahore''s oldest and most historic graveyards, serving the community for over 300 years. Final resting place of many notable scholars, poets, and community leaders.',
  'https://images.unsplash.com/photo-1473177104440-ffee2f376098?w=1200'
),
(
  'Bahisht Zawar Gardens',
  'Phase 5, DHA',
  'Lahore',
  'Punjab',
  'Pakistan',
  '54792',
  1200,
  680,
  '042-35889900',
  'care@bahistzawar.pk',
  true,
  'standard',
  'A modern, privately managed cemetery in DHA offering premium plots, family sections, and comprehensive maintenance plans in a peaceful, secure environment.',
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200'
);

-- ============================================
-- SECTIONS (9 sections, 3 per cemetery)
-- ============================================

-- Jannat ul Baqi Memorial Park sections
INSERT INTO sections (cemetery_id, section_name, section_code, total_plots, available_plots, description) VALUES
(1, 'Block A - VIP Enclosure', 'JB-A', 200, 45, 'Exclusive gated section with 24/7 security, landscaped surroundings, and dedicated caretakers.'),
(1, 'Block B - Family Plots', 'JB-B', 300, 78, 'Spacious family lots accommodating 4-8 members. Corner plots available with landmark positioning.'),
(1, 'Block C - Standard', 'JB-C', 400, 127, 'Affordable standard plots with basic maintenance included. Accessible location near main gate.');

-- Miani Sahib Graveyard sections
INSERT INTO sections (cemetery_id, section_name, section_code, total_plots, available_plots, description) VALUES
(2, 'Purana Qabristan', 'MS-PQ', 1500, 120, 'Historic section dating back to Mughal era. Traditional brick-lined graves with marble headstones.'),
(2, 'Naya Qabristan', 'MS-NQ', 2000, 380, 'Modern extension with organized rows, paved pathways, and numbered plots for easy location.'),
(2, 'Bab-ul-Jannat', 'MS-BJ', 500, 85, 'Premium section near the main entrance. Well-maintained with regular cleaning and security.');

-- Bahisht Zawar Gardens sections
INSERT INTO sections (cemetery_id, section_name, section_code, total_plots, available_plots, description) VALUES
(3, 'Garden Section', 'BZ-GS', 300, 95, 'Beautifully landscaped area with mature trees, seasonal flowers, and paved walking paths.'),
(3, 'Heritage Row', 'BZ-HR', 150, 28, 'Reserved for families with historical ties to the institution. Limited availability.'),
(3, 'East Wing', 'BZ-EW', 250, 117, 'Newly developed section with modern infrastructure, drainage system, and evening lighting.');

-- ============================================
-- GRAVES (20 graves with realistic Lahore details)
-- ============================================

-- Jannat ul Baqi - Block A (VIP)
INSERT INTO graves (section_id, plot_id, plot_type, status, dimensions, capacity, premium_tier, base_price, maintenance_plan, image_url) VALUES
(1, 'JB-A-101', 'estate', 'available', '10 x 15 feet', 4, 'Elite', 2200000.00, 'VIP Care', 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=800'),
(1, 'JB-A-102', 'estate', 'reserved', '10 x 15 feet', 4, 'Elite', 2500000.00, 'VIP Care', 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800'),
(1, 'JB-A-103', 'family', 'available', '10 x 20 feet', 6, 'Premium', 800000.00, 'Perpetual Care', 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=800');

-- Jannat ul Baqi - Block B (Family)
INSERT INTO graves (section_id, plot_id, plot_type, status, dimensions, capacity, premium_tier, base_price, maintenance_plan, image_url) VALUES
(2, 'JB-B-201', 'family', 'available', '10 x 20 feet', 6, 'Premium', 650000.00, 'Perpetual Care', 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800'),
(2, 'JB-B-202', 'family', 'reserved', '10 x 20 feet', 8, 'Premium', 780000.00, 'Perpetual Care', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'),
(2, 'JB-B-203', 'standard', 'available', '5 x 10 feet', 1, 'Standard', 145000.00, 'Standard', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800');

-- Jannat ul Baqi - Block C (Standard)
INSERT INTO graves (section_id, plot_id, plot_type, status, dimensions, capacity, premium_tier, base_price, maintenance_plan, image_url) VALUES
(3, 'JB-C-301', 'standard', 'available', '5 x 10 feet', 1, 'Economy', 95000.00, 'Basic', 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800'),
(3, 'JB-C-302', 'standard', 'occupied', '5 x 10 feet', 1, 'Economy', 85000.00, 'Basic', 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800');

-- Miani Sahib - Purana Qabristan
INSERT INTO graves (section_id, plot_id, plot_type, status, dimensions, capacity, premium_tier, base_price, maintenance_plan, image_url) VALUES
(4, 'MS-PQ-001', 'standard', 'available', '5 x 10 feet', 1, 'Standard', 75000.00, 'Basic', 'https://images.unsplash.com/photo-1473177104440-ffee2f376098?w=800'),
(4, 'MS-PQ-002', 'standard', 'maintenance', '5 x 10 feet', 1, 'Standard', 75000.00, 'Basic', 'https://images.unsplash.com/photo-1548625149-720754d14fd9?w=800');

-- Miani Sahib - Naya Qabristan
INSERT INTO graves (section_id, plot_id, plot_type, status, dimensions, capacity, premium_tier, base_price, maintenance_plan, image_url) VALUES
(5, 'MS-NQ-101', 'standard', 'available', '5 x 10 feet', 1, 'Economy', 65000.00, 'Basic', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800'),
(5, 'MS-NQ-102', 'standard', 'reserved', '5 x 10 feet', 1, 'Economy', 65000.00, 'Basic', 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800'),
(5, 'MS-NQ-103', 'cremation', 'available', '3 x 6 feet', 1, 'Economy', 45000.00, 'Basic', 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800');

-- Miani Sahib - Bab-ul-Jannat
INSERT INTO graves (section_id, plot_id, plot_type, status, dimensions, capacity, premium_tier, base_price, maintenance_plan, image_url) VALUES
(6, 'MS-BJ-001', 'family', 'available', '10 x 20 feet', 4, 'Premium', 450000.00, 'Standard', 'https://images.unsplash.com/photo-1548625149-720754d14fd9?w=800'),
(6, 'MS-BJ-002', 'standard', 'occupied', '5 x 10 feet', 1, 'Premium', 125000.00, 'Standard', 'https://images.unsplash.com/photo-1473177104440-ffee2f376098?w=800');

-- Bahisht Zawar - Garden Section
INSERT INTO graves (section_id, plot_id, plot_type, status, dimensions, capacity, premium_tier, base_price, maintenance_plan, image_url) VALUES
(7, 'BZ-GS-101', 'standard', 'available', '5 x 10 feet', 1, 'Standard', 110000.00, 'Standard', 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800'),
(7, 'BZ-GS-102', 'family', 'reserved', '10 x 20 feet', 4, 'Premium', 420000.00, 'Perpetual Care', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800');

-- Bahisht Zawar - Heritage Row
INSERT INTO graves (section_id, plot_id, plot_type, status, dimensions, capacity, premium_tier, base_price, maintenance_plan, image_url) VALUES
(8, 'BZ-HR-001', 'estate', 'maintenance', '10 x 15 feet', 6, 'Elite', 1800000.00, 'VIP Care', 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800'),
(8, 'BZ-HR-002', 'family', 'occupied', '10 x 20 feet', 4, 'Premium', 550000.00, 'Perpetual Care', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800');

-- Bahisht Zawar - East Wing
INSERT INTO graves (section_id, plot_id, plot_type, status, dimensions, capacity, premium_tier, base_price, maintenance_plan, image_url) VALUES
(9, 'BZ-EW-101', 'standard', 'occupied', '5 x 10 feet', 1, 'Economy', 90000.00, 'Basic', 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800');

-- ============================================
-- DEATH CASES (8 cases linked to Ahmed Khan)
-- ============================================
INSERT INTO death_cases (registration_number, deceased_name, gender, age, cnic, date_of_death, cause_of_death, next_of_kin_name, next_of_kin_contact, next_of_kin_relation, status, submitted_by_user_id) VALUES
-- Pending cases (2)
('DC-2024-0001', 'Muhammad Aslam Sheikh', 'Male', 72, '35201-4567891-3', '2024-01-15', 'Natural causes - heart failure', 'Tariq Sheikh', '0300-4567891', 'Son', 'pending', 1),
('DC-2024-0002', 'Fatima Begum', 'Female', 68, '35201-7891234-6', '2024-01-16', 'Respiratory illness', 'Ayesha Malik', '0321-7891234', 'Daughter', 'pending', 1),

-- Under review (1)
('DC-2024-0003', 'Abdul Rehman Qureshi', 'Male', 81, '35201-1472583-9', '2024-01-14', 'Natural causes - old age', 'Imran Qureshi', '0333-1472583', 'Son', 'under_review', 1),

-- Approved cases (2)
('DC-2024-0004', 'Khadija Bibi', 'Female', 55, '35201-9638527-4', '2024-01-12', 'Cancer', 'Hassan Ali', '0345-9638527', 'Husband', 'approved', 1),
('DC-2024-0005', 'Zahid Mahmood', 'Male', 63, '35201-7539514-1', '2024-01-11', 'Cardiac arrest', 'Bilal Mahmood', '0312-7539514', 'Son', 'approved', 1),

-- Allocated (1)
('DC-2024-0006', 'Nasreen Akhtar', 'Female', 77, '35201-3698521-7', '2024-01-10', 'Natural causes', 'Faisal Akhtar', '0300-3698521', 'Son', 'allocated', 1),

-- Completed cases (2)
('DC-2024-0007', 'Ghulam Mustafa', 'Male', 85, '35201-1597534-2', '2024-01-05', 'Natural causes - old age', 'Rashid Mustafa', '0321-1597534', 'Son', 'completed', 1),
('DC-2024-0008', 'Rabia Sultan', 'Female', 59, '35201-7531594-8', '2024-01-03', 'Kidney failure', 'Sana Sultan', '0333-7531594', 'Daughter', 'completed', 1);

-- ============================================
-- BURIAL RECORDS (2 records for completed cases)
-- ============================================
INSERT INTO burial_records (record_number, case_id, grave_id, funeral_director, burial_type, date_of_service, officiating_clergy, religious_affiliation, vault_type, memorial_type, plot_ownership, remarks) VALUES
('BR-2024-0001', 7, 8, 'Haji Muhammad Anwar', 'Islamic Traditional', '2024-01-06 14:00:00', 'Maulana Abdul Qadir', 'Sunni Islam', 'Standard Concrete', 'Marble Headstone', 'Family Owned', 'Janaza prayer held at Jamia Mosque Gulberg. Large community attendance.'),
('BR-2024-0002', 8, 15, 'Muhammad Ashraf & Sons', 'Islamic Traditional', '2024-01-04 11:30:00', 'Qari Yousuf Ahmed', 'Sunni Islam', 'Premium Vault', 'Granite Memorial', 'Purchased', 'Private family ceremony. Premium plot with perpetual care arrangement.');

-- ============================================
-- RESERVATIONS (6 reservations linked to Ahmed Khan)
-- ============================================
INSERT INTO reservations (reservation_number, grave_id, user_id, primary_contact, phone_number, email, reservation_purpose, status, holding_fee, expiry_date) VALUES
-- Pending (2)
('RES-2024-0001', 2, 1, 'Ahmed Khan', '0300-1234567', 'ahmed@qabrnuma.pk', 'Pre-need reservation for elderly parents', 'pending', 25000.00, NOW() + INTERVAL '48 hours'),
('RES-2024-0002', 5, 1, 'Ahmed Khan', '0300-1234567', 'ahmed@qabrnuma.pk', 'Family plot reservation', 'pending', 35000.00, NOW() + INTERVAL '72 hours'),

-- Approved (2)
('RES-2024-0003', 12, 1, 'Ahmed Khan', '0300-1234567', 'ahmed@qabrnuma.pk', 'Reserved for future family use', 'approved', 15000.00, NOW() + INTERVAL '30 days'),
('RES-2024-0004', 17, 1, 'Ahmed Khan', '0300-1234567', 'ahmed@qabrnuma.pk', 'Garden section for mother', 'approved', 20000.00, NOW() + INTERVAL '60 days'),

-- Cancelled (1)
('RES-2024-0005', 1, 1, 'Ahmed Khan', '0300-1234567', 'ahmed@qabrnuma.pk', 'Initially reserved but found alternative', 'cancelled', 50000.00, NOW() - INTERVAL '10 days'),

-- Expired (1)
('RES-2024-0006', 3, 1, 'Ahmed Khan', '0300-1234567', 'ahmed@qabrnuma.pk', 'Did not complete payment in time', 'expired', 18000.00, NOW() - INTERVAL '5 days');

-- ============================================
-- FUNERAL SERVICES (8 services with various statuses)
-- ============================================
INSERT INTO funeral_services (case_id, service_type, scheduled_datetime, preferred_datetime, assigned_staff_id, requested_by_user_id, location, price, status, notes) VALUES
-- Pending (2) - requested by Ahmed, awaiting coordinator
(1, 'ghusl', NULL, NOW() + INTERVAL '2 days', NULL, 1, 'Jannat ul Baqi Ghusl Khana', 5000.00, 'pending', 'Please arrange female ghusl service if available'),
(2, 'kafan', NULL, NOW() + INTERVAL '2 days', NULL, 1, 'Jannat ul Baqi', 3500.00, 'pending', 'Premium white cotton kafan requested'),

-- Scheduled (2) - assigned to Usman by Nadia
(4, 'janaza', NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day', 3, 1, 'Jamia Masjid Gulberg', 2000.00, 'scheduled', 'Coordinate with mosque imam for timing'),
(5, 'transport', NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day', 3, 1, 'Services Hospital to Jannat ul Baqi', 8000.00, 'scheduled', 'Pick up from hospital mortuary, family will accompany'),

-- In Progress (2)
(6, 'ghusl', NOW() - INTERVAL '2 hours', NOW(), 3, 1, 'Miani Sahib Ghusl Khana', 4500.00, 'in_progress', 'In progress - started at 10am'),
(6, 'kafan', NOW() - INTERVAL '1 hour', NOW(), 3, 1, 'Miani Sahib', 3000.00, 'in_progress', 'Using premium kafan as requested'),

-- Completed (2)
(7, 'janaza', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', 3, 1, 'Data Darbar Mosque', 2500.00, 'completed', 'Large attendance, approximately 200 people'),
(8, 'transport', NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days', 3, 1, 'Mayo Hospital to Bahisht Zawar', 7500.00, 'completed', 'Completed smoothly, family expressed gratitude');

-- Update completed_at for completed services
UPDATE funeral_services SET completed_at = NOW() - INTERVAL '2 days' WHERE case_id = 7 AND status = 'completed';
UPDATE funeral_services SET completed_at = NOW() - INTERVAL '4 days' WHERE case_id = 8 AND status = 'completed';

-- ============================================
-- CASE STATUS HISTORY (track all transitions)
-- ============================================

-- Case 1 history (pending)
INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes) VALUES
(1, NULL, 'pending', 1, 'Case submitted by family');

-- Case 2 history (pending)
INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes) VALUES
(2, NULL, 'pending', 1, 'Case submitted by family');

-- Case 3 history (under_review)
INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes) VALUES
(3, NULL, 'pending', 1, 'Case submitted by family'),
(3, 'pending', 'under_review', 2, 'Documents being verified');

-- Case 4 history (approved)
INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes) VALUES
(4, NULL, 'pending', 1, 'Case submitted by family'),
(4, 'pending', 'under_review', 2, 'Review started'),
(4, 'under_review', 'approved', 4, 'All documents verified, case approved');

-- Case 5 history (approved)
INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes) VALUES
(5, NULL, 'pending', 1, 'Case submitted by family'),
(5, 'pending', 'approved', 4, 'Fast-tracked approval due to urgent circumstances');

-- Case 6 history (allocated)
INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes) VALUES
(6, NULL, 'pending', 1, 'Case submitted by family'),
(6, 'pending', 'under_review', 2, 'Under review'),
(6, 'under_review', 'approved', 4, 'Approved'),
(6, 'approved', 'allocated', 4, 'Plot MS-NQ-102 allocated for burial');

-- Case 7 history (completed)
INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes) VALUES
(7, NULL, 'pending', 1, 'Case submitted by family'),
(7, 'pending', 'approved', 4, 'Approved'),
(7, 'approved', 'allocated', 4, 'Plot JB-C-302 allocated'),
(7, 'allocated', 'completed', 4, 'Burial completed successfully');

-- Case 8 history (completed)
INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes) VALUES
(8, NULL, 'pending', 1, 'Case submitted by family'),
(8, 'pending', 'under_review', 2, 'Documents verification'),
(8, 'under_review', 'approved', 4, 'All verified'),
(8, 'approved', 'allocated', 4, 'Plot MS-BJ-002 allocated'),
(8, 'allocated', 'completed', 4, 'Burial completed, family satisfied with services');

-- ============================================
-- Update cemetery occupancy numbers
-- ============================================
UPDATE cemeteries SET current_occupancy = (
  SELECT COUNT(*) FROM graves g
  JOIN sections s ON g.section_id = s.section_id
  WHERE s.cemetery_id = cemeteries.cemetery_id AND g.status = 'occupied'
);
