// routes/courses.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Course } = require('../models/Department');

const courseValidation = [
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('code').trim().notEmpty().withMessage('Course code is required'),
  body('department_id').notEmpty().withMessage('Department is required').isInt(),
  body('credits').optional().isInt({ min: 1, max: 6 }).withMessage('Credits must be 1-6'),
];

router.get('/', async (req, res) => {
  try {
    const data = await Course.getAll(req.query.department);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', courseValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  try {
    const id = await Course.create(req.body);
    const data = await Course.getById(id);
    res.status(201).json({ success: true, message: 'Course created', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', courseValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  try {
    await Course.update(req.params.id, req.body);
    const data = await Course.getById(req.params.id);
    res.json({ success: true, message: 'Course updated', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Course.delete(req.params.id);
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
