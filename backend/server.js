import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// ---------- AUTH ----------
app.post('/api/login', async (req, res) => {
  const { student_id, password } = req.body;
  const [rows] = await pool.query('SELECT * FROM users WHERE student_id=?', [student_id]);
  if (!rows.length || !await bcrypt.compare(password, rows[0].password_hash))
    return res.status(401).json({ msg: 'Invalid credentials' });

  const token = jwt.sign({ id: rows[0].id, role: rows[0].role, student_id }, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.cookie('token', token, { httpOnly: true });
  res.json({ token, role: rows[0].role });
});

// ---------- STUDENT DATA ----------
app.get('/api/me', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const { student_id } = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(`
      SELECT s.full_name, s.roll_no, s.department, s.semester,
             sub.code, sub.title, es.exam_date, es.exam_time
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN student_subjects ss ON ss.student_id = s.id
      JOIN subjects sub ON sub.id = ss.subject_id
      JOIN exam_schedules es ON es.subject_id = sub.id
      WHERE u.student_id = ?`, [student_id]);
    res.json(rows);
  } catch {
    res.status(403).json({ msg: 'Invalid token' });
  }
});

// ---------- PERMISSION SLIP PDF ----------
app.get('/api/permission-slip', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const { student_id } = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(`
      SELECT s.full_name, s.roll_no, s.department, s.semester,
             sub.code, sub.title, es.exam_date, es.exam_time
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN student_subjects ss ON ss.student_id = s.id
      JOIN subjects sub ON sub.id = ss.subject_id
      JOIN exam_schedules es ON es.subject_id = sub.id
      WHERE u.student_id = ?`, [student_id]);

    if (!rows.length) return res.status(404).json({ msg: 'Data not found' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="clearance-slip.pdf"');
    doc.pipe(res);

    // Header
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Northern University Bangladesh', 50, 50, { align: 'center' })
      .fontSize(14)
      .text('Clearance for Assessment', 50, 75, { align: 'center' })
      .moveDown();

    // Student info box
    const infoTop = 110;
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`ID No.: ${rows[0].roll_no}`, 50, infoTop)
      .text(`Semester: Fall 2023`, 50, infoTop + 15)
      .text(`Student Name: ${rows[0].full_name}`, 50, infoTop + 30)
      .text(`Enrolled Semester: ${rows[0].semester}`, 50, infoTop + 45)
      .text(`Program Name: Bachelor of Science in ${rows[0].department}`, 50, infoTop + 60)
      .moveDown();

    // Course table header
    const tableTop = 200;
    doc
      .font('Helvetica-Bold')
      .text('Course Code', 50, tableTop)
      .text('Course Title', 150, tableTop)
      .text('Section', 350, tableTop)
      .text('Remarks', 450, tableTop);

    doc.moveDown(0.5);

    // Course rows
    let y = tableTop + 20;
    doc.font('Helvetica');
    rows.forEach(r => {
      doc
        .text(r.code, 50, y)
        .text(r.title, 150, y)
        .text('K', 350, y)          // hard-coded section
        .text('C', 450, y);         // hard-coded remarks
      y += 15;
    });

    // Footer
    const footerY = y + 40;
    doc
      .text('Valid for Final Assessment, Fall 2023', 50, footerY)
      .moveDown()
      .text('Controller of Examinations', 50, footerY + 30)
      .fontSize(9)
      .text(
        '111/2 Kawlar Jame Mosjid Road, Ashkona, (Near Haj Camp) Dakshinkhan, Dhaka-1230',
        50,
        footerY + 50
      );
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ---------- ADMIN ----------
app.get('/api/admin/students', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const { role } = jwt.verify(token, process.env.JWT_SECRET);
    if (role !== 'admin') throw new Error();
    const [rows] = await pool.query('SELECT * FROM students');
    res.json(rows);
  } catch {
    res.status(403).json({ msg: 'Admin only' });
  }
});

// ---------- 100 % confirmation line ----------
app.listen(process.env.PORT || 5000, () =>
  console.log('Server started on http://localhost:' + (process.env.PORT || 5000))
);