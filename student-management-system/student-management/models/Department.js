// models/Department.js
const db = require('../config/database');

class Department {
  static async getAll() {
    const [rows] = await db.execute(
      `SELECT d.*, COUNT(s.id) AS student_count, COUNT(c.id) AS course_count
       FROM departments d
       LEFT JOIN students s ON d.id = s.department_id
       LEFT JOIN courses c ON d.id = c.department_id
       GROUP BY d.id ORDER BY d.name ASC`
    );
    return rows;
  }

  static async getById(id) {
    const [[dept]] = await db.execute(`SELECT * FROM departments WHERE id = ?`, [id]);
    return dept;
  }

  static async create(data) {
    const { name, code, description, head_of_dept } = data;
    const [result] = await db.execute(
      `INSERT INTO departments (name, code, description, head_of_dept) VALUES (?, ?, ?, ?)`,
      [name, code, description || null, head_of_dept || null]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const { name, code, description, head_of_dept } = data;
    const [result] = await db.execute(
      `UPDATE departments SET name=?, code=?, description=?, head_of_dept=? WHERE id=?`,
      [name, code, description || null, head_of_dept || null, id]
    );
    return result.affectedRows;
  }

  static async delete(id) {
    const [[check]] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM students WHERE department_id = ?`, [id]
    );
    if (check.cnt > 0) throw new Error('Cannot delete department with enrolled students');
    const [result] = await db.execute(`DELETE FROM departments WHERE id = ?`, [id]);
    return result.affectedRows;
  }
}

// models/Course.js
class Course {
  static async getAll(departmentId = null) {
    let query = `SELECT c.*, d.name AS department_name, COUNT(e.id) AS enrolled_count
                 FROM courses c
                 LEFT JOIN departments d ON c.department_id = d.id
                 LEFT JOIN enrollments e ON c.id = e.course_id AND e.status='Enrolled'`;
    const params = [];
    if (departmentId) {
      query += ` WHERE c.department_id = ?`;
      params.push(departmentId);
    }
    query += ` GROUP BY c.id ORDER BY c.name ASC`;
    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async getById(id) {
    const [[course]] = await db.execute(
      `SELECT c.*, d.name AS department_name FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id WHERE c.id = ?`, [id]
    );
    return course;
  }

  static async create(data) {
    const { name, code, department_id, credits, description, instructor, max_students } = data;
    const [result] = await db.execute(
      `INSERT INTO courses (name, code, department_id, credits, description, instructor, max_students)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, code, department_id, credits || 3, description || null, instructor || null, max_students || 50]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const { name, code, department_id, credits, description, instructor, max_students } = data;
    const [result] = await db.execute(
      `UPDATE courses SET name=?, code=?, department_id=?, credits=?, description=?, instructor=?, max_students=? WHERE id=?`,
      [name, code, department_id, credits || 3, description || null, instructor || null, max_students || 50, id]
    );
    return result.affectedRows;
  }

  static async delete(id) {
    const [[check]] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM enrollments WHERE course_id = ?`, [id]
    );
    if (check.cnt > 0) throw new Error('Cannot delete course with existing enrollments');
    const [result] = await db.execute(`DELETE FROM courses WHERE id = ?`, [id]);
    return result.affectedRows;
  }
}

module.exports = { Department, Course };
