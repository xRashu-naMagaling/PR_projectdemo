// Shared student session helper for the canteen portal.
function getStudentSession() {
    try {
        const savedSession = localStorage.getItem('sti_student_session')
            || sessionStorage.getItem('sti_student_session');
        return savedSession ? JSON.parse(savedSession) : null;
    } catch (error) {
        console.error('Unable to read student session:', error);
        return null;
    }
}

let currentStudent = getStudentSession();

function logoutStudent() {
    localStorage.removeItem('sti_student_session');
    sessionStorage.removeItem('sti_student_session');
    currentStudent = null;
    window.location.href = 'index.html';
}
