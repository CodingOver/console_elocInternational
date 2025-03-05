// ========================
// Updated admin.js
// ========================
import { arrayUnion } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { db, auth } from "./firebase.js";
// Ensure that auth and db are imported from your firebase.js



// GLOBAL VARIABLES
let teachers = [];
let students = [];
let editingStudentId = null;
let editingSessionId = null;
let currentOpenTeacherId = null;

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
// Helper function to generate a simple unique ID (you can improve this as needed)
function generateSessionId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

async function saveSession() {
    const title = document.getElementById("session-name").value;
    const url = document.getElementById("url").value;
    const teacherId = document.getElementById("teacher-session").value;
    const type = document.getElementById("type").value;
    const level = document.getElementById("session-level").value;
    // Collect the selected student IDs from checkboxes – these now hold student IDs (see renderStudentCheckboxes below)
    const selectedStudentIds = Array.from(document.querySelectorAll('#student-checkboxes input[name="students"]:checked')).map(el => el.value);
    // Collect selected days and time
    const selectedDays = Array.from(document.querySelectorAll('#checkbox-days input[name="sessionDays"]:checked')).map(el => el.value);
    const startTime = document.getElementById("session-start-time").value;
    const endTime = document.getElementById("session-end-time").value;
    
    if (!title || !url || !teacherId || !type || !level || selectedDays.length === 0 || !startTime || !endTime) {
        alert("Please fill in all required fields in the session form.");
        return;
    }
    
    // Set the participantsCount dynamically from the number of selected students
    const participantsCount = (type === "group") ? selectedStudentIds.length : 1;
    
    const sessionData = {
        title,
        url,
        level,
        days: selectedDays,
        startTime,
        endTime,
        type, // "group" or "individual"
        // Save the array of student IDs, not names
        students: selectedStudentIds,
        participantsCount
    };

    try {
        const teacherDocRef = doc(db, "teachers", teacherId);
        if (editingSessionId) {
            // For edit mode, update your session – note that if you’re using a subcollection, you must update accordingly.
            // If you switched to storing sessions as arrays in the teacher document, you’d need to update the array.
            // For now, we assume sessions are stored in a subcollection:
            const sessionDocRef = doc(teacherDocRef, "sessions", editingSessionId);
            await updateDoc(sessionDocRef, sessionData);
            editingSessionId = null;
            document.querySelector("#session-drawer .drawer-header h3").textContent = "New Session";
            document.querySelector("#session-drawer .btn-primary").textContent = "Submit";
        } else {
            // For add mode, add a new session document under the teacher's sessions subcollection
            await addDoc(collection(teacherDocRef, "sessions"), sessionData);
        }
        // Refresh teacher list to update sessions on the dashboard
        fetchTeachers();
        closeSessionDrawer();
    } catch (error) {
        console.error("Error saving session:", error);
    }
}  

window.saveSession = saveSession;

// ------------------------
// SAVE STUDENT FUNCTION (Firestore version)
// ------------------------
async function saveStudent() {
    const name = document.getElementById("student-name").value;
    const dob = document.getElementById("st-dob").value;
    const level = document.getElementById("student-level").value;
    const phone = document.getElementById("student-phone").value;

    if (!name || !dob || !level || !phone) {
    alert("Please fill in all fields.");
    return;
    }

    // Build the student data object
    const studentData = { name, dob, level, phone };

    if (editingStudentId) {
    // Update existing student
    try {
        await updateDoc(doc(db, "students", editingStudentId), studentData);
        // Update local array
        const index = students.findIndex(s => s.id === editingStudentId);
        if (index !== -1) {
        students[index] = { ...students[index], ...studentData };
        }
        // Reset editing state and update UI
        editingStudentId = null;
        document.querySelector('#student-drawer .btn-primary').textContent = "Submit";
        renderStudentTable();
        renderStudentCheckboxes();
        updateDashboardCards();
        closeStudentDrawer();
    } catch (error) {
        console.error("Error updating student:", error);
        alert("Error updating student: " + error.message);
    }
    } else {
    // Add a new student
    try {
        const docRef = await addDoc(collection(db, "students"), studentData);
        const newStudent = { ...studentData, id: docRef.id };
        students.push(newStudent);
        renderStudentTable();
        renderStudentCheckboxes();
        updateDashboardCards();
        closeStudentDrawer();
    } catch (error) {
        console.error("Error adding student:", error);
        alert("Error adding student: " + error.message);
    }
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
function renderStudentTable() {
const tbody = document.querySelector("#student-table tbody");
tbody.innerHTML = "";
students.forEach(student => {
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
    const avatarSrc = teacher.gender === "male" ? "../img/avatar_boys.png" : "../img/avatar_girl.png";
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
        <button onclick="closeTeacherSessionDrawer('${teacher.id}')">Close</button>
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
    // Set colors based on session type
    let backgroundColor = session.type === "group" ? "#fee4cb" : "#c8f7dc";
    let accentColor = session.type === "group" ? "#ff942e" : "#00b14d";
    
    // Assuming session.students is an array of student IDs now
    const studentIdsStr = session.students && session.students.length ? session.students.join(",") : "";
    
    return `
        <div class="session-card" style="background: ${backgroundColor};">
            <div class="session-header">
                <div class="session-time">${session.startTime} - ${session.endTime}</div>
                <button class="session-menu-btn" onclick="editSessionById('${teacherId}', '${session.id}')">
                    <i class="material-icons">edit</i>
                </button>
            </div>
            <div class="session-body">
                <h3 class="session-title">${session.title}</h3>
                <p class="session-level">${session.level}</p>
                <div class="session-days">${session.days.join(' - ')}</div>
                <div class="session-students">
                    ${session.students && session.students.length 
                        ? session.students.map(id => {
                            // Look up the student's name from the global students array
                            const student = students.find(s => s.id === id);
                            return student ? `<span class="student-badge">${student.name}</span>` : "";
                        }).join('') 
                        : `<span class="no-students">No students assigned</span>`
                    }
                </div>
            </div>
            <div class="session-footer">
                <a href="${session.url}" target="_blank" class="join-btn">Join Session</a>
                <div class="session-actions">
                    <button class="action-btn copy-btn" onclick="copySessionLink('${session.url}')">
                        <i class="material-icons">content_copy</i>
                    </button>
                    <button class="action-btn share-btn" onclick="shareSession('${session.url}', '${session.title}', ${session.participantsCount}, '${session.type}', '${studentIdsStr}')">
                        <i class="material-icons">share</i>
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
    // Set edit mode flag
    editingSessionId = session.id;
    
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
    
    // Pre-check the student checkboxes
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


function shareSession(url, title, dummyParticipantsCount, type, studentIdsStr) {
    let message = "";
    // Convert the comma-separated student IDs into an array
    let studentIds = studentIdsStr ? studentIdsStr.split(",") : [];
    // Look up phone numbers from the global 'students' array using the student id
    let phoneNumbers = [];
    studentIds.forEach(id => {
        let student = students.find(s => s.id === id);
        if (student && student.phone) {
            phoneNumbers.push(student.phone);
        }
    });
    // For group sessions, recalc the participants count as the number of phone numbers found
    let participantsCount = (type === "group") ? phoneNumbers.length : 1;
    
    if (type === "individual") {
        if (phoneNumbers.length > 0) {
            message = `Join your session "${title}". Here's the link: ${url}`;
            // Ensure the phone number is in proper international format (without a plus)
            const whatsappURL = `https://wa.me/${phoneNumbers[0]}?text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
        } else {
            alert("No student phone number available for this individual session.");
        }
    } else if (type === "group") {
        if (phoneNumbers.length > 0) {
            message = `Join our group session "${title}" with ${participantsCount} participants.\nSession link: ${url}`;
            // For groups, open WhatsApp with prepopulated text so the teacher can choose the group chat
            const whatsappURL = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
        } else {
            alert("No student phone numbers available for this group session.");
        }
    } else {
        alert("Unknown session type.");
    }
}





window.shareSession = shareSession;
