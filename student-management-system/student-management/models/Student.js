// models/Student.js
const db = require('../config/database');

class Student {
  // Get all students with department info + search/sort/pagination
  static async getAll({ search = '', department = '', status = '', sortBy = 'created_at', sortOrder = 'DESC', page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const allowedSortFields = ['first_name', 'last_name', 'student_id', 'email', 'gpa', 'enrollment_date', 'created_at', 'status'];
    const allowedOrders = ['ASC', 'DESC'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? `s.${sortBy}` : 's.created_at';
    const safeSortOrder = allowedOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(s.first_name LIKE ? OR s.last_name LIKE ? OR s.email LIKE ? OR s.student_id LIKE ? OR s.phone LIKE ?)`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (department) {
      whereConditions.push(`s.department_id = ?`);
      params.push(department);
    }
    if (status) {
      whereConditions.push(`s.status = ?`);
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [students] = await db.execute(
      `SELECT s.*, d.name AS department_name, d.code AS department_code,
              COUNT(e.id) AS enrolled_courses
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN enrollments e ON s.id = e.student_id AND e.status = 'Enrolled'
       ${whereClause}
       GROUP BY s.id
       ORDER BY ${safeSortBy} ${safeSortOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM students s ${whereClause}`,
      params
    );

    return { students, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) };
  }

  // Get single student by ID with full details
  static async getById(id) {
    const [[student]] = await db.execute(
      `SELECT s.*, d.name AS department_name, d.code AS department_code
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       WHERE s.id = ?`,
      [id]
    );
    if (!student) return null;

    const [enrollments] = await db.execute(
      `SELECT e.*, c.name AS course_name, c.code AS course_code, c.instructor, c.credits
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = ?
       ORDER BY e.academic_year DESC, e.semester DESC`,
      [id]
    );

    const [fees] = await db.execute(
      `SELECT * FROM fees WHERE student_id = ? ORDER BY due_date DESC`,
      [id]
    );

    return { ...student, enrollments, fees };
  }

  // Create student
  static async create(data) {
    const {
      student_id, first_name, last_name, email, phone, date_of_birth, gender,
      address, city, state, country, postal_code, department_id, enrollment_date,
      graduation_date, status, emergency_contact_name, emergency_contact_phone
    } = data;

    const [result] = await db.execute(
      `INSERT INTO students 
       (student_id, first_name, last_name, email, phone, date_of_birth, gender,
        address, city, state, country, postal_code, department_id, enrollment_date,
        graduation_date, status, emergency_contact_name, emergency_contact_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, first_name, last_name, email, phone || null, date_of_birth || null,
       gender || 'Prefer not to say', address || null, city || null, state || null,
       country || 'India', postal_code || null, department_id || null, enrollment_date,
       graduation_date || null, status || 'Active', emergency_contact_name || null,
       emergency_contact_phone || null]
    );
    return result.insertId;
  }

  // Update student
  static async update(id, data) {
    const {
      first_name, last_name, email, phone, date_of_birth, gender,
      address, city, state, country, postal_code, department_id, enrollment_date,
      graduation_date, status, gpa, emergency_contact_name, emergency_contact_phone
    } = data;

    const [result] = await db.execute(
      `UPDATE students SET
        first_name=?, last_name=?, email=?, phone=?, date_of_birth=?, gender=?,
        address=?, city=?, state=?, country=?, postal_code=?, department_id=?,
        enrollment_date=?, graduation_date=?, status=?, gpa=?,
        emergency_contact_name=?, emergency_contact_phone=?
       WHERE id=?`,
      [first_name, last_name, email, phone || null, date_of_birth || null,
       gender || 'Prefer not to say', address || null, city || null, state || null,
       country || 'India', postal_code || null, department_id || null, enrollment_date,
       graduation_date || null, status || 'Active', gpa || 0.00,
       emergency_contact_name || null, emergency_contact_phone || null, id]
    );
    return result.affectedRows;
  }

  // Delete student
  static async delete(id) {
    const [result] = await db.execute(`DELETE FROM students WHERE id = ?`, [id]);
    return result.affectedRows;
  }

  // Dashboard stats
  static async getStats() {
    const [[totals]] = await db.execute(
      `SELECT 
        COUNT(*) AS total_students,
        SUM(status = 'Active') AS active_students,
        SUM(status = 'Graduated') AS graduated_students,
        SUM(status = 'Inactive') AS inactive_students,
        AVG(gpa) AS average_gpa
       FROM students`
    );

    const [byDept] = await db.execute(
      `SELECT d.name, d.code, COUNT(s.id) AS count
       FROM departments d
       LEFT JOIN students s ON d.id = s.department_id
       GROUP BY d.id ORDER BY count DESC`
    );

    const [recentStudents] = await db.execute(
      `SELECT s.*, d.name AS department_name FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       ORDER BY s.created_at DESC LIMIT 5`
    );

    const [[feeStats]] = await db.execute(
      `SELECT 
        SUM(CASE WHEN status='Paid' THEN amount ELSE 0 END) AS total_collected,
        SUM(CASE WHEN status='Pending' THEN amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN status='Overdue' THEN amount ELSE 0 END) AS total_overdue
       FROM fees`
    );

    return { totals, byDept, recentStudents, feeStats };
  }

  // Check duplicates
  static async checkDuplicate(email, studentId, excludeId = null) {
    let query = `SELECT id FROM students WHERE (email = ? OR student_id = ?)`;
    let params = [email, studentId];
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }

  // Generate next student ID
  static async generateStudentId() {
    const year = new Date().getFullYear();
    const [[last]] = await db.execute(
      `SELECT student_id FROM students WHERE student_id LIKE ? ORDER BY id DESC LIMIT 1`,
      [`STU${year}%`]
    );
    if (!last) return `STU${year}001`;
    const lastNum = parseInt(last.student_id.replace(`STU${year}`, '')) || 0;
    return `STU${year}${String(lastNum + 1).padStart(3, '0')}`;
  }
}

module.exports = Student;
