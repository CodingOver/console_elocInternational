import { db, auth } from "./firebase.js";
// Add Firestore query helpers
import { doc, getDoc, setDoc} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
// Add these imports:
import { collection, query, where, getDocs, addDoc} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";


// ------------------------
// DOMContentLoaded: Check Login and Fetch Teacher Data
// ------------------------
let students = [];

document.addEventListener("DOMContentLoaded", function(){
const teacherId = sessionStorage.getItem("teacherId");
if (!teacherId) {
document.getElementById("teacher-login-modal").style.display = "flex";
document.querySelector(".app-container").style.display = "none";
} else {
document.getElementById("teacher-login-modal").style.display = "none";
document.querySelector(".app-container").style.display = "block";

const teacherDocRef = doc(db, "teachers", teacherId);
getDoc(teacherDocRef)
    .then(docSnap => {
    if (docSnap.exists()) {
        const teacher = docSnap.data();
        updateTeacherInfo(teacher);
        renderTeacherSessions(teacher);
        updateTeacherDashboardStats(teacher);
    } else {
        alert("Teacher data not found. Please contact your administrator.");
    }
    })
    .catch(error => console.error("Error fetching teacher data:", error));
}
});

// ------------------------
// Teacher Login Function
// ------------------------

function teacherLogin() {
    const email = document.getElementById("teacher-email").value.trim();
    const password = document.getElementById("teacher-password").value.trim();

    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const teacherUid = userCredential.user.uid;
        const teacherDocRef = doc(db, "teachers", teacherUid);
        getDoc(teacherDocRef)
        .then((docSnap) => {
            if (docSnap.exists()) {
            const teacher = docSnap.data();
            sessionStorage.setItem("teacherId", teacherUid);
            updateTeacherInfo(teacher);
            renderTeacherSessions(teacher);
            updateTeacherDashboardStats(teacher);
            document.getElementById("teacher-login-modal").style.display = "none";
            document.querySelector(".app-container").style.display = "block";
            } else {
            alert("Teacher data not found. Please contact your administrator.");
            }
        })
        .catch((error) => console.error("Error fetching teacher data:", error));
    })
    .catch((error) => {
        alert("Login failed: " + error.message);
    });
}

window.teacherLogin = teacherLogin;

// ------------------------
// Helper Function: Update Teacher Info on Dashboard
// ------------------------
function updateTeacherInfo(teacher) {
let teacherNameElement = document.querySelector(".teacher-name");
let teacherEmailElement = document.querySelector(".teacher-email");
let profileBtnSpan = document.querySelector(".profile-btn span");

if (teacherNameElement) {
teacherNameElement.textContent = teacher.name;
}
if (teacherEmailElement) {
teacherEmailElement.textContent = teacher.email;
}
if (profileBtnSpan) {
profileBtnSpan.textContent = teacher.name;
}
}

// ------------------------
// Render Teacher Sessions (Assumes teacher.sessions has group and individual arrays)
// ------------------------
function renderTeacherSessions(teacher) {
const groupContainer = document.getElementById("groupSessionsContainer");
const individualContainer = document.getElementById("individualSessionsContainer");

if (groupContainer) {
groupContainer.innerHTML = "";
teacher.sessions.group.forEach(session => {
    groupContainer.innerHTML += createSessionBoxHTML(session);
});
}
if (individualContainer) {
individualContainer.innerHTML = "";
teacher.sessions.individual.forEach(session => {
    individualContainer.innerHTML += createSessionBoxHTML(session);
});
}
}

// ------------------------
// Create Session Card HTML
// ------------------------
function createSessionBoxHTML(session) {
    let backgroundColor = session.type === "group" ? "#fbfbfb" : "#ffffff";
    
    return `
    <div class="session-card" style="background: ${backgroundColor};">
        <div class="session-header">
        <div class="session-time">${session.startTime} - ${session.endTime}</div>
        <button class="session-menu-btn" onclick="openLessonDrawer('${session.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
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
        <!-- New "View Lessons" button placed next to the Join button -->
        <button class="action-btn lessons-btn" title="View Lessons" onclick="openTeacherLessonListDrawer('${session.id}', '${session.title}')">
            <i class="material-icons">menu_book</i>
        </button>
        </div>
    </div>
    `;
}


// ------------------------
// Update Teacher Dashboard Stats
// ------------------------
function updateTeacherDashboardStats(teacher) {
let totalGroups = teacher.sessions.group.length;
document.getElementById("totalGroupOfTheTeacher").innerText = totalGroups;

let totalIndividuals = teacher.sessions.individual.length;
document.getElementById("totalIndividualsOfTheTeacher").innerText = totalIndividuals;

let studentSet = new Set();
teacher.sessions.group.forEach(session => {
if (session.students && Array.isArray(session.students)) {
    session.students.forEach(student => studentSet.add(student));
}
});
teacher.sessions.individual.forEach(session => {
if (session.students && Array.isArray(session.students)) {
    session.students.forEach(student => studentSet.add(student));
}
});
document.getElementById("totalStudentssOfTheTeacher").innerText = studentSet.size;
}


// Helper function to get updated student name
function getUpdatedStudentName(studentObj) {
    // Look up the student using their id from the global students array
    const updatedStudent = students.find(s => s.id === studentObj.id);
    return updatedStudent ? updatedStudent.name : studentObj.name;
}

// Add New Lesson Drawer Drawer
function openLessonDrawer(sessionId) {
    // Store the current session ID globally
    window.currentSessionId = sessionId;
    document.getElementById("lesson-drawer").classList.add("open");
    document.getElementById("lesson-overlay").style.display = "block";
}


function closeLessonDrawer() {
    document.getElementById("lesson-drawer").classList.remove("open");
    document.getElementById("lesson-overlay").style.display = "none";
    // Reset the form fields
    document.getElementById("lesson-name").value = "";
    document.getElementById("lesson-upload").value = "";
    document.getElementById("file-name").textContent = "";
}

async function updateLessonList(sessionId) {
    // Check if the teacher's lesson list drawer is present and visible
    const drawer = document.getElementById("teacher-lesson-list-drawer");
    if (!drawer) return;
    
    // Optionally, check if the drawer is open (for example, by a class or style)
    if (drawer.style.right === "0px" || drawer.classList.contains("open")) {
    try {
        const lessons = await fetchLessonsForSession(sessionId);
        const lessonListBody = document.getElementById("teacher-lesson-list-body");
        if (lessons.length > 0) {
        lessonListBody.innerHTML = lessons.map(lesson => `
            <div class="lesson-card">
            <h4>${lesson.lessonName}</h4>
            ${lesson.fileUrl ? `<a href="${lesson.fileUrl}" target="_blank">View File</a>` : ''}
            </div>
        `).join("");
        } else {
        lessonListBody.innerHTML = "<p>No lessons added yet.</p>";
        }
    } catch (error) {
        console.error("Error updating lesson list:", error);
    }
    }
}


// Submit The Lesson
async function submitLesson() {
const lessonName = document.getElementById("lesson-name").value.trim();
const lessonFile = document.getElementById("lesson-upload").files[0];

if (!lessonName || !lessonFile) {
    alert("Please provide a lesson name and upload a file.");
    return;
}

// In a real implementation, you’d upload the file (e.g., to Firebase Storage) and get its URL.
// For now, we simulate with a placeholder:
const fileUrl = "https://via.placeholder.com/150";

// Get the current teacher and session IDs
const teacherId = sessionStorage.getItem("teacherId");
if (!window.currentSessionId) {
    alert("No session selected for adding the lesson.");
    return;
}

// Build the lesson object
const lessonData = {
    lessonName: lessonName,
    fileUrl: fileUrl,
    teacherId: teacherId,
    sessionId: window.currentSessionId,
    createdAt: new Date().toISOString()
};

try {
    const docRef = await addDoc(collection(db, "lessons"), lessonData);
    lessonData.id = docRef.id;
    alert(`Lesson "${lessonName}" submitted successfully!`);
    closeLessonDrawer();
    // After saving, update the lesson list drawer (if it’s open) so the new lesson appears immediately.
    updateLessonList(window.currentSessionId);
    } catch (error) {
    console.error("Error submitting lesson:", error);
    alert("Error submitting lesson: " + error.message);
    }
}


// Update the file input display when a file is chosen.
document.getElementById("lesson-upload").addEventListener("change", function(){
    const fileNameSpan = document.getElementById("file-name");
    if (this.files && this.files.length > 0) {
    fileNameSpan.textContent = this.files[0].name;
    } else {
    fileNameSpan.textContent = "";
    }
});

window.openLessonDrawer = openLessonDrawer;
window.closeLessonDrawer = closeLessonDrawer;
window.submitLesson = submitLesson;


// Fetch lessons for a given session from Firestore
async function fetchLessonsForSession(sessionId) {
    const lessonsQuery = query(
    collection(db, "lessons"),
    where("sessionId", "==", sessionId)
    );
    const querySnapshot = await getDocs(lessonsQuery);
    const lessons = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return lessons;
}

// Create (or get) the lesson list drawer element for teachers
function createTeacherLessonListDrawer() {
    let drawer = document.getElementById("teacher-lesson-list-drawer");
    if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "teacher-lesson-list-drawer";
    drawer.className = "lesson-list-drawer";
    // Styling – adjust or move these styles to your CSS file as needed
    drawer.style.position = "fixed";
    drawer.style.top = "0";
    drawer.style.right = "-450px"; // Hidden by default
    drawer.style.width = "450px";
    drawer.style.height = "100%";
    drawer.style.background = "#fff";
    drawer.style.boxShadow = "-4px 0 20px rgba(0,0,0,0.15)";
    drawer.style.transition = "right 0.3s ease";
    drawer.style.zIndex = "1100"; // Ensure it appears above the teacher-session drawer
    drawer.style.display = "flex";
    drawer.style.flexDirection = "column";
    drawer.innerHTML = `
        <div class="drawer-header">
        <h3 id="teacher-lesson-list-title">Lessons</h3>
        <button class="close-btn" onclick="closeTeacherLessonListDrawer()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        </div>
        <div class="drawer-body" id="teacher-lesson-list-body" style="padding:20px; overflow-y:auto; flex:1;">
        </div>
        <div class="drawer-footer" style="padding:20px; text-align:right;">
        <button class="btn cancel-btn" onclick="closeTeacherLessonListDrawer()">
            <i class="material-icons">close</i>
        </button>
        </div>
    `;
    document.body.appendChild(drawer);
    }
    return drawer;
}

// Create (or get) the overlay for the lesson list drawer
function createTeacherLessonListOverlay() {
    let overlay = document.getElementById("teacher-lesson-list-overlay");
    if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "teacher-lesson-list-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.zIndex = "1050";
    overlay.style.display = "none";
    overlay.addEventListener("click", closeTeacherLessonListDrawer);
    document.body.appendChild(overlay);
    }
    return overlay;
}

// Open the lesson list drawer for a session (given its ID and title)
async function openTeacherLessonListDrawer(sessionId, sessionTitle) {
    const drawer = createTeacherLessonListDrawer();
    const overlay = createTeacherLessonListOverlay();
    document.getElementById("teacher-lesson-list-title").textContent = `Lessons for: ${sessionTitle}`;
    
    try {
    const lessons = await fetchLessonsForSession(sessionId);
    const lessonListBody = document.getElementById("teacher-lesson-list-body");
    if (lessons.length > 0) {
        lessonListBody.innerHTML = lessons.map(lesson => `
        <div class="lesson-card" style="padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:5px;">
            <h4 style="margin:0 0 5px 0;">${lesson.lessonName}</h4>
            ${lesson.fileUrl ? `<a href="${lesson.fileUrl}" target="_blank">View File</a>` : ''}
        </div>
        `).join("");
    } else {
        lessonListBody.innerHTML = "<p>No lessons added yet.</p>";
    }
    } catch (error) {
    console.error("Error fetching lessons:", error);
    }
    // Slide the drawer in and show the overlay
    drawer.style.right = "0";
    overlay.style.display = "block";
}

// Close the lesson list drawer and hide its overlay
function closeTeacherLessonListDrawer() {
    const drawer = document.getElementById("teacher-lesson-list-drawer");
    const overlay = document.getElementById("teacher-lesson-list-overlay");
    if (drawer) {
    drawer.style.right = "-450px";
    }
    if (overlay) {
    overlay.style.display = "none";
    }
}
window.closeTeacherLessonListDrawer = closeTeacherLessonListDrawer;

// Expose the functions globally if needed
window.openTeacherLessonListDrawer = openTeacherLessonListDrawer;
