CREATE DATABASE IF NOT EXISTS exam_slip;
USE exam_slip;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','admin') DEFAULT 'student'
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE,
  full_name VARCHAR(100),
  roll_no VARCHAR(20),
  department VARCHAR(100),
  semester INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10),
  title VARCHAR(100),
  semester INT
);

CREATE TABLE exam_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT,
  exam_date DATE,
  exam_time TIME,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE student_subjects (
  student_id INT,
  subject_id INT,
  PRIMARY KEY (student_id, subject_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

INSERT INTO users (student_id, password_hash, role) VALUES
('S001', '$2b$10$ld39by1HqARoTrpDK91CBOf9PwgxkamEqguhe6E.U3p0DnH2qEwHS', 'student'),
('S002', '$2b$10$ld39by1HqARoTrpDK91CBOf9PwgxkamEqguhe6E.U3p0DnH2qEwHS', 'student'),
('admin', '$2b$10$admin123', 'admin');

INSERT INTO students (user_id, full_name, roll_no, department, semester) VALUES
(1, 'Alice Smith', 'R001', 'Computer Science', 2),
(2, 'Bob Jones', 'R002', 'Computer Science', 2);

INSERT INTO subjects (code, title, semester) VALUES
('CS201', 'Data Structures', 2),
('CS202', 'OOP', 2);

INSERT INTO exam_schedules (subject_id, exam_date, exam_time) VALUES
(1, '2025-09-10', '09:00:00'),
(2, '2025-09-12', '14:00:00');

INSERT INTO student_subjects (student_id, subject_id) VALUES
(1,1),(1,2),(2,1),(2,2);