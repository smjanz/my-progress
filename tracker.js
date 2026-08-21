const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_PUBLISHABLE_KEY
);

const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutButton = document.getElementById("logout-button");

const saveButton = document.getElementById("save-checkin");
const saveStatus = document.getElementById("save-status");

async function showApp() {
  loginScreen.style.display = "none";
  appScreen.style.display = "block";

  await loadToday();
}

async function showLogin() {
  loginScreen.style.display = "block";
  appScreen.style.display = "none";
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

  await showApp();
});

logoutButton.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  await showLogin();
});

async function loadToday() {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    await showLogin();
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabaseClient
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (!data) return;

  document.getElementById("weight").value = data.weight ?? "";
  document.getElementById("calories").value = data.calories ?? "";
  document.getElementById("protein").value = data.protein ?? "";
  document.getElementById("carbs").value = data.carbs ?? "";
  document.getElementById("fat").value = data.fat ?? "";
  document.getElementById("food").value = data.food ?? "";
  document.getElementById("mood").value = data.mood ?? "";
  document.getElementById("energy").value = data.energy ?? "";
  document.getElementById("hunger").value = data.hunger ?? "";
  document.getElementById("reflection").value = data.reflection ?? "";
}

saveButton.addEventListener("click", async () => {
  saveStatus.textContent = "Saving...";

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    saveStatus.textContent = "Please log in again.";
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const checkin = {
    user_id: user.id,
    date: today,
    weight: getNumber("weight"),
    calories: getNumber("calories"),
    protein: getNumber("protein"),
    carbs: getNumber("carbs"),
    fat: getNumber("fat"),
    food: document.getElementById("food").value.trim(),
    mood: document.getElementById("mood").value,
    energy: getNumber("energy"),
    hunger: getNumber("hunger"),
    reflection: document.getElementById("reflection").value.trim()
  };

  const { error } = await supabaseClient
    .from("daily_checkins")
    .upsert(checkin, {
      onConflict: "user_id,date"
    });

  if (error) {
    console.error(error);
    saveStatus.textContent = error.message;
    return;
  }

  saveStatus.textContent = "Saved! ✓";
});

function getNumber(id) {
  const value = document.getElementById(id).value;

  if (value === "") return null;

  return Number(value);
}

async function initialise() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    await showApp();
  } else {
    await showLogin();
  }
}

initialise();
