
const ADMIN_EMAIL = "mohanxadithya@gmail.com";

const loginSection = document.getElementById("adminLogin");
const dashboardSection = document.getElementById("adminDashboard");
const loginForm = document.getElementById("adminLoginForm");
const loginError = document.getElementById("loginError");
const loginButton = document.getElementById("loginButton");

function showAdminDashboard() {
    loginSection.hidden = true;
    dashboardSection.hidden = false;

    window.dispatchEvent(
        new Event("atelier-admin-ready")
    );
}

function showAdminLogin() {
    dashboardSection.hidden = true;
    loginSection.hidden = false;
}

async function checkAdminSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        showAdminLogin();
        loginError.textContent = "Could not check login. Please refresh.";
        return;
    }

    const user = data.session?.user;

    if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        showAdminDashboard();
    } else {
        if (user) {
            await supabaseClient.auth.signOut();
        }
        showAdminLogin();
    }
}

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    loginButton.disabled = true;
    loginButton.textContent = "LOGGING IN...";
    loginError.textContent = "";

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        loginError.textContent = "Login failed. Check your email and password.";
        loginButton.disabled = false;
        loginButton.textContent = "LOGIN";
        return;
    }

    if (data.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await supabaseClient.auth.signOut();
        loginError.textContent = "This account is not authorized as an admin.";
        loginButton.disabled = false;
        loginButton.textContent = "LOGIN";
        return;
    }

    showAdminDashboard();
    loginForm.reset();
    loginButton.disabled = false;
    loginButton.textContent = "LOGIN";
});

document.getElementById("adminLogout").addEventListener("click", async function() {
    await supabaseClient.auth.signOut();
    showAdminLogin();
});

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
        showAdminLogin();
    }
});

checkAdminSession();
