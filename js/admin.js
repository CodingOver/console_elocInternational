// ========================
// Updated admin.js
// ========================
import { arrayUnion } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc ,query, where} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { db, auth } from "./firebase.js";


// GLOBAL VARIABLES
let teachers = [];
let students = [];
let editingStudentId = null;
let editingSessionId = null;
let currentOpenTeacherId = null;
let editingSessionTeacherId = null;

// ------------------------
// ADMIN LOGIN
// ------------------------
document.addEventListener('DOMContentLoaded', function () {
    // Check login status and fetch data
    if (!sessionStorage.getItem("adminLoggedIn")) {
        document.getElementById("admin-login-modal").style.display = "flex";
        document.querySelector(".app-container").style.display = "none";
    } else {
        document.getElementById("admin-login-modal").style.display = "none";
        document.querySelector(".app-container").style.display = "block";
    }
    fetchTeachers();
    fetchStudents();

    var modeSwitch = document.querySelector('.mode-switch');
    modeSwitch.addEventListener('click', function () {                     
        document.documentElement.classList.toggle('dark');
        modeSwitch.classList.toggle('active');
    });

    // Attach the event listener to the "Add New Teacher" button
    const openDrawerBtn = document.getElementById("openDrawerBtn");
    if (openDrawerBtn) {
        openDrawerBtn.addEventListener("click", openDrawer);
    }

    // Attach the event listener to the close overlay for the teacher drawer
    const overlay = document.getElementById("overlay");
    if (overlay) {
        overlay.addEventListener("click", closeDrawer);
    }

    // Attach the event listener to the "Add New Student" button
    const studentDrawerBtn = document.getElementById("openStudentDrawerBtn");
    if (studentDrawerBtn) {
        studentDrawerBtn.addEventListener("click", openStudentDrawer);
    }

    // Attach the event listener to the "close Student Drawer" button
    const studentOverlay = document.getElementById("student-overlay");
    if (studentOverlay) {
        studentOverlay.addEventListener("click", closeStudentDrawer);
    }

});


// ------------------------
// FETCH FUNCTIONS FROM FIRESTORE
// ------------------------
async function fetchTeachers() {
try {
    const querySnapshot = await getDocs(collection(db, "teachers"));
    teachers = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderTeacherSection();
    updateTeacherDropdown();
    updateDashboardCards();
} catch (err) {
    console.error("Error fetching teachers:", err);
}
}

async function fetchStudents() {
try {
    const querySnapshot = await getDocs(collection(db, "students"));
    students = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderStudentTable();
    renderStudentCheckboxes();
    updateDashboardCards();
} catch (err) {
    console.error("Error fetching students:", err);
}
}

// ------------------------
// ADMIN LOGIN FUNCTION (Hard-coded for demo)
// ------------------------
function adminLogin() {
    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value.trim();
    
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        sessionStorage.setItem("adminLoggedIn", true);
        // Hide the login modal
        document.getElementById("admin-login-modal").style.display = "none";
        // Hide any leftover overlay elements
        document.getElementById("overlay").style.display = "none";
        document.getElementById("student-overlay").style.display = "none";
        document.getElementById("session-overlay").style.display = "none";
        // Show the app container
        document.querySelector(".app-container").style.display = "block";
        
        // Optionally remove the login modal from the DOM:
        // document.getElementById("admin-login-modal").remove();
        document.querySelectorAll(".drawer-overlay, .teacher-session-overlay").forEach(el => el.style.display = "none");
        document.body.style.overflow = "auto"; // Ensure scrolling works
        document.body.style.pointerEvents = "auto"; // Re-enable clicks

        fetchTeachers();
        fetchStudents();
    })
    .catch((error) => {
        alert("Admin login failed: " + error.message);
    });
}

// Expose the function to the global scope so inline onclick works.
window.adminLogin = adminLogin;

// ------------------------
// DRAWER FUNCTIONS (unchanged)
// ------------------------
function openDrawer() {
document.getElementById("drawer").classList.add("open");
document.getElementById("overlay").style.display = "block";
}
// Expose the function globally
window.openDrawer = openDrawer;

function closeDrawer() {
document.getElementById("drawer").classList.remove("open");
document.getElementById("overlay").style.display = "none";
}
// Expose closeDrawer globally so that inline onclick can access it.
window.closeDrawer = closeDrawer;


function openStudentDrawer() {
document.getElementById("student-drawer").classList.add("open");
document.getElementById("student-overlay").style.display = "block";
}
// Expose the function globally so inline handlers can access it
window.openStudentDrawer = openStudentDrawer;


function closeStudentDrawer() {
document.getElementById("student-drawer").classList.remove("open");
document.getElementById("student-overlay").style.display = "none";
}
window.closeStudentDrawer = closeStudentDrawer;


function openSessionDrawer() {
const sessionDrawer = document.getElementById("session-drawer");
sessionDrawer.classList.add("open");
sessionDrawer.style.zIndex = "1100";
document.getElementById("session-overlay").style.display = "block";
}
window.openSessionDrawer = openSessionDrawer;

function closeSessionDrawer() {
document.getElementById("session-drawer").classList.remove("open");
document.getElementById("session-overlay").style.display = "none";
}
window.closeSessionDrawer = closeSessionDrawer;

// ------------------------
// SAVE TEACHER FUNCTION (Firestore version)
// ------------------------
async function saveTeacher() {
    const name = document.getElementById("name").value;
    const dob = document.getElementById("dob").value;
    const level = document.getElementById("level").value;
    const gender = document.getElementById("gender").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!name || !dob || !level || !gender || !email || !password) {
    alert("Please fill in all fields.");
    return;
    }

    try {
    // Step 1: Create the teacher account in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const teacherUid = userCredential.user.uid;

    // Prepare teacher data (excluding the password for security reasons)
    const teacherData = {
        name,
        dob,
        level,
        gender,
        email,
        sessions: { group: [], individual: [] }
    };

    // Step 2: Store teacher data in Firestore using the teacher's UID as the document ID
    await setDoc(doc(db, "teachers", teacherUid), teacherData);

    // Update local data and UI
    teacherData.id = teacherUid;
    teachers.push(teacherData);
    renderTeacherSection();
    updateTeacherDropdown();
    updateDashboardCards();
    closeDrawer();

    } catch (error) {
    console.error("Error adding teacher:", error);
    alert("Error creating teacher: " + error.message);
    }
}  
// Make sure to expose the function if needed
window.saveTeacher = saveTeacher;


// ------------------------
// SAVE/UPDATE SESSION FUNCTION (Firestore version)
// ------------------------
async function saveSession() {
    const title = document.getElementById("session-name").value;
    const url = document.getElementById("url").value;
    const newTeacherId = document.getElementById("teacher-session").value;
    const newType = document.getElementById("type").value; // session type from form
    const level = document.getElementById("session-level").value;
    const selectedStudents = Array.from(document.querySelectorAll('#student-checkboxes input[name="students"]:checked')).map(el => {
        const student = students.find(s => s.id === el.value);
        return student ? { id: student.id, name: student.name } : null;
    }).filter(s => s);
    
    const selectedDays = Array.from(document.querySelectorAll('#checkbox-days input[name="sessionDays"]:checked')).map(el => el.value);
    const startTime = document.getElementById("session-start-time").value;
    const endTime = document.getElementById("session-end-time").value;

    if (!title || !url || !newTeacherId || !newType || !level || selectedDays.length === 0 || !startTime || !endTime) {
        alert("Please fill in all required fields in the session form.");
        return;
    }
    
    // Prepare the new session data.
    let sessionData = {
        title,
        url,
        level,
        days: selectedDays,
        startTime,
        endTime,
        type: newType, 
        students: selectedStudents,
        participantsCount: newType === "group" ? 12 : 1
    };
    
    try {
        if (editingSessionId) {
            // We're editing an existing session.
            sessionData.id = editingSessionId;

            // Check if the teacher assignment has changed.
            if (editingSessionTeacherId && editingSessionTeacherId !== newTeacherId) {
                // Remove the session from the original teacher's document.
                let originalTeacherDocRef = doc(db, "teachers", editingSessionTeacherId);
                let originalTeacherSnap = await getDoc(originalTeacherDocRef);
                if (originalTeacherSnap.exists()) {
                    let originalTeacherData = originalTeacherSnap.data();
                    let oldType = null;
                    if (originalTeacherData.sessions && Array.isArray(originalTeacherData.sessions.group) &&
                        originalTeacherData.sessions.group.some(s => s.id === editingSessionId)) {
                        oldType = "group";
                    }
                    if (!oldType && originalTeacherData.sessions && Array.isArray(originalTeacherData.sessions.individual) &&
                        originalTeacherData.sessions.individual.some(s => s.id === editingSessionId)) {
                        oldType = "individual";
                    }
                    if (oldType) {
                        originalTeacherData.sessions[oldType] = originalTeacherData.sessions[oldType].filter(s => s.id !== editingSessionId);
                        await updateDoc(originalTeacherDocRef, {
                            ["sessions." + oldType]: originalTeacherData.sessions[oldType]
                        });
                    }
                }

                // Now, add the session to the new teacher's document.
                let newTeacherDocRef = doc(db, "teachers", newTeacherId);
                let newTeacherSnap = await getDoc(newTeacherDocRef);
                if (!newTeacherSnap.exists()) {
                    alert("New teacher document not found.");
                    return;
                }
                let newTeacherData = newTeacherSnap.data();
                if (!newTeacherData.sessions) {
                    newTeacherData.sessions = { group: [], individual: [] };
                }
                if (!newTeacherData.sessions[newType]) {
                    newTeacherData.sessions[newType] = [];
                }
                newTeacherData.sessions[newType].push(sessionData);
                await updateDoc(newTeacherDocRef, {
                    ["sessions." + newType]: newTeacherData.sessions[newType]
                });
            } else {
                // Teacher assignment did not change—update within the same document.
                const teacherDocRef = doc(db, "teachers", newTeacherId);
                const teacherDocSnap = await getDoc(teacherDocRef);
                if (!teacherDocSnap.exists()) {
                    alert("Teacher document not found.");
                    return;
                }
                let teacherData = teacherDocSnap.data();
                let oldType = null;
                let oldIndex = -1;
                if (teacherData.sessions && Array.isArray(teacherData.sessions.group)) {
                    oldIndex = teacherData.sessions.group.findIndex(s => s.id === editingSessionId);
                    if (oldIndex > -1) oldType = "group";
                }
                if (oldType === null && teacherData.sessions && Array.isArray(teacherData.sessions.individual)) {
                    oldIndex = teacherData.sessions.individual.findIndex(s => s.id === editingSessionId);
                    if (oldIndex > -1) oldType = "individual";
                }
                if (oldType === null) {
                    alert("Session not found in teacher document.");
                    return;
                }

                if (oldType !== newType) {
                    teacherData.sessions[oldType] = teacherData.sessions[oldType].filter(s => s.id !== editingSessionId);
                    if (!teacherData.sessions[newType]) {
                        teacherData.sessions[newType] = [];
                    }
                    teacherData.sessions[newType].push(sessionData);
                } else {
                    teacherData.sessions[oldType][oldIndex] = sessionData;
                }

                let updateData = {};
                updateData["sessions.group"] = teacherData.sessions.group || [];
                updateData["sessions.individual"] = teacherData.sessions.individual || [];
                await updateDoc(teacherDocRef, updateData);
            }

            // Clear the editing flags and reset the form.
            editingSessionId = null;
            editingSessionTeacherId = null;
            document.querySelector("#session-drawer .drawer-header h3").textContent = "New Session";
            document.querySelector("#session-drawer .btn-primary").textContent = "Submit";
            console.log("Session updated successfully.");
        } else {
            // Handle new session creation as before.
            sessionData.id = Date.now().toString();
            const teacherDocRef = doc(db, "teachers", newTeacherId);
            if (newType === "group") {
                await updateDoc(teacherDocRef, {
                    "sessions.group": arrayUnion(sessionData)
                });
            } else {
                await updateDoc(teacherDocRef, {
                    "sessions.individual": arrayUnion(sessionData)
                });
            }
            console.log("Session saved successfully.");
        }
        fetchTeachers(); // Refresh teacher list to update sessions on the dashboard.
        closeSessionDrawer();
    } catch (error) {
        console.error("Error saving session:", error);
        alert("Error saving session: " + error.message);
    }
}



window.saveSession = saveSession;

// ------------------------
// SAVE STUDENT FUNCTION (Firestore version)
// ------------------------
// Helper function to get updated student name
function getUpdatedStudentName(studentObj) {
    // Look up the student using their id from the global students array
    const updatedStudent = students.find(s => s.id === studentObj.id);
    return updatedStudent ? updatedStudent.name : studentObj.name;
}

async function saveStudent() {
    const name = document.getElementById("student-name").value;
    const dob = document.getElementById("st-dob").value;
    const level = document.getElementById("student-level").value;
    const phone = document.getElementById("student-phone").value;

    if (!name || !dob || !level || !phone) {
        alert("Please fill in all fields.");
        return;
    }

    // Build the student data object.
    const studentData = { name, dob, level, phone };

    try {
        if (editingStudentId) {
            // Update existing student
            const studentDocRef = doc(db, "students", editingStudentId);
            await updateDoc(studentDocRef, studentData);
            const index = students.findIndex(s => s.id === editingStudentId);
            if (index > -1) {
                students[index] = { ...students[index], ...studentData };
            }
            editingStudentId = null;
            document.querySelector('#student-drawer .btn-primary').textContent = "Submit";
        } else {
            // New student mode
            const docRef = await addDoc(collection(db, "students"), studentData);
            const newStudent = { ...studentData, id: docRef.id };
            students.push(newStudent);
        }
        renderStudentTable();
        renderStudentCheckboxes();
        updateDashboardCards();
        // Trigger a re-render of session cards to reflect updated student names
        renderTeacherSection();
        closeStudentDrawer();
    } catch (error) {
        console.error("Error saving student:", error);
        alert("Error saving student: " + error.message);
    }
}


function editStudent(id) {
    // Find the student in the local array
    const student = students.find(s => s.id === id);
    if (student) {
    // Pre-fill the input fields in the student drawer
    document.getElementById("student-name").value = student.name;
    document.getElementById("st-dob").value = student.dob;
    document.getElementById("student-level").value = student.level;
    document.getElementById("student-phone").value = student.phone;
    // Set the editing flag with the student's id
    editingStudentId = id;
    // Change the drawer button text to "Update"
    document.querySelector('#student-drawer .btn-primary').textContent = "Update";
    // Open the drawer for editing
    openStudentDrawer();
    }
}
// ------------------------
// Delete STUDENT from Firestore using deleteDoc  (Firestore version)
// ------------------------
async function deleteStudent(id) {
    if (confirm("Are you sure you want to delete this student?")) {
    try {
        await deleteDoc(doc(db, "students", id));
        // Update local array after deletion
        students = students.filter(s => s.id !== id);
        renderStudentTable();
        renderStudentCheckboxes();
        updateDashboardCards();
    } catch (error) {
        console.error("Error deleting student:", error);
        alert("Error deleting student: " + error.message);
    }
    }
}

window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.saveStudent = saveStudent;

// ------------------------
// RENDERING FUNCTIONS & DASHBOARD UPDATES
// (These functions remain similar; they now use the global arrays that were filled by Firestore.)
// ------------------------
// Updated renderStudentTable function with an optional filter
function renderStudentTable(filterText = "") {
    const tbody = document.querySelector("#student-table tbody");
    tbody.innerHTML = "";
    
    // Filter the students based on the search text (case-insensitive)
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(filterText.toLowerCase())
    );

    filteredStudents.forEach(student => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${student.name}</td>
            <td>${student.dob}</td>
            <td>${student.level}</td>
            <td>${student.phone}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editStudent('${student.id}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteStudent('${student.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Attach event listener to the search input for filtering
document.getElementById("student-table-search").addEventListener("keyup", function() {
    const searchValue = this.value;
    renderStudentTable(searchValue);
});


// Student Checkboxes
function renderStudentCheckboxes() {
    const container = document.getElementById("student-checkboxes");
    container.innerHTML = ""; // Clear any existing content
    students.forEach(student => {
        const label = document.createElement("label");
        label.className = "checkbox-container";
        // Use student.id as value, but display student.name
        label.innerHTML = `
            <input type="checkbox" name="students" value="${student.id}">
            <span class="checkmark"></span>
            ${student.name}
        `;
        container.appendChild(label);
    });
}



function updateDashboardCards() {
document.getElementById("total-students").innerText = students.length;
const totalGroups = teachers.reduce((acc, teacher) => acc + (teacher.sessions?.group?.length || 0), 0);
document.getElementById("total-group").innerText = totalGroups;
const totalIndividuals = teachers.reduce((acc, teacher) => acc + (teacher.sessions?.individual?.length || 0), 0);
document.getElementById("total-individuals").innerText = totalIndividuals;
}

function renderTeacherSection() {
const container = document.getElementById("teacher-container");
container.innerHTML = "";
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

teachers.forEach(teacher => {
    const dateObj = new Date(teacher.dob);
    const day = dateObj.getDate();
    const month = monthNames[dateObj.getMonth()];
    const avatarSrc = teacher.gender === "male" ? "https://console.elocinternational.com/img/Avatar_boys.png" : "https://console.elocinternational.com/img/Avatar_girl.png";
    const teacherDiv = document.createElement("div");
    teacherDiv.className = "teacher-details";
    teacherDiv.style.position = "relative";
    teacherDiv.innerHTML = `
    <div class="info">
        <div class="birth">
        <p class="date">${day}</p>
        <span class="month">${month}</span>
        </div>
        <p class="teacher-name">${teacher.name}</p>
        <p class="teacher-level">${teacher.level}</p>
    </div>
    <div class="avatar">
        <img src="${avatarSrc}" alt="">
    </div>
    `;
    teacherDiv.onclick = () => openTeacherSessionDrawer(teacher.id);
    container.appendChild(teacherDiv);

    // Create hidden session drawer for teacher
    const sessionDrawer = document.createElement("div");
    sessionDrawer.className = "teacher-session-drawer";
    sessionDrawer.id = `teacher-session-drawer-${teacher.id}`;
    sessionDrawer.innerHTML = `
    <div class="drawer-header">
        <h3>Sessions for ${teacher.name}</h3>
        <button class="close-btn" onclick="closeTeacherSessionDrawer('${teacher.id}')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    </div>
    <div class="drawer-body">
        <div class="session-section">
            <h4>Group Sessions</h4>
            <div class="session-container group-sessions" id="group-sessions-${teacher.id}">
            </div>
        </div>
        <div class="session-section">
            <h4>One-on-One Sessions</h4>
            <div class="session-container individual-sessions" id="individual-sessions-${teacher.id}">
            </div>
        </div>
    </div>
    `;
    document.body.appendChild(sessionDrawer);
    renderTeacherSessions(teacher);
});
}

function renderTeacherSessions(teacher) {
const groupContainer = document.getElementById(`group-sessions-${teacher.id}`);
groupContainer.innerHTML = "";
teacher.sessions?.group?.forEach(session => {
    groupContainer.innerHTML += createSessionBoxHTML(session, teacher.id);
});
const individualContainer = document.getElementById(`individual-sessions-${teacher.id}`);
individualContainer.innerHTML = "";
teacher.sessions?.individual?.forEach(session => {
    individualContainer.innerHTML += createSessionBoxHTML(session, teacher.id);
});
}

function createSessionBoxHTML(session, teacherId) {
    let backgroundColor = session.type === "group" ? "#fee4cb" : "#c8f7dc";
    let studentIdsStr = session.students && session.students.length
    ? session.students.map(s => s.id).join(",")
    : "";
    return `
    <div class="session-card" style="background: ${backgroundColor};">
        <div class="session-header">
        <div class="session-time">${session.startTime} - ${session.endTime}</div>
        <button class="session-menu-btn" onclick="editSessionById('${teacherId}', '${session.id}')">
            <i class="material-icons">edit</i>
        </button>
        <button class="action-btn delete-btn" onclick="deleteSession('${session.id}', '${teacherId}')">
            <span class="material-icons">delete</span>
        </button>
        </div>
        <div class="session-body">
        <h3 class="session-title">${session.title}</h3>
        <p class="session-level">${session.level}</p>
        <div class="session-days">${session.days.join(' - ')}</div>
        <div class="session-students">
            ${
            session.students && session.students.length 
            ? session.students.map(studentObj => `<span class="student-badge">${getUpdatedStudentName(studentObj)}</span>`).join('') 
            : `<span class="no-students">No students assigned</span>`
            }
        </div>
        </div>
        <div class="session-footer">
        <a href="${session.url}" target="_blank" class="join-btn">Join Session</a>
        <div class="icons">
            <button class="action-btn copy-btn" title="Copy Session Link" onclick="copySessionLink('${session.url}')">
            <i class="material-icons">content_copy</i>
            </button>
            <button class="action-btn share-btn" title="Share Session" onclick="shareSession('${session.url}', '${session.title}', '${session.participantsCount}', '${session.type}', '${studentIdsStr}')">
            <i class="material-icons">share</i>
            </button>
            <!-- New "View Lessons" button -->
            <button class="action-btn lessons-btn" title="View Lessons" onclick="openLessonListDrawerFromCard('${teacherId}', '${session.id}', '${session.title}')">
            <i class="material-icons">menu_book</i>
            </button>
        </div>
        </div>
    </div>
    `;
}






function updateTeacherDropdown() {

const teacherSelect = document.getElementById("teacher-session");
teacherSelect.innerHTML = `<option value="">Select an owner</option>`;
teachers.forEach(teacher => {
    teacherSelect.innerHTML += `<option value="${teacher.id}">${teacher.name}</option>`;
});
}

// ------------------------
// TEACHER SESSION DRAWER FUNCTIONS
// ------------------------
function openTeacherSessionDrawer(teacherId) {
currentOpenTeacherId = teacherId;
document.getElementById(`teacher-session-drawer-${teacherId}`).classList.add("open");
document.getElementById("teacher-session-overlay").classList.add("open");
}

function closeTeacherSessionDrawer(teacherId) {
document.getElementById(`teacher-session-drawer-${teacherId}`).classList.remove("open");
document.getElementById("teacher-session-overlay").classList.remove("open");
currentOpenTeacherId = null;
}
// Expose the function globally:
window.closeTeacherSessionDrawer = closeTeacherSessionDrawer;

function closeCurrentTeacherSessionDrawer() {
    if (currentOpenTeacherId !== null) {
        closeTeacherSessionDrawer(currentOpenTeacherId);
    }
}
// Expose it globally so that the inline onclick in admin.html can access it
window.closeCurrentTeacherSessionDrawer = closeCurrentTeacherSessionDrawer;

function editSessionById(teacherId, sessionId) {
    const teacher = teachers.find(t => t.id == teacherId);
    if (!teacher) {
        alert("Teacher not found.");
        return;
    }
    // Look for the session in both arrays
    let session = teacher.sessions.group.find(s => s.id === sessionId) ||
                teacher.sessions.individual.find(s => s.id === sessionId);
    if (!session) {
        alert("Session not found.");
        return;
    }
    // Set edit mode flag and store the original teacher id.
    editingSessionId = session.id;
    editingSessionTeacherId = teacherId;
    
    // Prepopulate form fields
    document.getElementById("session-name").value = session.title;
    document.getElementById("url").value = session.url;
    document.getElementById("teacher-session").value = teacherId;
    document.getElementById("type").value = session.type;
    document.getElementById("session-level").value = session.level;
    document.getElementById("session-start-time").value = session.startTime;
    document.getElementById("session-end-time").value = session.endTime;
    
    // Pre-check the day checkboxes
    const dayCheckboxes = document.querySelectorAll("#checkbox-days input[name='sessionDays']");
    dayCheckboxes.forEach(cb => {
        cb.checked = session.days.includes(cb.value);
    });
    
    // Pre-check the student checkboxes (ensure you adjust this if needed)
    const studentCheckboxes = document.querySelectorAll("#student-checkboxes input[name='students']");
    studentCheckboxes.forEach(cb => {
        cb.checked = session.students.includes(cb.value);
    });
    
    // Update header and button text for edit mode
    document.querySelector("#session-drawer .drawer-header h3").textContent = "Edit Session";
    document.querySelector("#session-drawer .btn-primary").textContent = "Update";
    
    // Open the session drawer
    openSessionDrawer();
}

// Expose the function globally for inline event handlers:
window.editSessionById = editSessionById;
// ------------------------
// COPY & SHARE FUNCTIONS
// ------------------------
function copySessionLink(url) {
    // Check if the clipboard API is available and we are in a secure context
    if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url)
        .then(() => {
        alert("Session link copied to clipboard!");
        })
        .catch(err => {
        alert("Failed to copy link: " + err);
        });
    } else {
    // Fallback for insecure context or unsupported clipboard API
    const textArea = document.createElement("textarea");
    textArea.value = url;
    // Move the textarea off-screen so it's not visible
    textArea.style.position = "fixed";
    textArea.style.top = "-1000px";
    textArea.style.left = "-1000px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
        alert("Session link copied to clipboard!");
        } else {
        alert("Failed to copy link.");
        }
    } catch (err) {
        alert("Failed to copy link: " + err);
    }
    document.body.removeChild(textArea);
    }
}
window.copySessionLink = copySessionLink;


function shareSession(url, title, participantsCount, type, studentIdsStr) {
    let message = "";
    // Convert the comma-separated string into an array of student IDs
    let studentIds = studentIdsStr ? studentIdsStr.split(",") : [];
    // Dynamically calculate the actual participant count
    let actualParticipantsCount = studentIds.length;

    // Look up Student's Name from the global 'students' array using the student id
    let names = [];
    studentIds.forEach(id => {
        let student = students.find(s => s.id === id);
        if (student && student.name) {
            names.push(student.name);
        }
    });
    
    if (type === "individual") {
        // For individual sessions, simply share the session link
        if (names) {
            message = `Join my session "${title}". Here's the link: ${url}`;
            // Open WhatsApp with the prepopulated message using wa.me format
            const whatsappURL = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
        } else {
            alert("No student available for this session.");
        }
    } else if (type === "group") {

        // For group sessions, include the participant name & count in the message
        if (names.length) {
            message = `Join our group session "${title}" with ${actualParticipantsCount} participants.\nContacts: ${names.join(", ")}\nSession link: ${url}`;
            // Open WhatsApp with prepopulated text
            const whatsappURL = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
        } else {
            alert("No student available for this group session.");
        }
    } else {
        alert("Unknown session type.");
    }
}

window.shareSession = shareSession;

// 2. Add functions to fetch lessons and manage the lesson list drawer

// Fetch lessons from Firestore for a given session ID
async function fetchLessonsForSession(sessionId) {
    const lessonsQuery = query(
    collection(db, "lessons"),
    where("sessionId", "==", sessionId)
    );
    const querySnapshot = await getDocs(lessonsQuery);
    const lessons = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return lessons;
}
// Create the lesson list drawer (if it doesn’t exist already)
function createLessonListDrawer() {
    let drawer = document.getElementById("lesson-list-drawer");
    if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "lesson-list-drawer";
    drawer.className = "lesson-list-drawer";
    // Basic inline styles (adjust or move to admin.css as needed)
    drawer.style.position = "fixed";
    drawer.style.top = "0";
    drawer.style.right = "-450px"; // hidden by default
    drawer.style.width = "450px";
    drawer.style.height = "100%";
    drawer.style.background = "#fff";
    drawer.style.boxShadow = "-4px 0 20px rgba(0,0,0,0.15)";
    drawer.style.transition = "right 0.3s ease";
    drawer.style.zIndex = "1100"; // Above the teacher-session drawer (which uses 1000)
    drawer.style.display = "flex";
    drawer.style.flexDirection = "column";
    drawer.innerHTML = `
        <div class="drawer-header">
        <h3 id="lesson-list-title">Lessons</h3>
        <button class="close-btn" onclick="closeLessonListDrawer()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        </div>
        <div class="drawer-body" id="lesson-list-body" style="padding:20px; overflow-y:auto; flex:1;">
        </div>
        <div class="drawer-footer" style="padding:20px; text-align:right;">
        <button class="btn cancel-btn" onclick="closeLessonListDrawer()">Close</button>
        </div>
    `;
    document.body.appendChild(drawer);
    }
    return drawer;
}

// Create the overlay for the lesson list drawer
function createLessonListOverlay() {
    let overlay = document.getElementById("lesson-list-overlay");
    if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "lesson-list-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.zIndex = "1050";
    overlay.style.display = "none";
    overlay.addEventListener("click", closeLessonListDrawer);
    document.body.appendChild(overlay);
    }
    return overlay;
}

// Open the lesson list drawer for a given session (using its ID and title)
async function openLessonListDrawer(sessionId, sessionTitle) {
    const drawer = createLessonListDrawer();
    const overlay = createLessonListOverlay();
    document.getElementById("lesson-list-title").textContent = `Lessons for: ${sessionTitle}`;
    
    try {
    const lessons = await fetchLessonsForSession(sessionId);
    const lessonListBody = document.getElementById("lesson-list-body");
    if (lessons.length > 0) {
        lessonListBody.innerHTML = lessons.map(lesson => `
        <div class="lesson-card" style="padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:5px;">
            <h4 style="margin:0 0 5px 0;">${lesson.lessonName}</h4>
            ${lesson.fileUrl ? `<a href="${lesson.fileUrl}" target="_blank">View File</a>` : ''}
            <div style="margin-top:8px;">
            <button class="action-btn remove-btn" title="Delete Lesson" onclick="removeLesson('${lesson.id}', '${lesson.sessionId}')">
                <i class="material-icons">delete</i>
            </button>
            <button class="action-btn whatsapp-btn" title="Share via WhatsApp" onclick="shareLessonViaWhatsApp('${lesson.lessonName}', '${lesson.fileUrl}')">
                <i class="material-icons">share</i>
            </button>
            </div>
        </div>
        `).join("");
    } else {
        lessonListBody.innerHTML = "<p>No lessons added yet.</p>";
    }
    } catch (error) {
    console.error("Error fetching lessons:", error);
    }
    
    // Open the drawer and show the overlay
    drawer.style.right = "0";
    overlay.style.display = "block";
}  

// Close the lesson list drawer and its overlay
function closeLessonListDrawer() {
    const drawer = document.getElementById("lesson-list-drawer");
    const overlay = document.getElementById("lesson-list-overlay");
    if (drawer) {
    drawer.style.right = "-450px";
    }
    if (overlay) {
    overlay.style.display = "none";
    }
}

// Helper function to be called when clicking the "View Lessons" button on a session card
function openLessonListDrawerFromCard(teacherId, sessionId, sessionTitle) {
    // Optionally, you can add logic here if you need teacherId.
    openLessonListDrawer(sessionId, sessionTitle);
}
window.openLessonListDrawerFromCard = openLessonListDrawerFromCard;
window.closeLessonListDrawer = closeLessonListDrawer;

// Remove lesson card
async function removeLesson(lessonId, sessionId) {
    if (confirm("Are you sure you want to delete this lesson?")) {
    try {
        await deleteDoc(doc(db, "lessons", lessonId));
        alert("Lesson deleted successfully.");
        // Refresh the lesson list drawer to update the UI.
        // (Assuming openLessonListDrawer uses sessionId and current session title.)
        const currentTitle = document.getElementById("lesson-list-title").textContent.replace("Lessons for: ", "");
        openLessonListDrawer(sessionId, currentTitle);
    } catch (error) {
        console.error("Error deleting lesson:", error);
        alert("Error deleting lesson: " + error.message);
    }
    }
}

// Remove Share Lesson Via Whatssap
function shareLessonViaWhatsApp(lessonName, lessonUrl) {
    const message = `Check out this lesson: ${lessonName}\nLink: ${lessonUrl}`;
    const whatsappURL = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
} 

window.removeLesson = removeLesson;
window.shareLessonViaWhatsApp = shareLessonViaWhatsApp;
