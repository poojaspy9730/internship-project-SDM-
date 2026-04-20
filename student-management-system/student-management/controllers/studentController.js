// controllers/studentController.js
const { validationResult } = require('express-validator');
const Student = require('../models/Student');

// GET /api/students
exports.getAll = async (req, res) => {
  try {
    const { search, department, status, sortBy, sortOrder, page, limit } = req.query;
    const data = await Student.getAll({ search, department, status, sortBy, sortOrder, page, limit });
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('getAll error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching students' });
  }
};

// GET /api/students/stats
exports.getStats = async (req, res) => {
  try {
    const stats = await Student.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
};

// GET /api/students/generate-id
exports.generateId = async (req, res) => {
  try {
    const id = await Student.generateStudentId();
    res.json({ success: true, student_id: id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error generating ID' });
  }
};

// GET /api/students/:id
exports.getById = async (req, res) => {
  try {
    const student = await Student.getById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/students
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    const isDuplicate = await Student.checkDuplicate(req.body.email, req.body.student_id);
    if (isDuplicate) {
      return res.status(409).json({ success: false, message: 'A student with this email or Student ID already exists' });
    }
    const id = await Student.create(req.body);
    const student = await Student.getById(id);
    res.status(201).json({ success: true, message: 'Student created successfully', data: student });
  } catch (err) {
    console.error('create error:', err);
    res.status(500).json({ success: false, message: 'Error creating student' });
  }
};

// PUT /api/students/:id
exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    const existing = await Student.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Student not found' });

    const isDuplicate = await Student.checkDuplicate(req.body.email, req.body.student_id || existing.student_id, req.params.id);
    if (isDuplicate) {
      return res.status(409).json({ success: false, message: 'Email already used by another student' });
    }
    await Student.update(req.params.id, req.body);
    const updated = await Student.getById(req.params.id);
    res.json({ success: true, message: 'Student updated successfully', data: updated });
  } catch (err) {
    console.error('update error:', err);
    res.status(500).json({ success: false, message: 'Error updating student' });
  }
};

// DELETE /api/students/:id
exports.delete = async (req, res) => {
  try {
    const existing = await Student.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Student not found' });
    await Student.delete(req.params.id);
    res.json({ success: true, message: `Student ${existing.first_name} ${existing.last_name} deleted successfully` });
  } catch (err) {
    console.error('delete error:', err);
    res.status(500).json({ success: false, message: 'Error deleting student' });
  }
};
