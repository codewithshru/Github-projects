/* ================================================================
   STUDENT MANAGEMENT SYSTEM - script.js
   Beginner-friendly vanilla JavaScript
   Data is stored in the browser using localStorage
================================================================ */

/* ----------------------------------------------------------------
   1. DATA STORAGE
   We keep three arrays in memory:
   - students          -> list of student objects
   - attendanceRecords  -> one attendance record per student
   - marksRecords        -> one marks record per student
   Each array is saved to localStorage every time it changes.
---------------------------------------------------------------- */
let students = [];
let attendanceRecords = [];
let marksRecords = [];

// Load any previously saved data as soon as the script runs
loadFromLocalStorage();

/* ----------------------------------------------------------------
   2. LOCAL STORAGE HELPERS
---------------------------------------------------------------- */
function loadFromLocalStorage() {
    const savedStudents = localStorage.getItem("sms_students");
    const savedAttendance = localStorage.getItem("sms_attendance");
    const savedMarks = localStorage.getItem("sms_marks");

    students = savedStudents ? JSON.parse(savedStudents) : [];
    attendanceRecords = savedAttendance ? JSON.parse(savedAttendance) : [];
    marksRecords = savedMarks ? JSON.parse(savedMarks) : [];
}

function saveStudents() {
    localStorage.setItem("sms_students", JSON.stringify(students));
}

function saveAttendance() {
    localStorage.setItem("sms_attendance", JSON.stringify(attendanceRecords));
}

function saveMarks() {
    localStorage.setItem("sms_marks", JSON.stringify(marksRecords));
}

/* ----------------------------------------------------------------
   3. NAVIGATION (Sidebar switching between pages)
---------------------------------------------------------------- */
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");

navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        // Remove "active" class from all buttons and pages
        navButtons.forEach((b) => b.classList.remove("active"));
        pages.forEach((p) => p.classList.remove("active"));

        // Activate the clicked button and matching page
        btn.classList.add("active");
        const targetPage = document.getElementById(btn.dataset.section);
        targetPage.classList.add("active");

        // Close sidebar on mobile after selecting a page
        sidebar.classList.remove("open");

        // Refresh dropdowns whenever the user visits Attendance or Marks
        if (btn.dataset.section === "attendance" || btn.dataset.section === "marks") {
            populateStudentDropdowns();
        }
    });
});

menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

/* ----------------------------------------------------------------
   4. STUDENT FORM ELEMENTS
---------------------------------------------------------------- */
const studentForm = document.getElementById("studentForm");
const editIndexInput = document.getElementById("editIndex");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const studentIdInput = document.getElementById("studentId");
const studentNameInput = document.getElementById("studentName");
const studentEmailInput = document.getElementById("studentEmail");
const studentPhoneInput = document.getElementById("studentPhone");
const studentDeptInput = document.getElementById("studentDept");
const studentCourseInput = document.getElementById("studentCourse");
const studentSemesterInput = document.getElementById("studentSemester");

/* ----------------------------------------------------------------
   5. VALIDATION HELPERS
   Each function returns true if the value is valid,
   and shows an error message next to the field if not.
---------------------------------------------------------------- */
function showError(fieldId, message) {
    document.getElementById("err-" + fieldId).textContent = message;
}

function clearErrors(ids) {
    ids.forEach((id) => showError(id, ""));
}

function isValidEmail(email) {
    // Simple pattern: something@something.something
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

function isValidPhone(phone) {
    // Accept 10 digit numbers only
    const pattern = /^[0-9]{10}$/;
    return pattern.test(phone);
}

/* Validates the Add/Edit Student form. Returns true if all fields are OK. */
function validateStudentForm(idBeingEdited) {
    let isValid = true;
    clearErrors([
        "studentId", "studentName", "studentEmail",
        "studentPhone", "studentDept", "studentCourse", "studentSemester"
    ]);

    const id = studentIdInput.value.trim();
    const name = studentNameInput.value.trim();
    const email = studentEmailInput.value.trim();
    const phone = studentPhoneInput.value.trim();
    const dept = studentDeptInput.value;
    const course = studentCourseInput.value;
    const semester = studentSemesterInput.value;

    if (id === "") {
        showError("studentId", "Student ID cannot be empty.");
        isValid = false;
    } else {
        // Check for duplicate Student ID (ignore the student currently being edited)
        const duplicate = students.find((s, index) => s.id === id && index !== idBeingEdited);
        if (duplicate) {
            showError("studentId", "This Student ID already exists.");
            isValid = false;
        }
    }

    if (name === "") {
        showError("studentName", "Name cannot be empty.");
        isValid = false;
    }

    if (!isValidEmail(email)) {
        showError("studentEmail", "Enter a valid email address.");
        isValid = false;
    }

    if (!isValidPhone(phone)) {
        showError("studentPhone", "Phone must be exactly 10 digits.");
        isValid = false;
    }

    if (dept === "") {
        showError("studentDept", "Please select a department.");
        isValid = false;
    }

    if (course === "") {
        showError("studentCourse", "Please select a course.");
        isValid = false;
    }

    if (semester === "") {
        showError("studentSemester", "Please select a semester.");
        isValid = false;
    }

    return isValid;
}

/* ----------------------------------------------------------------
   6. ADD / EDIT STUDENT (Form Submit)
---------------------------------------------------------------- */
studentForm.addEventListener("submit", function (e) {
    e.preventDefault(); // stop the page from refreshing

    // editIndex is empty string when adding a new student,
    // or a number (as string) when editing an existing one.
    const editIndex = editIndexInput.value === "" ? -1 : parseInt(editIndexInput.value);

    if (!validateStudentForm(editIndex)) {
        return; // stop here if validation failed
    }

    const studentData = {
        id: studentIdInput.value.trim(),
        name: studentNameInput.value.trim(),
        email: studentEmailInput.value.trim(),
        phone: studentPhoneInput.value.trim(),
        dept: studentDeptInput.value,
        course: studentCourseInput.value,
        semester: studentSemesterInput.value
    };

    if (editIndex === -1) {
        // Adding a brand new student
        students.push(studentData);
    } else {
        // Updating an existing student
        students[editIndex] = studentData;
    }

    saveStudents();
    resetStudentForm();
    renderStudentsTable();
    updateDashboard();
    populateStudentDropdowns();
});

/* Resets the form back to "Add Student" mode */
function resetStudentForm() {
    studentForm.reset();
    editIndexInput.value = "";
    submitBtn.textContent = "Add Student";
    cancelEditBtn.style.display = "none";
    clearErrors([
        "studentId", "studentName", "studentEmail",
        "studentPhone", "studentDept", "studentCourse", "studentSemester"
    ]);
}

cancelEditBtn.addEventListener("click", resetStudentForm);

/* ----------------------------------------------------------------
   7. RENDER STUDENTS TABLE
---------------------------------------------------------------- */
const studentsTableBody = document.getElementById("studentsTableBody");
const noStudentsMsg = document.getElementById("noStudentsMsg");

function renderStudentsTable(list) {
    // If no filtered list is passed in, show all students
    const dataToShow = list || students;

    studentsTableBody.innerHTML = ""; // clear existing rows

    if (dataToShow.length === 0) {
        noStudentsMsg.style.display = "block";
        return;
    }
    noStudentsMsg.style.display = "none";

    dataToShow.forEach((student) => {
        // Find the real index in the main "students" array (needed for edit/delete)
        const realIndex = students.findIndex((s) => s.id === student.id);

        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.email}</td>
      <td>${student.phone}</td>
      <td>${student.dept}</td>
      <td>${student.course}</td>
      <td>${student.semester}</td>
      <td>
        <button class="btn-edit" onclick="editStudent(${realIndex})">Edit</button>
        <button class="btn-delete" onclick="deleteStudent(${realIndex})">Delete</button>
      </td>
    `;
        studentsTableBody.appendChild(row);
    });
}

/* ----------------------------------------------------------------
   8. EDIT STUDENT
---------------------------------------------------------------- */
function editStudent(index) {
    const student = students[index];

    studentIdInput.value = student.id;
    studentNameInput.value = student.name;
    studentEmailInput.value = student.email;
    studentPhoneInput.value = student.phone;
    studentDeptInput.value = student.dept;
    studentCourseInput.value = student.course;
    studentSemesterInput.value = student.semester;

    editIndexInput.value = index;
    submitBtn.textContent = "Update Student";
    cancelEditBtn.style.display = "inline-block";

    // Scroll up to the form so the user can see it
    studentForm.scrollIntoView({ behavior: "smooth" });
}

/* ----------------------------------------------------------------
   9. DELETE STUDENT
---------------------------------------------------------------- */
function deleteStudent(index) {
    const student = students[index];
    const confirmDelete = confirm(`Delete student "${student.name}" (${student.id})?`);
    if (!confirmDelete) return;

    // Remove the student
    students.splice(index, 1);
    saveStudents();

    // Also remove any related attendance/marks records for that student
    attendanceRecords = attendanceRecords.filter((r) => r.studentId !== student.id);
    marksRecords = marksRecords.filter((r) => r.studentId !== student.id);
    saveAttendance();
    saveMarks();

    renderStudentsTable();
    renderAttendanceTable();
    renderMarksTable();
    updateDashboard();
    populateStudentDropdowns();
}

/* ----------------------------------------------------------------
   10. SEARCH STUDENTS
---------------------------------------------------------------- */
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function () {
    const term = searchInput.value.trim().toLowerCase();

    if (term === "") {
        renderStudentsTable();
        return;
    }

    const filtered = students.filter((s) =>
        s.name.toLowerCase().includes(term) ||
        s.id.toLowerCase().includes(term) ||
        s.dept.toLowerCase().includes(term)
    );

    renderStudentsTable(filtered);
});

/* ----------------------------------------------------------------
   11. DASHBOARD STATISTICS
---------------------------------------------------------------- */
function updateDashboard() {
    document.getElementById("totalStudents").textContent = students.length;

    // Use a Set to count only unique course/department names
    const uniqueCourses = new Set(students.map((s) => s.course).filter(Boolean));
    const uniqueDepartments = new Set(students.map((s) => s.dept).filter(Boolean));

    document.getElementById("totalCourses").textContent = uniqueCourses.size;
    document.getElementById("totalDepartments").textContent = uniqueDepartments.size;

    // Average attendance across all saved attendance records
    if (attendanceRecords.length === 0) {
        document.getElementById("avgAttendance").textContent = "0%";
    } else {
        const total = attendanceRecords.reduce((sum, r) => sum + r.percentage, 0);
        const average = (total / attendanceRecords.length).toFixed(1);
        document.getElementById("avgAttendance").textContent = average + "%";
    }
}

/* ----------------------------------------------------------------
   12. POPULATE STUDENT DROPDOWNS (used in Attendance & Marks forms)
---------------------------------------------------------------- */
function populateStudentDropdowns() {
    const attendanceDropdown = document.getElementById("attendanceStudent");
    const marksDropdown = document.getElementById("marksStudent");

    // Build the option list once, reuse for both dropdowns
    let optionsHtml = '<option value="">-- Select Student --</option>';
    students.forEach((s) => {
        optionsHtml += `<option value="${s.id}">${s.id} - ${s.name}</option>`;
    });

    attendanceDropdown.innerHTML = optionsHtml;
    marksDropdown.innerHTML = optionsHtml;
}

/* ----------------------------------------------------------------
   13. ATTENDANCE SECTION
---------------------------------------------------------------- */
const attendanceForm = document.getElementById("attendanceForm");
const attendanceResult = document.getElementById("attendanceResult");
const attendanceResultText = document.getElementById("attendanceResultText");

attendanceForm.addEventListener("submit", function (e) {
    e.preventDefault();

    clearErrors(["attendanceStudent", "totalClasses", "attendedClasses"]);

    const studentId = document.getElementById("attendanceStudent").value;
    const total = document.getElementById("totalClasses").value.trim();
    const attended = document.getElementById("attendedClasses").value.trim();

    let isValid = true;

    if (studentId === "") {
        showError("attendanceStudent", "Please select a student.");
        isValid = false;
    }

    if (total === "" || Number(total) < 0) {
        showError("totalClasses", "Enter a valid number of total classes.");
        isValid = false;
    }

    if (attended === "" || Number(attended) < 0) {
        showError("attendedClasses", "Enter a valid number of attended classes.");
        isValid = false;
    }

    if (isValid && Number(attended) > Number(total)) {
        showError("attendedClasses", "Attended classes cannot exceed total classes.");
        isValid = false;
    }

    if (!isValid) return;

    const totalNum = Number(total);
    const attendedNum = Number(attended);
    const percentage = totalNum === 0 ? 0 : ((attendedNum / totalNum) * 100).toFixed(2);

    const student = students.find((s) => s.id === studentId);

    const record = {
        studentId: student.id,
        name: student.name,
        total: totalNum,
        attended: attendedNum,
        percentage: parseFloat(percentage)
    };

    // Replace any existing record for this student, otherwise add a new one
    const existingIndex = attendanceRecords.findIndex((r) => r.studentId === studentId);
    if (existingIndex === -1) {
        attendanceRecords.push(record);
    } else {
        attendanceRecords[existingIndex] = record;
    }

    saveAttendance();
    renderAttendanceTable();
    updateDashboard();

    // Show a friendly result message
    attendanceResult.style.display = "block";
    attendanceResultText.textContent =
        `${student.name} (${student.id}) attended ${attendedNum} out of ${totalNum} classes -> ${percentage}% attendance.`;

    attendanceForm.reset();
});

function renderAttendanceTable() {
    const tbody = document.getElementById("attendanceTableBody");
    const noMsg = document.getElementById("noAttendanceMsg");

    tbody.innerHTML = "";

    if (attendanceRecords.length === 0) {
        noMsg.style.display = "block";
        return;
    }
    noMsg.style.display = "none";

    attendanceRecords.forEach((r) => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${r.studentId}</td>
      <td>${r.name}</td>
      <td>${r.total}</td>
      <td>${r.attended}</td>
      <td>${r.percentage}%</td>
    `;
        tbody.appendChild(row);
    });
}

/* ----------------------------------------------------------------
   14. MARKS SECTION
---------------------------------------------------------------- */
const marksForm = document.getElementById("marksForm");
const marksResult = document.getElementById("marksResult");
const marksResultText = document.getElementById("marksResultText");

/* Converts a percentage into a letter grade based on the fixed scale */
function calculateGrade(percentage) {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "F";
}

marksForm.addEventListener("submit", function (e) {
    e.preventDefault();

    clearErrors(["marksStudent", "marksMath", "marksDBMS", "marksOS", "marksCN"]);

    const studentId = document.getElementById("marksStudent").value;
    const mathVal = document.getElementById("marksMath").value.trim();
    const dbmsVal = document.getElementById("marksDBMS").value.trim();
    const osVal = document.getElementById("marksOS").value.trim();
    const cnVal = document.getElementById("marksCN").value.trim();

    let isValid = true;

    if (studentId === "") {
        showError("marksStudent", "Please select a student.");
        isValid = false;
    }

    // Reusable check: marks must be a number between 0 and 100
    function checkMark(value, fieldId) {
        if (value === "" || Number(value) < 0 || Number(value) > 100) {
            showError(fieldId, "Enter marks between 0 and 100.");
            isValid = false;
        }
    }

    checkMark(mathVal, "marksMath");
    checkMark(dbmsVal, "marksDBMS");
    checkMark(osVal, "marksOS");
    checkMark(cnVal, "marksCN");

    if (!isValid) return;

    const math = Number(mathVal);
    const dbms = Number(dbmsVal);
    const os = Number(osVal);
    const cn = Number(cnVal);

    const total = math + dbms + os + cn;
    const percentage = (total / 4).toFixed(2);
    const grade = calculateGrade(percentage);

    const student = students.find((s) => s.id === studentId);

    const record = {
        studentId: student.id,
        name: student.name,
        math, dbms, os, cn,
        total,
        percentage: parseFloat(percentage),
        grade
    };

    const existingIndex = marksRecords.findIndex((r) => r.studentId === studentId);
    if (existingIndex === -1) {
        marksRecords.push(record);
    } else {
        marksRecords[existingIndex] = record;
    }

    saveMarks();
    renderMarksTable();

    marksResult.style.display = "block";
    marksResultText.textContent =
        `${student.name} (${student.id}) scored ${total}/400 (${percentage}%) -> Grade: ${grade}`;

    marksForm.reset();
});

function renderMarksTable() {
    const tbody = document.getElementById("marksTableBody");
    const noMsg = document.getElementById("noMarksMsg");

    tbody.innerHTML = "";

    if (marksRecords.length === 0) {
        noMsg.style.display = "block";
        return;
    }
    noMsg.style.display = "none";

    marksRecords.forEach((r) => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${r.studentId}</td>
      <td>${r.name}</td>
      <td>${r.math}</td>
      <td>${r.dbms}</td>
      <td>${r.os}</td>
      <td>${r.cn}</td>
      <td>${r.total}</td>
      <td>${r.percentage}%</td>
      <td>${r.grade}</td>
    `;
        tbody.appendChild(row);
    });
}

/* ----------------------------------------------------------------
   15. INITIAL PAGE LOAD
   Render everything using the data already loaded from localStorage
---------------------------------------------------------------- */
renderStudentsTable();
renderAttendanceTable();
renderMarksTable();
updateDashboard();
populateStudentDropdowns();
