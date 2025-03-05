import { db, auth } from "./firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
// ------------------------
// DOMContentLoaded: Check Login and Fetch Teacher Data
// ------------------------
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
// Set background and accent colors based on session type
let backgroundColor = session.type === "group" ? "#fbfbfb" : "#ffffff";
let accentColor = session.type === "group" ? "#ff942e" : "#00b14d";

return `
<div class="session-card" style="background: ${backgroundColor};">
    <div class="session-header">
    <div class="session-time">${session.startTime} - ${session.endTime}</div>
    <button class="session-menu-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" 
            viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2" 
            stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
        </svg>
    </button>
    </div>
    <div class="session-body">
    <h3 class="session-title">${session.title}</h3>
    <p class="session-level">${session.level}</p>
    <div class="session-days">${session.days.join(' - ')}</div>
    <div class="session-students">
        ${session.students && session.students.length 
        ? session.students.map(student => `<span class="student-badge">${student}</span>`).join('') 
        : `<span class="no-students">No students assigned</span>`
        }
    </div>
    </div>
    <div class="session-footer">
    <a href="${session.url}" target="_blank" class="join-btn">Join Session</a>
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
