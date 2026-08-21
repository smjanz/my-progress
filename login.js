const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_PUBLISHABLE_KEY
);

const loginForm = document.getElementById("login-form");
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginError = document.getElementById("login-error");
const logoutButton = document.getElementById("logout-button");

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  loginError.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    loginError.textContent = error.message;
    return;
  }

  loginScreen.style.display = "none";
  appScreen.style.display = "block";
});

logoutButton.addEventListener("click", async function () {
  await supabaseClient.auth.signOut();

  appScreen.style.display = "none";
  loginScreen.style.display = "block";
});
