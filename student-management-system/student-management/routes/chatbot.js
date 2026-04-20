// routes/chatbot.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Simple rule-based chatbot for student management queries
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });

    const response = await processMessage(message.toLowerCase().trim());
    res.json({ success: true, reply: response });
  } catch (err) {
    res.status(500).json({ success: false, reply: 'Sorry, I encountered an error. Please try again.' });
  }
});

async function processMessage(msg) {
  // Greeting
  if (/^(hi|hello|hey|good\s?(morning|afternoon|evening)|howdy)/.test(msg)) {
    return "👋 Hello! I'm EduBot, your Student Management Assistant. I can help you with:\n• Student information & statistics\n• Department details\n• Course information\n• Enrollment & fee queries\n\nWhat would you like to know?";
  }

  // Total students
  if (/how many|total|count.*student/.test(msg) && /student/.test(msg)) {
    const [[r]] = await db.execute(`SELECT COUNT(*) AS total, SUM(status='Active') AS active FROM students`);
    return `📊 We currently have **${r.total} students** in the system:\n• Active: ${r.active}\n• Inactive: ${r.total - r.active}`;
  }

  // GPA / top students
  if (/top|best|highest.*gpa|gpa/.test(msg)) {
    const [rows] = await db.execute(
      `SELECT CONCAT(first_name,' ',last_name) AS name, student_id, gpa, status FROM students ORDER BY gpa DESC LIMIT 5`
    );
    if (!rows.length) return "No student GPA data available yet.";
    let reply = "🏆 **Top Students by GPA:**\n";
    rows.forEach((s, i) => { reply += `${i+1}. ${s.name} (${s.student_id}) — GPA: ${parseFloat(s.gpa).toFixed(2)}\n`; });
    return reply;
  }

  // Departments
  if (/department/.test(msg)) {
    const [rows] = await db.execute(`SELECT d.name, d.code, COUNT(s.id) AS cnt FROM departments d LEFT JOIN students s ON d.id=s.department_id GROUP BY d.id`);
    let reply = "🏫 **Departments:**\n";
    rows.forEach(d => { reply += `• ${d.name} (${d.code}) — ${d.cnt} students\n`; });
    return reply;
  }

  // Active students
  if (/active student/.test(msg)) {
    const [[r]] = await db.execute(`SELECT COUNT(*) AS cnt FROM students WHERE status='Active'`);
    return `✅ There are currently **${r.cnt} active students** enrolled.`;
  }

  // Courses
  if (/course/.test(msg)) {
    const [[r]] = await db.execute(`SELECT COUNT(*) AS cnt FROM courses`);
    const [popular] = await db.execute(
      `SELECT c.name, COUNT(e.id) AS enrolled FROM courses c LEFT JOIN enrollments e ON c.id=e.course_id GROUP BY c.id ORDER BY enrolled DESC LIMIT 3`
    );
    let reply = `📚 We offer **${r.cnt} courses** total.\n\n**Most Popular:**\n`;
    popular.forEach(c => { reply += `• ${c.name} (${c.enrolled} enrolled)\n`; });
    return reply;
  }

  // Fee / payment
  if (/fee|payment|pending|overdue/.test(msg)) {
    const [[r]] = await db.execute(
      `SELECT SUM(CASE WHEN status='Paid' THEN amount ELSE 0 END) AS paid, SUM(CASE WHEN status='Pending' THEN amount ELSE 0 END) AS pending, SUM(CASE WHEN status='Overdue' THEN amount ELSE 0 END) AS overdue FROM fees`
    );
    return `💰 **Fee Summary:**\n• Collected: ₹${Number(r.paid||0).toLocaleString('en-IN')}\n• Pending: ₹${Number(r.pending||0).toLocaleString('en-IN')}\n• Overdue: ₹${Number(r.overdue||0).toLocaleString('en-IN')}`;
  }

  // Add student
  if (/add|create|register.*student/.test(msg)) {
    return "➕ To add a new student:\n1. Click **'Add Student'** button on the Students page\n2. Fill in the required fields (marked with *)\n3. Click **Save** to create the record\n\nTip: Student ID is auto-generated for you!";
  }

  // Search
  if (/search|find|look.*up/.test(msg)) {
    return "🔍 You can search students by:\n• Name (first or last)\n• Email address\n• Student ID\n• Department\n• Status\n\nUse the search bar at the top of the Students list.";
  }

  // Help
  if (/help|what can you|what do you/.test(msg)) {
    return "🤖 **I can help you with:**\n\n📊 Statistics: 'How many students do we have?'\n🏆 Rankings: 'Show top students by GPA'\n🏫 Departments: 'List all departments'\n📚 Courses: 'What courses are available?'\n💰 Fees: 'Show fee summary'\n➕ Guidance: 'How to add a student?'\n\nJust ask me anything!";
  }

  // Default
  return "🤔 I'm not sure about that. Try asking:\n• 'How many students are enrolled?'\n• 'Show top students'\n• 'List departments'\n• 'Fee summary'\n\nOr type **help** for all options.";
}

module.exports = router;
