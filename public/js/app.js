// ฟังก์ชันบันทึกและดึงข้อมูลล็อกอิน
function saveAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}
function getToken() { return localStorage.getItem('token'); }
function getUser() { 
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// ฟังก์ชันออกจากระบบ
function logout() {
    localStorage.clear();
    window.location.href = '/login.html';
}

// ฟังก์ชันตรวจสอบสิทธิ์การเข้าหน้าเว็บ
function checkAuth(requiredRole = null) {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
        window.location.href = '/login.html';
        return;
    }
    if (requiredRole && user.role !== requiredRole) {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        window.location.href = user.role === 'ADMIN' ? '/admin-dashboard.html' : '/search.html';
    }
}