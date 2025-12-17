document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const emailInput = document.getElementById("email");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 4000);
  }

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderActivities(data) {
    clearChildren(activitiesList);
    // Clear select options (keep the default)
    const currentValue = activitySelect.value || "";
    // remove existing dynamic options
    Array.from(activitySelect.querySelectorAll("option.dynamic")).forEach(o => o.remove());

    Object.keys(data).forEach((name) => {
      const a = data[name];

      // Card
      const card = document.createElement("div");
      card.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;
      card.appendChild(title);

      const desc = document.createElement("p");
      desc.textContent = a.description;
      card.appendChild(desc);

      const sched = document.createElement("p");
      sched.innerHTML = `<strong>Schedule:</strong> ${a.schedule}`;
      card.appendChild(sched);

      const cap = document.createElement("p");
      cap.innerHTML = `<strong>Capacity:</strong> ${a.participants.length} / ${a.max_participants}`;
      card.appendChild(cap);

      // Participants section
      const participantsWrap = document.createElement("div");
      participantsWrap.className = "participants";
      const pTitle = document.createElement("h5");
      pTitle.textContent = "Participants";
      participantsWrap.appendChild(pTitle);

      const list = document.createElement("ul");
      if (Array.isArray(a.participants) && a.participants.length > 0) {
        a.participants.forEach((email) => {
          const li = document.createElement("li");
          const badge = document.createElement("span");
          badge.className = "participant-badge";
          badge.textContent = email;

          const del = document.createElement("button");
          del.className = "participant-delete";
          del.title = "Remove participant";
          del.type = "button";
          del.innerHTML = "✖";
          del.addEventListener("click", (ev) => {
            ev.preventDefault();
            unregisterParticipant(name, email);
          });

          li.appendChild(badge);
          li.appendChild(del);
          list.appendChild(li);
        });
      } else {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "No participants yet.";
        list.appendChild(li);
      }
      participantsWrap.appendChild(list);
      card.appendChild(participantsWrap);

      activitiesList.appendChild(card);

      // Add to select
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      opt.className = "dynamic";
      activitySelect.appendChild(opt);
    });

    if (currentValue) activitySelect.value = currentValue;
  }

  async function loadActivities() {
    try {
      const res = await fetch("/activities");
      if (!res.ok) throw new Error("Failed to load activities");
      const data = await res.json();
      renderActivities(data);
    } catch (err) {
      showMessage(err.message, "error");
      activitiesList.innerHTML = "<p>Unable to load activities.</p>";
    }
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const url = `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = json.detail || json.message || "Failed to remove participant";
        throw new Error(detail);
      }
      showMessage(json.message || "Participant removed", "success");
      await loadActivities();
    } catch (err) {
      showMessage(err.message, "error");
    }
  }

  signupForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = emailInput.value.trim();
    const activityName = activitySelect.value;
    if (!email || !activityName) {
      showMessage("Please enter an email and select an activity.", "error");
      return;
    }

    try {
      const url = `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = json.detail || json.message || "Signup failed";
        throw new Error(detail);
      }
      showMessage(json.message || "Signed up successfully", "success");
      emailInput.value = "";
      // refresh activities to show updated participants
      await loadActivities();
    } catch (err) {
      showMessage(err.message, "error");
    }
  });

  // Initial load
  loadActivities();
});
