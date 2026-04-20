/* ============================================================
   EduCore — Main Frontend JavaScript
   Handles: Navigation, CRUD, Charts, Chatbot, Modals, Toast
   ============================================================ */

'use strict';

// ── State ────────────────────────────────────────────────
const state = {
  currentPage: 'dashboard',
  students: [],
  departments: [],
  courses: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  filters: { search: '', department: '', status: '', sortBy: 'created_at', sortOrder: 'DESC' },
  editingStudentId: null,
  editingDeptId: null,
  editingCourseId: null,
  charts: {},
  deleteCallback: null,
};

// ── API Helper ───────────────────────────────────────────
const BASE = '/api';

async function api(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok && !data.errors) throw new Error(data.message || 'Request failed');
  return data;
}

// ── Page Navigation ──────────────────────────────────────
function navigate(page) {
  state.currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  const titles = {
    dashboard: ['Dashboard', 'Welcome back, Admin!'],
    students: ['Students', 'Manage all student records'],
    departments: ['Departments', 'Manage academic departments'],
    courses: ['Courses', 'Manage course offerings'],
    reports: ['Analytics & Reports', 'View institutional insights'],
  };
  const [title, sub] = titles[page] || ['EduCore', ''];
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSub').textContent = sub;

  // Close sidebar on mobile
  closeSidebar();

  // Load page data
  switch (page) {
    case 'dashboard':   loadDashboard(); break;
    case 'students':    loadStudents(); break;
    case 'departments': loadDepartments(); break;
    case 'courses':     loadCourses(); break;
    case 'reports':     loadReports(); break;
  }
}

// ── Dashboard ───────────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await api('/students/stats');
    const { totals, byDept, recentStudents, feeStats } = res.data;

    // Stats
    animateCount('stat-total', totals.total_students || 0);
    animateCount('stat-active', totals.active_students || 0);
    animateCount('stat-graduated', totals.graduated_students || 0);
    document.getElementById('stat-gpa').textContent = parseFloat(totals.average_gpa || 0).toFixed(2);

    // Hero floaters
    document.getElementById('hero-students').textContent = totals.total_students || 0;
    document.getElementById('hero-gpa').textContent = parseFloat(totals.average_gpa || 0).toFixed(1);

    // Courses count
    const cRes = await api('/courses');
    document.getElementById('hero-courses').textContent = cRes.data.length;

    // Recent students
    const recentEl = document.getElementById('recentStudentsList');
    if (recentStudents.length) {
      recentEl.innerHTML = recentStudents.map(s => `
        <div class="recent-item">
          <div class="recent-avatar">${s.first_name[0]}${s.last_name[0]}</div>
          <div class="recent-info">
            <div class="recent-name">${s.first_name} ${s.last_name}</div>
            <div class="recent-dept">${s.department_name || 'Unassigned'} • ${s.student_id}</div>
          </div>
          <div class="recent-gpa">${parseFloat(s.gpa||0).toFixed(2)}</div>
        </div>
      `).join('');
    } else {
      recentEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:20px 0">No students yet</p>';
    }

    // Fee bars
    const paid = parseFloat(feeStats.total_collected || 0);
    const pending = parseFloat(feeStats.total_pending || 0);
    const overdue = parseFloat(feeStats.total_overdue || 0);
    const total = paid + pending + overdue || 1;
    document.getElementById('fee-collected').textContent = '₹' + paid.toLocaleString('en-IN');
    document.getElementById('fee-pending').textContent   = '₹' + pending.toLocaleString('en-IN');
    document.getElementById('fee-overdue').textContent   = '₹' + overdue.toLocaleString('en-IN');
    setTimeout(() => {
      document.getElementById('fee-bar-collected').style.width = (paid/total*100)+'%';
      document.getElementById('fee-bar-pending').style.width   = (pending/total*100)+'%';
      document.getElementById('fee-bar-overdue').style.width   = (overdue/total*100)+'%';
    }, 200);

    // Dept chart
    renderDeptChart(byDept);

  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 40);
}

function renderDeptChart(byDept) {
  const canvas = document.getElementById('deptChart');
  if (!canvas) return;
  if (state.charts.dept) state.charts.dept.destroy();

  const colors = ['#00d4ff','#818cf8','#f5c842','#22c55e','#ff6eb4','#f59e0b'];
  state.charts.dept = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: byDept.map(d => d.name),
      datasets: [{
        data: byDept.map(d => d.count),
        backgroundColor: colors,
        borderColor: '#111827',
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94aab8', padding: 12, font: { size: 11 } },
        },
      },
      cutout: '62%',
    },
  });
}

// ── Students ─────────────────────────────────────────────
async function loadStudents() {
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = `<tr><td colspan="8" class="table-loading"><div class="spinner"></div> Loading students…</td></tr>`;

  try {
    const { page, limit } = state.pagination;
    const { search, department, status, sortBy, sortOrder } = state.filters;

    const params = new URLSearchParams({ search, department, status, sortBy, sortOrder, page, limit });
    const res = await api(`/students?${params}`);

    state.students = res.students;
    state.pagination = { page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages };

    renderStudentsTable(res.students);
    renderPagination();

    const info = document.getElementById('tableInfo');
    const start = (res.page - 1) * res.limit + 1;
    const end = Math.min(start + res.students.length - 1, res.total);
    info.textContent = res.total > 0 ? `Showing ${start}–${end} of ${res.total} students` : 'No students found';

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-loading" style="color:var(--danger)"><i class="fas fa-exclamation-circle"></i> Error loading students</td></tr>`;
    console.error(err);
  }
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('studentsTableBody');
  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-loading"><i class="fas fa-user-slash" style="font-size:2rem;color:var(--text-muted);display:block;margin-bottom:8px"></i>No students found</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const name = `${s.first_name} ${s.last_name}`;
    const initials = `${s.first_name[0]}${s.last_name[0]}`;
    const gpa = parseFloat(s.gpa || 0);
    const gpaClass = gpa >= 3.5 ? 'gpa-high' : gpa >= 2.5 ? 'gpa-mid' : 'gpa-low';
    const statusClass = 'status-' + s.status.replace(' ', '.');
    const dateStr = s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '—';

    return `
      <tr>
        <td><input type="checkbox" class="row-check" data-id="${s.id}" /></td>
        <td><span style="font-size:0.82rem;color:var(--primary);font-weight:600">${s.student_id}</span></td>
        <td>
          <div class="student-cell">
            <div class="s-avatar">${initials}</div>
            <div>
              <div class="s-name">${name}</div>
              <div class="s-email">${s.email}</div>
            </div>
          </div>
        </td>
        <td><span style="font-size:0.82rem">${s.department_name || '<span style="color:var(--text-muted)">—</span>'}</span></td>
        <td><span class="gpa-badge ${gpaClass}">${gpa.toFixed(2)}</span></td>
        <td><span class="status-badge ${statusClass}"><i class="fas fa-circle" style="font-size:0.45rem"></i>${s.status}</span></td>
        <td style="font-size:0.82rem;color:var(--text-secondary)">${dateStr}</td>
        <td>
          <div class="action-btns">
            <button class="btn-sm success-btn" title="View" onclick="viewStudent(${s.id})"><i class="fas fa-eye"></i></button>
            <button class="btn-sm" title="Edit" onclick="openStudentModal(${s.id})"><i class="fas fa-pen"></i></button>
            <button class="btn-sm danger" title="Delete" onclick="confirmDelete('student',${s.id},'${name}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPagination() {
  const { page, totalPages } = state.pagination;
  const el = document.getElementById('pagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = `<button class="page-btn" ${page===1?'disabled':''} onclick="changePage(${page-1})"><i class="fas fa-chevron-left"></i></button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page-1 && i <= page+1)) {
      html += `<button class="page-btn ${i===page?'active':''}" onclick="changePage(${i})">${i}</button>`;
    } else if (i === 2 || i === totalPages-1) {
      html += `<span class="page-btn" style="cursor:default">…</span>`;
    }
  }

  html += `<button class="page-btn" ${page===totalPages?'disabled':''} onclick="changePage(${page+1})"><i class="fas fa-chevron-right"></i></button>`;
  el.innerHTML = html;
}

function changePage(p) {
  state.pagination.page = p;
  loadStudents();
}

// Search debounce
let searchTimer;
document.getElementById('studentSearch').addEventListener('input', function () {
  state.filters.search = this.value;
  document.getElementById('clearSearch').style.display = this.value ? 'flex' : 'none';
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.pagination.page = 1; loadStudents(); }, 400);
});
document.getElementById('clearSearch').addEventListener('click', function () {
  document.getElementById('studentSearch').value = '';
  state.filters.search = '';
  this.style.display = 'none';
  state.pagination.page = 1;
  loadStudents();
});
document.getElementById('filterDept').addEventListener('change', function () {
  state.filters.department = this.value;
  state.pagination.page = 1;
  loadStudents();
});
document.getElementById('filterStatus').addEventListener('change', function () {
  state.filters.status = this.value;
  state.pagination.page = 1;
  loadStudents();
});
document.getElementById('sortBy').addEventListener('change', function () {
  state.filters.sortBy = this.value;
  state.pagination.page = 1;
  loadStudents();
});

// Sortable columns
document.querySelectorAll('.sortable').forEach(th => {
  th.addEventListener('click', function () {
    const col = this.dataset.col;
    if (state.filters.sortBy === col) {
      state.filters.sortOrder = state.filters.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      state.filters.sortBy = col;
      state.filters.sortOrder = 'DESC';
    }
    state.pagination.page = 1;
    loadStudents();
  });
});

// Select all checkbox
document.getElementById('selectAll').addEventListener('change', function () {
  document.querySelectorAll('.row-check').forEach(c => c.checked = this.checked);
});

// ── Student Modal ─────────────────────────────────────────
async function openStudentModal(id = null) {
  state.editingStudentId = id;
  clearFormErrors('studentForm');
  resetFormTabs();

  document.getElementById('studentModalTitle').textContent = id ? 'Edit Student' : 'Add New Student';
  document.getElementById('saveStudentBtn').querySelector('span').textContent = id ? 'Update Student' : 'Save Student';

  // Load departments into form
  await loadDepartmentsIntoSelect('fDept');

  if (id) {
    try {
      const res = await api(`/students/${id}`);
      const s = res.data;
      document.getElementById('studentId').value = s.id;
      document.getElementById('fStudentId').value = s.student_id;
      document.getElementById('fFirstName').value = s.first_name || '';
      document.getElementById('fLastName').value  = s.last_name  || '';
      document.getElementById('fEmail').value     = s.email      || '';
      document.getElementById('fPhone').value     = s.phone      || '';
      document.getElementById('fDob').value       = s.date_of_birth ? s.date_of_birth.split('T')[0] : '';
      document.getElementById('fGender').value    = s.gender     || 'Prefer not to say';
      document.getElementById('fAddress').value   = s.address    || '';
      document.getElementById('fCity').value      = s.city       || '';
      document.getElementById('fState').value     = s.state      || '';
      document.getElementById('fCountry').value   = s.country    || 'India';
      document.getElementById('fPostal').value    = s.postal_code || '';
      document.getElementById('fDept').value      = s.department_id || '';
      document.getElementById('fGpa').value       = s.gpa || '';
      document.getElementById('fEnrollDate').value = s.enrollment_date ? s.enrollment_date.split('T')[0] : '';
      document.getElementById('fGradDate').value  = s.graduation_date ? s.graduation_date.split('T')[0] : '';
      document.getElementById('fStatus').value    = s.status     || 'Active';
      document.getElementById('fEcName').value    = s.emergency_contact_name  || '';
      document.getElementById('fEcPhone').value   = s.emergency_contact_phone || '';
    } catch (err) {
      showToast('Failed to load student data', 'error');
      return;
    }
  } else {
    document.getElementById('studentForm').reset();
    document.getElementById('fCountry').value = 'India';
    document.getElementById('fStatus').value = 'Active';
    generateStudentId();
    document.getElementById('fEnrollDate').value = new Date().toISOString().split('T')[0];
  }

  openModal('studentModal');
}

async function generateStudentId() {
  try {
    const res = await api('/students/generate-id');
    document.getElementById('fStudentId').value = res.student_id;
  } catch (err) {
    console.error('ID gen error:', err);
  }
}

async function saveStudent() {
  clearFormErrors('studentForm');
  const form = document.getElementById('studentForm');

  // Frontend validation
  const errors = validateStudentForm();
  if (errors.length) {
    errors.forEach(e => showFieldError(e.field, e.msg));
    switchToTabWithError();
    return;
  }

  const body = {};
  new FormData(form).forEach((v, k) => { body[k] = v.trim(); });
  if (!body.student_id) body.student_id = document.getElementById('fStudentId').value;

  const btn = document.getElementById('saveStudentBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Saving…';

  try {
    if (state.editingStudentId) {
      await api(`/students/${state.editingStudentId}`, 'PUT', body);
      showToast('Student updated successfully!', 'success');
    } else {
      await api('/students', 'POST', body);
      showToast('Student created successfully!', 'success');
    }
    closeModal('studentModal');
    if (state.currentPage === 'students') loadStudents();
    else loadDashboard();
  } catch (err) {
    if (err.message) showToast(err.message, 'error');
    else showToast('Failed to save student', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> <span>' + (state.editingStudentId ? 'Update Student' : 'Save Student') + '</span>';
  }
}

function validateStudentForm() {
  const errors = [];
  const fn = document.getElementById('fFirstName').value.trim();
  const ln = document.getElementById('fLastName').value.trim();
  const em = document.getElementById('fEmail').value.trim();
  const ed = document.getElementById('fEnrollDate').value;

  if (!fn) errors.push({ field: 'first_name', msg: 'First name is required' });
  if (!ln) errors.push({ field: 'last_name', msg: 'Last name is required' });
  if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) errors.push({ field: 'email', msg: 'Valid email is required' });
  if (!ed) errors.push({ field: 'enrollment_date', msg: 'Enrollment date is required' });

  return errors;
}

function showFieldError(field, msg) {
  const el = document.getElementById(`err-${field}`);
  if (el) el.textContent = msg;
  const input = document.querySelector(`[name="${field}"]`);
  if (input) input.classList.add('error');
}

function clearFormErrors(formId) {
  document.querySelectorAll(`#${formId} .field-error`).forEach(el => el.textContent = '');
  document.querySelectorAll(`#${formId} .error`).forEach(el => el.classList.remove('error'));
}

function switchToTabWithError() {
  const errorFields = { basic: ['first_name','last_name','email'], academic: ['enrollment_date'] };
  for (const [tab, fields] of Object.entries(errorFields)) {
    if (fields.some(f => document.getElementById(`err-${f}`)?.textContent)) {
      switchTab(tab);
      return;
    }
  }
}

// ── View Student ──────────────────────────────────────────
async function viewStudent(id) {
  openModal('viewStudentModal');
  document.getElementById('viewStudentBody').innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const res = await api(`/students/${id}`);
    const s = res.data;
    const dob = s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('en-IN') : '—';
    const enroll = s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString('en-IN') : '—';
    const gpa = parseFloat(s.gpa || 0);
    const gpaClass = gpa >= 3.5 ? 'gpa-high' : gpa >= 2.5 ? 'gpa-mid' : 'gpa-low';

    const enrollmentsHtml = s.enrollments?.length ? s.enrollments.map(e => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-weight:600;font-size:0.88rem">${e.course_name}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">${e.course_code} • ${e.semester} ${e.academic_year}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:600;color:var(--primary)">${e.grade || 'In Progress'}</div>
          <div style="font-size:0.72rem;color:var(--text-secondary)">${e.status}</div>
        </div>
      </div>
    `).join('') : '<p style="color:var(--text-muted);font-size:0.85rem;padding:16px 0">No enrollments found</p>';

    const feesHtml = s.fees?.length ? s.fees.map(f => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-weight:600;font-size:0.88rem">${f.fee_type}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">${f.academic_year}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:600">₹${parseFloat(f.amount).toLocaleString('en-IN')}</div>
          <span class="status-badge status-${f.status}" style="font-size:0.68rem">${f.status}</span>
        </div>
      </div>
    `).join('') : '<p style="color:var(--text-muted);font-size:0.85rem;padding:16px 0">No fee records found</p>';

    document.getElementById('viewStudentBody').innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${s.first_name[0]}${s.last_name[0]}</div>
        <div>
          <div class="profile-name">${s.first_name} ${s.last_name}</div>
          <div class="profile-id">${s.student_id} • ${s.department_name || 'No Department'}</div>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            <span class="status-badge status-${s.status}"><i class="fas fa-circle" style="font-size:0.45rem"></i>${s.status}</span>
            <span class="gpa-badge ${gpaClass}">GPA: ${gpa.toFixed(2)}</span>
          </div>
        </div>
        <div style="margin-left:auto">
          <button class="btn-primary btn-sm" style="height:auto;padding:8px 16px" onclick="closeModal('viewStudentModal');openStudentModal(${s.id})">
            <i class="fas fa-pen"></i> Edit
          </button>
        </div>
      </div>

      <div class="profile-tabs">
        <button class="ptab active" onclick="switchPTab(this,'pPersonal')">Personal</button>
        <button class="ptab" onclick="switchPTab(this,'pEnrollments')">Courses (${s.enrollments?.length||0})</button>
        <button class="ptab" onclick="switchPTab(this,'pFees')">Fees (${s.fees?.length||0})</button>
      </div>

      <div id="pPersonal">
        <div class="info-grid">
          <div class="info-item"><label>Email</label><span>${s.email}</span></div>
          <div class="info-item"><label>Phone</label><span>${s.phone || '—'}</span></div>
          <div class="info-item"><label>Date of Birth</label><span>${dob}</span></div>
          <div class="info-item"><label>Gender</label><span>${s.gender || '—'}</span></div>
          <div class="info-item"><label>Enrollment Date</label><span>${enroll}</span></div>
          <div class="info-item"><label>City / State</label><span>${[s.city,s.state].filter(Boolean).join(', ') || '—'}</span></div>
          <div class="info-item"><label>Country</label><span>${s.country || 'India'}</span></div>
          <div class="info-item"><label>Emergency Contact</label><span>${s.emergency_contact_name || '—'} ${s.emergency_contact_phone ? '('+s.emergency_contact_phone+')' : ''}</span></div>
        </div>
      </div>

      <div id="pEnrollments" style="display:none">
        ${enrollmentsHtml}
      </div>

      <div id="pFees" style="display:none">
        ${feesHtml}
      </div>
    `;
  } catch (err) {
    document.getElementById('viewStudentBody').innerHTML = '<p style="color:var(--danger);text-align:center;padding:32px">Failed to load student data</p>';
  }
}

function switchPTab(btn, sectionId) {
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  ['pPersonal','pEnrollments','pFees'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === sectionId ? 'block' : 'none';
  });
}

// ── Departments ──────────────────────────────────────────
async function loadDepartments() {
  try {
    const res = await api('/departments');
    state.departments = res.data;

    // Update select filters
    const selects = ['filterDept', 'fDept', 'cDept', 'courseDeptFilter'];
    selects.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const current = el.value;
      while (el.options.length > 1) el.remove(1);
      res.data.forEach(d => {
        const opt = new Option(d.name, d.id);
        el.add(opt);
      });
      el.value = current;
    });

    renderDepartments(res.data);
  } catch (err) {
    console.error('Dept load error:', err);
  }
}

function renderDepartments(depts) {
  const grid = document.getElementById('deptsGrid');
  if (!grid) return;
  if (!depts.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px">No departments found</p>';
    return;
  }
  grid.innerHTML = depts.map(d => `
    <div class="dept-card">
      <span class="dept-code">${d.code}</span>
      <div class="dept-name">${d.name}</div>
      <div class="dept-meta">
        ${d.head_of_dept ? `<i class="fas fa-user-tie"></i> ${d.head_of_dept}<br/>` : ''}
        ${d.description || ''}
      </div>
      <div class="dept-stats">
        <div class="dept-stat"><strong>${d.student_count || 0}</strong><span>Students</span></div>
        <div class="dept-stat"><strong>${d.course_count || 0}</strong><span>Courses</span></div>
      </div>
      <div class="card-actions">
        <button class="btn-sm" onclick="openDeptModal(${d.id})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="btn-sm danger" onclick="confirmDelete('dept',${d.id},'${d.name}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

async function openDeptModal(id = null) {
  state.editingDeptId = id;
  document.getElementById('deptModalTitle').textContent = id ? 'Edit Department' : 'Add Department';
  document.getElementById('deptForm').reset();

  if (id) {
    const dept = state.departments.find(d => d.id === id);
    if (dept) {
      document.getElementById('deptId').value = dept.id;
      document.getElementById('dName').value  = dept.name || '';
      document.getElementById('dCode').value  = dept.code || '';
      document.getElementById('dHead').value  = dept.head_of_dept || '';
      document.getElementById('dDesc').value  = dept.description || '';
    }
  }
  openModal('deptModal');
}

async function saveDept() {
  const body = {
    name: document.getElementById('dName').value.trim(),
    code: document.getElementById('dCode').value.trim(),
    head_of_dept: document.getElementById('dHead').value.trim(),
    description: document.getElementById('dDesc').value.trim(),
  };
  if (!body.name || !body.code) { showToast('Name and code are required', 'error'); return; }

  try {
    if (state.editingDeptId) {
      await api(`/departments/${state.editingDeptId}`, 'PUT', body);
      showToast('Department updated!', 'success');
    } else {
      await api('/departments', 'POST', body);
      showToast('Department created!', 'success');
    }
    closeModal('deptModal');
    loadDepartments();
  } catch (err) {
    showToast(err.message || 'Failed to save department', 'error');
  }
}

// ── Courses ───────────────────────────────────────────────
async function loadCourses() {
  await loadDepartments(); // ensure depts loaded
  try {
    const deptId = document.getElementById('courseDeptFilter').value;
    const res = await api(`/courses${deptId ? '?department=' + deptId : ''}`);
    state.courses = res.data;
    renderCourses(res.data);
  } catch (err) {
    console.error('Courses load error:', err);
  }
}

function renderCourses(courses) {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;

  const search = document.getElementById('courseSearch').value.toLowerCase();
  const filtered = courses.filter(c =>
    !search || c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search)
  );

  if (!filtered.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px">No courses found</p>';
    return;
  }

  grid.innerHTML = filtered.map(c => `
    <div class="course-card">
      <span class="dept-code">${c.code}</span>
      <div class="course-name">${c.name}</div>
      <div class="course-meta">
        <i class="fas fa-building-columns"></i> ${c.department_name}<br/>
        <i class="fas fa-user-tie"></i> ${c.instructor || 'TBD'}<br/>
        <i class="fas fa-star"></i> ${c.credits} Credits &nbsp;|&nbsp;
        <i class="fas fa-users"></i> ${c.enrolled_count || 0}/${c.max_students}
      </div>
      <div class="card-actions">
        <button class="btn-sm" onclick="openCourseModal(${c.id})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="btn-sm danger" onclick="confirmDelete('course',${c.id},'${c.name}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

document.getElementById('courseSearch').addEventListener('input', function () {
  renderCourses(state.courses);
});
document.getElementById('courseDeptFilter').addEventListener('change', loadCourses);

async function openCourseModal(id = null) {
  state.editingCourseId = id;
  document.getElementById('courseModalTitle').textContent = id ? 'Edit Course' : 'Add Course';
  document.getElementById('courseForm').reset();
  await loadDepartmentsIntoSelect('cDept');

  if (id) {
    const c = state.courses.find(c => c.id === id);
    if (c) {
      document.getElementById('courseId').value = c.id;
      document.getElementById('cName').value     = c.name || '';
      document.getElementById('cCode').value     = c.code || '';
      document.getElementById('cDept').value     = c.department_id || '';
      document.getElementById('cCredits').value  = c.credits || 3;
      document.getElementById('cInstructor').value = c.instructor || '';
      document.getElementById('cMax').value      = c.max_students || 50;
    }
  }
  openModal('courseModal');
}

async function saveCourse() {
  const body = {
    name: document.getElementById('cName').value.trim(),
    code: document.getElementById('cCode').value.trim(),
    department_id: document.getElementById('cDept').value,
    credits: document.getElementById('cCredits').value,
    instructor: document.getElementById('cInstructor').value.trim(),
    max_students: document.getElementById('cMax').value,
  };
  if (!body.name || !body.code || !body.department_id) {
    showToast('Name, code, and department are required', 'error');
    return;
  }

  try {
    if (state.editingCourseId) {
      await api(`/courses/${state.editingCourseId}`, 'PUT', body);
      showToast('Course updated!', 'success');
    } else {
      await api('/courses', 'POST', body);
      showToast('Course created!', 'success');
    }
    closeModal('courseModal');
    loadCourses();
  } catch (err) {
    showToast(err.message || 'Failed to save course', 'error');
  }
}

// ── Delete Confirmation ──────────────────────────────────
function confirmDelete(type, id, name) {
  const msgs = {
    student: `Delete student "${name}"? All enrollments and fee records will also be deleted.`,
    dept:    `Delete department "${name}"? This will fail if students are assigned to it.`,
    course:  `Delete course "${name}"? This will fail if students are enrolled.`,
  };
  document.getElementById('confirmMsg').textContent = msgs[type];

  state.deleteCallback = async () => {
    try {
      const endpoints = { student: `/students/${id}`, dept: `/departments/${id}`, course: `/courses/${id}` };
      await api(endpoints[type], 'DELETE');
      showToast(`${name} deleted successfully`, 'success');
      closeModal('confirmModal');
      if (type === 'student') loadStudents();
      else if (type === 'dept') loadDepartments();
      else loadCourses();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
      closeModal('confirmModal');
    }
  };

  document.getElementById('confirmDeleteBtn').onclick = state.deleteCallback;
  openModal('confirmModal');
}

// ── Reports / Charts ─────────────────────────────────────
async function loadReports() {
  try {
    const res = await api('/students/stats');
    const { totals, byDept } = res.data;

    // GPA Distribution (simulated bins)
    const gpaCtx = document.getElementById('gpaChart');
    if (gpaCtx) {
      if (state.charts.gpa) state.charts.gpa.destroy();
      state.charts.gpa = new Chart(gpaCtx, {
        type: 'bar',
        data: {
          labels: ['0.0-1.0','1.0-2.0','2.0-2.5','2.5-3.0','3.0-3.5','3.5-4.0'],
          datasets: [{
            label: 'Students',
            data: [0, 0, 1, 2, 3, 3],
            backgroundColor: 'rgba(0,212,255,0.6)',
            borderColor: 'rgba(0,212,255,1)',
            borderWidth: 2, borderRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94aab8' } } },
          scales: {
            x: { ticks: { color: '#94aab8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#94aab8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          },
        },
      });
    }

    // Status breakdown
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
      if (state.charts.status) state.charts.status.destroy();
      state.charts.status = new Chart(statusCtx, {
        type: 'pie',
        data: {
          labels: ['Active','Graduated','Inactive','Suspended'],
          datasets: [{
            data: [totals.active_students||0, totals.graduated_students||0, totals.inactive_students||0, 0],
            backgroundColor: ['#22c55e','#00d4ff','#94a3b8','#ef4444'],
            borderColor: '#111827', borderWidth: 3,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: '#94aab8', padding: 10, font: { size: 11 } } } },
        },
      });
    }

    // Enrollment trend
    const enrollCtx = document.getElementById('enrollChart');
    if (enrollCtx) {
      if (state.charts.enroll) state.charts.enroll.destroy();
      state.charts.enroll = new Chart(enrollCtx, {
        type: 'line',
        data: {
          labels: ['2020','2021','2022','2023','2024','2025'],
          datasets: [{
            label: 'New Enrollments',
            data: [12, 19, 28, 35, 42, 8],
            borderColor: '#f5c842', backgroundColor: 'rgba(245,200,66,0.1)',
            tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: '#f5c842',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94aab8' } } },
          scales: {
            x: { ticks: { color: '#94aab8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#94aab8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          },
        },
      });
    }

  } catch (err) {
    console.error('Reports error:', err);
  }
}

// ── Modal Utilities ──────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  document.body.style.overflow = '';
}
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function (e) {
    if (e.target === this) closeModal(this.id);
  });
});

// Form Tabs
function resetFormTabs() {
  document.querySelectorAll('.form-tab').forEach((t, i) => {
    t.classList.toggle('active', i === 0);
  });
  document.querySelectorAll('.tab-content').forEach((c, i) => {
    c.classList.toggle('active', i === 0);
  });
}
function switchTab(tabName) {
  document.querySelectorAll('.form-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('active', c.id === `tab-${tabName}`);
  });
}
document.querySelectorAll('.form-tab').forEach(btn => {
  btn.addEventListener('click', function () {
    switchTab(this.dataset.tab);
  });
});

async function loadDepartmentsIntoSelect(selectId) {
  if (!state.departments.length) {
    const res = await api('/departments');
    state.departments = res.data;
  }
  const sel = document.getElementById(selectId);
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);
  state.departments.forEach(d => sel.add(new Option(d.name, d.id)));
}

// ── Chatbot ───────────────────────────────────────────────
function toggleChat() {
  const panel = document.getElementById('chatbotPanel');
  panel.classList.toggle('open');
}

function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  input.value = '';
  appendChatMsg(msg, 'user');
  showTyping();

  try {
    const res = await api('/chatbot/chat', 'POST', { message: msg });
    hideTyping();
    appendChatMsg(res.reply, 'bot');
  } catch (err) {
    hideTyping();
    appendChatMsg('Sorry, I encountered an error. Please try again.', 'bot');
  }
}

function appendChatMsg(text, role) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  div.innerHTML = `
    <div class="msg-bubble">${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')}</div>
    <span class="msg-time">${time}</span>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.id = 'typingIndicator';
  div.innerHTML = `<div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
function hideTyping() {
  document.getElementById('typingIndicator')?.remove();
}

// ── Sidebar ───────────────────────────────────────────────
document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
});
document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
document.getElementById('overlay').addEventListener('click', closeSidebar);
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', function () {
    navigate(this.dataset.page);
  });
});

document.getElementById('chatToggleNav').addEventListener('click', function () {
  toggleChat();
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  this.classList.add('active');
  closeSidebar();
});

// ── Toast Notifications ──────────────────────────────────
function showToast(message, type = 'info') {
  const icons = { success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', info: 'fas fa-info-circle' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="${icons[type]} toast-icon"></i><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Keyboard Shortcuts ───────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => closeModal(m.id));
  }
});

// ── Init ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Hide loader after delay
  setTimeout(() => {
    document.getElementById('page-loader').classList.add('hidden');
  }, 2200);

  // Load departments for selects
  await loadDepartments();

  // Boot dashboard
  navigate('dashboard');
});
