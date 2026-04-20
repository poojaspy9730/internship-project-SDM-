// routes/students.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');

const studentValidation = [
  body('first_name').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('last_name').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('enrollment_date').notEmpty().withMessage('Enrollment date is required').isDate().withMessage('Invalid date format'),
  body('phone').optional({ checkFalsy: true }).matches(/^[\+\d\s\-\(\)]{7,20}$/).withMessage('Invalid phone number'),
  body('gpa').optional({ checkFalsy: true }).isFloat({ min: 0, max: 4 }).withMessage('GPA must be between 0 and 4'),
  body('status').optional().isIn(['Active', 'Inactive', 'Graduated', 'Suspended', 'On Leave']).withMessage('Invalid status'),
  body('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
];

router.get('/stats', studentController.getStats);
router.get('/generate-id', studentController.generateId);
router.get('/', studentController.getAll);
router.get('/:id', studentController.getById);
router.post('/', studentValidation, studentController.create);
router.put('/:id', studentValidation, studentController.update);
router.delete('/:id', studentController.delete);

module.exports = router;

// routes/departments.js  (inline)
// routes/courses.js      (inline)
