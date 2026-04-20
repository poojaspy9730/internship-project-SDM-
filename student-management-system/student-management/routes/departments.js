// routes/departments.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Department, Course } = require('../models/Department');

const deptValidation = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('code').trim().notEmpty().withMessage('Department code is required').isLength({ max: 10 }),
];

router.get('/', async (req, res) => {
  try {
    const data = await Department.getAll();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await Department.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', deptValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  try {
    const id = await Department.create(req.body);
    const data = await Department.getById(id);
    res.status(201).json({ success: true, message: 'Department created', data });
  } catch (err) {
    res.status(err.message.includes('Duplicate') ? 409 : 500).json({ success: false, message: err.message });
  }
});

router.put('/:id', deptValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  try {
    await Department.update(req.params.id, req.body);
    const data = await Department.getById(req.params.id);
    res.json({ success: true, message: 'Department updated', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Department.delete(req.params.id);
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
