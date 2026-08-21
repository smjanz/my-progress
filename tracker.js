(function () {
  const trackerSupabase = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_PUBLISHABLE_KEY
  );

  const saveButton = document.getElementById("save-checkin");
  const saveStatus = document.getElementById("save-status");
  const photoGallery = document.getElementById("photo-gallery");

  const progressSummary = document.getElementById("progress-summary");

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
      saveStatus.textContent =
        "Your session has expired. Please log in again.";
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
      saveStatus.textContent = "Uploading photo...";

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

      photoInput.value = "";
    }

    saveStatus.textContent = "Saved! ✓";

    await loadPhotos();
    await loadProgress();
  }

  function getNumber(id) {
    const element = document.getElementById(id);

    if (!element || element.value === "") {
      return null;
    }

    return Number(element.value);
  }

  async function loadPhotos() {
    if (!photoGallery) return;

    const {
      data: { user },
      error: userError
    } = await trackerSupabase.auth.getUser();

    if (userError || !user) {
      photoGallery.innerHTML =
        "<p>Please log in to view your photos.</p>";
      return;
    }

    const { data: files, error } = await trackerSupabase
      .storage
      .from("progress-photos")
      .list(user.id, {
        sortBy: {
          column: "created_at",
          order: "desc"
        }
      });

    if (error) {
      console.error("Photo list error:", error);
      photoGallery.innerHTML =
        "<p>Unable to load your photos.</p>";
      return;
    }

    photoGallery.innerHTML = "";

    if (!files || files.length === 0) {
      photoGallery.innerHTML =
        "<p>No progress photos yet.</p>";
      return;
    }

    for (const file of files) {
      const filePath = `${user.id}/${file.name}`;

      const {
        data: signedUrlData,
        error: signedUrlError
      } = await trackerSupabase
        .storage
        .from("progress-photos")
        .createSignedUrl(filePath, 3600);

      if (signedUrlError) {
        console.error("Signed URL error:", signedUrlError);
        continue;
      }

      const container = document.createElement("div");

      container.style.marginBottom = "24px";

      const image = document.createElement("img");

      image.src = signedUrlData.signedUrl;
      image.alt = "Progress photo";

      image.style.width = "100%";
      image.style.maxWidth = "400px";
      image.style.borderRadius = "12px";
      image.style.display = "block";

      const date = document.createElement("p");

      date.textContent = file.created_at
        ? new Date(file.created_at).toLocaleDateString()
        : "Progress photo";

      container.appendChild(date);
      container.appendChild(image);

      photoGallery.appendChild(container);
    }
  }

  async function loadProgress() {
    if (!progressSummary) return;

    const {
      data: { user },
      error: userError
    } = await trackerSupabase.auth.getUser();

    if (userError || !user) return;

    const { data, error } = await trackerSupabase
      .from("daily_checkins")
      .select("date, weight, mood, calories")
      .eq("user_id", user.id)
      .not("weight", "is", null)
      .order("date", { ascending: true });

    if (error) {
      console.error("Progress error:", error);
      progressSummary.innerHTML =
        "<p>Unable to load progress.</p>";
      return;
    }

    if (!data || data.length === 0) {
      progressSummary.innerHTML =
        "<p>No weight entries yet.</p>";
      return;
    }

    const firstWeight = Number(data[0].weight);
    const currentWeight = Number(data[data.length - 1].weight);

    const change = currentWeight - firstWeight;

    let changeText;

    if (change < 0) {
      changeText = `↓ ${Math.abs(change).toFixed(1)} kg`;
    } else if (change > 0) {
      changeText = `↑ ${change.toFixed(1)} kg`;
    } else {
      changeText = "No change";
    }

    let html = `
      <div class="progress-stats">
        <div>
          <strong>${currentWeight.toFixed(1)} kg</strong>
          <span>Current weight</span>
        </div>

        <div>
          <strong>${changeText}</strong>
          <span>Total change</span>
        </div>
      </div>

      <h3>Weight history</h3>

      <div class="weight-history">
    `;

    [...data].reverse().forEach(entry => {
      html += `
        <div class="weight-entry">
          <span>${formatDate(entry.date)}</span>
          <strong>${Number(entry.weight).toFixed(1)} kg</strong>
        </div>
      `;
    });

    html += "</div>";

    progressSummary.innerHTML = html;
  }

  function formatDate(dateString) {
    return new Date(
      dateString + "T00:00:00"
    ).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  saveButton.addEventListener("click", saveCheckin);

  loadPhotos();
  loadProgress();
})();
