-- ============================================================
-- Student Management System - Complete Database Schema
-- Run this file in MySQL to set up the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS student_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_management;

-- ------------------------------------------------------------
-- Departments Table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  description TEXT,
  head_of_dept VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Courses Table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  department_id INT NOT NULL,
  credits INT NOT NULL DEFAULT 3,
  description TEXT,
  instructor VARCHAR(100),
  max_students INT DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- Students Table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender ENUM('Male', 'Female', 'Other', 'Prefer not to say') DEFAULT 'Prefer not to say',
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  country VARCHAR(50) DEFAULT 'India',
  postal_code VARCHAR(10),
  department_id INT,
  enrollment_date DATE NOT NULL,
  graduation_date DATE,
  status ENUM('Active', 'Inactive', 'Graduated', 'Suspended', 'On Leave') DEFAULT 'Active',
  gpa DECIMAL(3,2) DEFAULT 0.00,
  profile_photo VARCHAR(255),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_department (department_id)
);

-- ------------------------------------------------------------
-- Enrollments Table (Student ↔ Course relationship)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrollment_date DATE NOT NULL,
  grade VARCHAR(5),
  grade_points DECIMAL(3,2),
  semester VARCHAR(20) NOT NULL,
  academic_year VARCHAR(9) NOT NULL,
  status ENUM('Enrolled', 'Completed', 'Dropped', 'Failed') DEFAULT 'Enrolled',
  attendance_percent DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_enrollment (student_id, course_id, semester, academic_year),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- Fees Table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  fee_type ENUM('Tuition', 'Library', 'Sports', 'Lab', 'Hostel', 'Other') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status ENUM('Pending', 'Paid', 'Overdue', 'Waived') DEFAULT 'Pending',
  academic_year VARCHAR(9) NOT NULL,
  semester VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- Seed Data - Departments
-- ------------------------------------------------------------
INSERT INTO departments (name, code, description, head_of_dept) VALUES
('Computer Science', 'CS', 'Department of Computer Science & Engineering', 'Dr. Rajesh Kumar'),
('Mathematics', 'MATH', 'Department of Pure and Applied Mathematics', 'Dr. Priya Sharma'),
('Physics', 'PHY', 'Department of Physics', 'Dr. Anil Verma'),
('Chemistry', 'CHEM', 'Department of Chemistry', 'Dr. Sunita Patel'),
('Business Administration', 'BBA', 'Department of Business & Management', 'Dr. Vikram Singh'),
('Electronics', 'ECE', 'Department of Electronics & Communication', 'Dr. Meera Nair')
ON DUPLICATE KEY UPDATE name=name;

-- ------------------------------------------------------------
-- Seed Data - Courses
-- ------------------------------------------------------------
INSERT INTO courses (name, code, department_id, credits, instructor, max_students) VALUES
('Data Structures & Algorithms', 'CS201', 1, 4, 'Prof. Arjun Mehta', 60),
('Database Management Systems', 'CS301', 1, 3, 'Prof. Kavitha Reddy', 50),
('Operating Systems', 'CS302', 1, 3, 'Prof. Suresh Babu', 55),
('Machine Learning', 'CS401', 1, 4, 'Prof. Divya Iyer', 40),
('Calculus I', 'MATH101', 2, 4, 'Prof. Ramesh Nair', 70),
('Linear Algebra', 'MATH201', 2, 3, 'Prof. Anita Gupta', 60),
('Quantum Mechanics', 'PHY301', 3, 4, 'Prof. Vijay Kumar', 45),
('Organic Chemistry', 'CHEM201', 4, 3, 'Prof. Sridevi Rao', 50),
('Business Strategy', 'BBA301', 5, 3, 'Prof. Rohit Sharma', 65),
('Digital Electronics', 'ECE201', 6, 4, 'Prof. Lakshmi Narayanan', 55)
ON DUPLICATE KEY UPDATE name=name;

-- ------------------------------------------------------------
-- Seed Data - Sample Students
-- ------------------------------------------------------------
INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth, gender, department_id, enrollment_date, status, gpa, city, state) VALUES
('STU2024001', 'Aarav', 'Patel', 'aarav.patel@student.edu', '+91 98765 43210', '2003-05-15', 'Male', 1, '2024-07-01', 'Active', 3.85, 'Mumbai', 'Maharashtra'),
('STU2024002', 'Ishaan', 'Sharma', 'ishaan.sharma@student.edu', '+91 87654 32109', '2003-08-22', 'Male', 1, '2024-07-01', 'Active', 3.72, 'Pune', 'Maharashtra'),
('STU2024003', 'Ananya', 'Reddy', 'ananya.reddy@student.edu', '+91 76543 21098', '2002-12-10', 'Female', 2, '2023-07-01', 'Active', 3.91, 'Hyderabad', 'Telangana'),
('STU2024004', 'Rohan', 'Kumar', 'rohan.kumar@student.edu', '+91 65432 10987', '2002-03-18', 'Male', 5, '2023-07-01', 'Active', 3.45, 'Delhi', 'Delhi'),
('STU2024005', 'Priya', 'Singh', 'priya.singh@student.edu', '+91 54321 09876', '2001-09-30', 'Female', 6, '2022-07-01', 'Active', 3.68, 'Bangalore', 'Karnataka'),
('STU2024006', 'Arjun', 'Nair', 'arjun.nair@student.edu', '+91 43210 98765', '2001-11-05', 'Male', 3, '2022-07-01', 'Active', 3.55, 'Chennai', 'Tamil Nadu'),
('STU2024007', 'Meera', 'Gupta', 'meera.gupta@student.edu', '+91 32109 87654', '2003-01-25', 'Female', 4, '2024-07-01', 'Active', 3.78, 'Jaipur', 'Rajasthan'),
('STU2024008', 'Karan', 'Mehta', 'karan.mehta@student.edu', '+91 21098 76543', '2002-07-14', 'Male', 1, '2023-07-01', 'Inactive', 2.85, 'Ahmedabad', 'Gujarat')
ON DUPLICATE KEY UPDATE student_id=student_id;

-- ------------------------------------------------------------
-- Seed Data - Sample Enrollments
-- ------------------------------------------------------------
INSERT INTO enrollments (student_id, course_id, enrollment_date, grade, grade_points, semester, academic_year, status, attendance_percent) VALUES
(1, 1, '2024-07-15', NULL, NULL, 'Semester 1', '2024-2025', 'Enrolled', 88.50),
(1, 2, '2024-07-15', NULL, NULL, 'Semester 1', '2024-2025', 'Enrolled', 92.00),
(2, 1, '2024-07-15', NULL, NULL, 'Semester 1', '2024-2025', 'Enrolled', 76.00),
(3, 5, '2023-07-15', 'A', 4.00, 'Semester 1', '2023-2024', 'Completed', 95.00),
(3, 6, '2023-07-15', 'A-', 3.70, 'Semester 1', '2023-2024', 'Completed', 90.00),
(4, 9, '2023-07-15', 'B+', 3.30, 'Semester 1', '2023-2024', 'Completed', 82.00),
(5, 10, '2022-07-15', 'A', 4.00, 'Semester 1', '2022-2023', 'Completed', 97.00),
(6, 7, '2022-07-15', 'B', 3.00, 'Semester 1', '2022-2023', 'Completed', 79.00)
ON DUPLICATE KEY UPDATE student_id=student_id;

-- ------------------------------------------------------------
-- Seed Data - Sample Fees
-- ------------------------------------------------------------
INSERT INTO fees (student_id, fee_type, amount, due_date, paid_date, status, academic_year, semester) VALUES
(1, 'Tuition', 45000.00, '2024-08-01', '2024-07-28', 'Paid', '2024-2025', 'Semester 1'),
(1, 'Library', 2000.00, '2024-08-01', NULL, 'Pending', '2024-2025', 'Semester 1'),
(2, 'Tuition', 45000.00, '2024-08-01', '2024-07-30', 'Paid', '2024-2025', 'Semester 1'),
(3, 'Tuition', 45000.00, '2023-08-01', '2023-07-25', 'Paid', '2023-2024', 'Semester 1'),
(4, 'Tuition', 45000.00, '2023-08-01', NULL, 'Overdue', '2023-2024', 'Semester 1'),
(5, 'Tuition', 45000.00, '2022-08-01', '2022-07-20', 'Paid', '2022-2023', 'Semester 1'),
(6, 'Hostel', 18000.00, '2022-08-01', '2022-07-22', 'Paid', '2022-2023', 'Semester 1'),
(7, 'Tuition', 45000.00, '2024-08-01', '2024-08-10', 'Paid', '2024-2025', 'Semester 1');
