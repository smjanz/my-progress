(function () {
  const trackerSupabase = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_PUBLISHABLE_KEY
  );

  const saveButton = document.getElementById("save-checkin");
  const saveStatus = document.getElementById("save-status");

  if (!saveButton) {
    console.error("Save button not found.");
    return;
  }

  async function saveCheckin() {
    saveStatus.textContent = "Saving...";

    const {
      data: { user },
      error: userError
    } = await trackerSupabase.auth.getUser();

    if (userError || !user) {
      saveStatus.textContent = "Your session has expired. Please log in again.";
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

    const { error } = await trackerSupabase
      .from("daily_checkins")
      .upsert(checkin, {
        onConflict: "user_id,date"
      });

    if (error) {
      console.error("Save error:", error);
      saveStatus.textContent = error.message;
      return;
    }

    const photoInput = document.getElementById("photo");

    if (photoInput && photoInput.files.length > 0) {
      saveStatus.textContent = "Saving check-in and uploading photo...";

      const photo = photoInput.files[0];

      const fileExtension = photo.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExtension}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await trackerSupabase
        .storage
        .from("progress-photos")
        .upload(filePath, photo);

      if (uploadError) {
        console.error("Photo upload error:", uploadError);
        saveStatus.textContent =
          "Check-in saved, but photo upload failed: " +
          uploadError.message;
        return;
      }

      saveStatus.textContent = "Saved with progress photo! ✓";

      photoInput.value = "";
    } else {
      saveStatus.textContent = "Saved! ✓";
    }
  }

  function getNumber(id) {
    const element = document.getElementById(id);

    if (!element || element.value === "") {
      return null;
    }

    return Number(element.value);
  }

  saveButton.addEventListener("click", saveCheckin);
})();
