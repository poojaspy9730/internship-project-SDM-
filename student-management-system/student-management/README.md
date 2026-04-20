# 🎓 EduCore — Enterprise Student Management System

A full-stack Student Management System built with Node.js + Express + MySQL, featuring a stunning dark-themed UI, full CRUD operations, advanced search, and an AI-powered chatbot.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MySQL** v8.0+
- A code editor (VS Code / Antigravity)

---

## 📦 Installation Steps

### Step 1: Install Dependencies
```bash
cd student-management
npm install
```

### Step 2: Set Up MySQL Database
1. Open MySQL Workbench or your MySQL client
2. Run the full schema file:
```sql
SOURCE database/schema.sql;
```
Or paste the contents of `database/schema.sql` into your MySQL client and execute.

This will create:
- The `student_management` database
- All 5 tables (departments, students, courses, enrollments, fees)
- Sample seed data (6 departments, 10 courses, 8 students)

### Step 3: Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your MySQL credentials
```

Open `.env` and update:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=student_management
PORT=3000
```

### Step 4: Start the Server
```bash
# Development mode (auto-restart)
npm run dev

# OR production mode
npm start
```

### Step 5: Open the App
Open your browser and go to: **http://localhost:3000**

---

## 🏗️ Project Structure

```
student-management/
├── server.js                  # Express server entry point
├── package.json
├── .env.example               # Environment template
│
├── config/
│   └── database.js            # MySQL connection pool
│
├── models/
│   ├── Student.js             # Student model with all CRUD
│   └── Department.js          # Department + Course models
│
├── controllers/
│   └── studentController.js   # Student request handlers
│
├── routes/
│   ├── students.js            # Student routes + validation
│   ├── departments.js         # Department routes
│   ├── courses.js             # Course routes
│   └── chatbot.js             # EduBot AI chatbot routes
│
├── database/
│   └── schema.sql             # Full DB schema + seed data
│
└── public/
    ├── index.html             # Single-page application
    ├── css/
    │   └── style.css          # Complete styling
    └── js/
        └── app.js             # Frontend JavaScript
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/students` | List students (search, filter, sort, paginate) |
| GET    | `/api/students/stats` | Dashboard statistics |
| GET    | `/api/students/generate-id` | Auto-generate student ID |
| GET    | `/api/students/:id` | Get student with enrollments + fees |
| POST   | `/api/students` | Create student |
| PUT    | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| GET    | `/api/departments` | List all departments |
| POST   | `/api/departments` | Create department |
| PUT    | `/api/departments/:id` | Update department |
| DELETE | `/api/departments/:id` | Delete department |
| GET    | `/api/courses` | List courses (filter by dept) |
| POST   | `/api/courses` | Create course |
| PUT    | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |
| POST   | `/api/chatbot/chat` | Chat with EduBot |
| GET    | `/api/health` | Server health check |

---

## ✨ Features

- **Full CRUD** for Students, Departments, Courses
- **Relational Integrity** — FK constraints with proper ON DELETE/UPDATE rules
- **Advanced Search** — Real-time search by name, email, student ID
- **Filters & Sorting** — Filter by department/status, sort by any column
- **Pagination** — Server-side pagination
- **Form Validation** — Both frontend (JS) and backend (express-validator)
- **Secure Queries** — Parameterized queries prevent SQL injection
- **MVC Architecture** — Separated models, controllers, routes
- **EduBot AI Chatbot** — Answers questions about student data in real-time
- **Interactive Charts** — Doughnut, bar, line, pie charts via Chart.js
- **Responsive Design** — Works on mobile, tablet, desktop
- **Dark Theme UI** — Stunning navy/cyan color scheme
- **Toast Notifications** — Success/error feedback
- **Rate Limiting** — 300 requests per 15 minutes
- **Security Headers** — Helmet.js for HTTP security

---

## 🛡️ Security Features

- SQL Injection prevention via parameterized queries
- Input sanitization and validation
- Rate limiting on all API routes
- Helmet.js security headers
- CORS configuration
- Request size limiting (10MB)

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js 4.4 |
| Backend | Node.js + Express 4 |
| Database | MySQL 8 with mysql2 driver |
| Validation | express-validator |
| Security | Helmet, cors, express-rate-limit |
| Dev | nodemon |

---

## 🐛 Troubleshooting

**"Database connection failed"**
→ Check MySQL is running: `sudo service mysql start`
→ Verify credentials in `.env`
→ Ensure database exists: `CREATE DATABASE student_management;`

**"Cannot find module 'express'"**
→ Run `npm install` again

**Port already in use**
→ Change `PORT=3001` in `.env`

**Blank screen on startup**
→ Open browser console (F12) and check for errors
→ Visit http://localhost:3000/api/health to test backend

---

## 📝 License
MIT — Free to use and modify.
