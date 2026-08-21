(async () => {
  const supabaseClient = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_PUBLISHABLE_KEY
  );

  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const loginView = document.getElementById("login-view");
  const mainView = document.getElementById("main-view");
  const logoutButton = document.getElementById("logout");

  function showLoggedIn() {
    loginView.classList.add("hidden");
    mainView.classList.remove("hidden");
  }

  function showLoggedOut() {
    loginView.classList.remove("hidden");
    mainView.classList.add("hidden");
  }

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    showLoggedIn();
  } else {
    showLoggedOut();
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginError.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      loginError.textContent = error.message;
      return;
    }

    showLoggedIn();
  });

  logoutButton.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    showLoggedOut();
  });
})();
