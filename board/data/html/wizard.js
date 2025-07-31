let currentStep = 1;
let selectedSSID = "";

const pollWifiList = async (maxAttempts = 10, interval = 1000) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const scanSpinner = document.getElementById("scan-spinner");

      const res = await fetch("/scan-wifi");
      scanSpinner.classList.remove("hidden");
      const text = await res.text();
      console.log(`📡 Attempt ${attempt + 1}:`, text);

      // jos ei vielä valmis
      if (res.status === 202 || text === "Scan started") {
        await new Promise((resolve) => setTimeout(resolve, interval));
        continue;
      }

      // yritä jäsentää
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.networks)) {
        throw new Error("Invalid JSON structure: " + JSON.stringify(data));
      }

      // renderöi lista
      const list = document.getElementById("wifi-list");
      list.innerHTML = "";
      data.networks.forEach((network) => {
        const item = document.createElement("li");
        item.className = "wifi-item";
        item.textContent = network.ssid;
        item.onclick = () => openModal(network.ssid);
        list.appendChild(item);
      });

      return; // ✅ success
    } catch (err) {
      console.warn("⚠️ WiFi scan retry error:", err.message);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  console.error("❌ WiFi scan failed after max attempts");
};
const loadWifiList = () => {
  pollWifiList();
};

function openModal(ssid) {
  selectedSSID = ssid;
  document.getElementById("selected-ssid").innerText = ssid;
  document.getElementById("password-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("password-modal").classList.add("hidden");
  document.getElementById("wifi-password").value = "";
}

function showStep(step) {
  document.querySelectorAll(".step").forEach((el, index) => {
    const isActive = index === step - 1;
    el.classList.toggle("hidden", !isActive);

    // Disable inputs and remove required from inactive steps
    el.querySelectorAll("input").forEach((input) => {
      input.disabled = !isActive;
      if (isActive) {
        input.setAttribute("required", "");
      } else {
        input.removeAttribute("required");
      }
    });
  });

  if (step === 3) {
    const form = document.getElementById("setupForm");
    const formData = new FormData(form);
    const summary = [...formData.entries()]
      .filter(
        ([k, v]) => v && !document.querySelector(`input[name="${k}"]`).disabled
      )
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    document.getElementById("summaryBox").textContent = summary;
  }
}

function nextStep() {
  // Validate current step before advancing
  if (currentStep === 2) {
    // Validate user authentication before proceeding to step 3
    const form = document.getElementById("setupForm");
    const username = form.querySelector("input[name='username']").value.trim();
    const userPassword = form
      .querySelector("input[name='userPassword']")
      .value.trim();

    if (!username || !userPassword) {
      alert("Please enter username and password before proceeding.");
      return;
    }

    // Call authentication function instead of just advancing
    handleUserAuth(username, userPassword);
    return;
  }

  if (currentStep < 3) {
    currentStep++;
    showStep(currentStep);
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
}

function submitWifi() {
  const password = document.getElementById("wifi-password").value.trim();
  if (!password) {
    alert("Please enter WiFi password");
    return;
  }

  const wifiSpinner = document.getElementById("wifi-spinner");
  const wifiStatus = document.getElementById("wifi-status");

  wifiSpinner.classList.remove("hidden");
  wifiStatus.classList.add("hidden");
  closeModal();

  const formData = new FormData();
  formData.append("ssid", selectedSSID);
  formData.append("password", password);

  fetch("/connect-to-wifi", {
    method: "POST",
    body: formData,
  })
    .then((res) => {
      wifiSpinner.classList.add("hidden");
      if (res.ok) {
        wifiStatus.innerText = "✅ Connected to WiFi!";
        wifiStatus.className = "status success";
        wifiStatus.classList.remove("hidden");

        setTimeout(() => {
          currentStep++;
          showStep(currentStep);
        }, 1500);
      } else {
        wifiStatus.innerText = "❌ Connection failed. Check password.";
        wifiStatus.className = "status error";
        wifiStatus.classList.remove("hidden");
      }
    })
    .catch((err) => {
      console.error("WiFi error:", err);
      wifiSpinner.classList.add("hidden");
      wifiStatus.innerText = "❌ Network error. Try again.";
      wifiStatus.className = "status error";
      wifiStatus.classList.remove("hidden");
    });
}

function handleUserAuth(username, userPassword) {
  // Use the correct spinner elements from HTML
  const authSpinner = document.getElementById("auth-spinner");
  const authStatus = document.getElementById("auth-status");

  authSpinner.classList.remove("hidden");
  authStatus.classList.add("hidden");

  const formData = new FormData();
  formData.append("username", username);
  formData.append("userPassword", userPassword);

  fetch("/link-device", {
    method: "POST",
    body: formData,
  })
    .then((res) => {
      authSpinner.classList.add("hidden");
      if (res.ok) {
        authStatus.innerText = "✅ Device linked to user!";
        authStatus.className = "status success";
        authStatus.classList.remove("hidden");

        // Auto advance to next step after delay
        setTimeout(() => {
          currentStep++;
          showStep(currentStep);
        }, 1500);
      } else {
        authStatus.innerText = "❌ Connection failed.";
        authStatus.className = "status error";
        authStatus.classList.remove("hidden");
      }
    })
    .catch((err) => {
      console.error("Network error:", err);
      authSpinner.classList.add("hidden");
      authStatus.innerText = "❌ Network error. Try again.";
      authStatus.className = "status error";
      authStatus.classList.remove("hidden");
    });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  showStep(currentStep);
  if (currentStep === 1) loadWifiList();
  // Handle final form submission
  document.getElementById("setupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (currentStep === 3) {
      // Send complete setup request
      fetch("/complete-setup", {
        method: "POST",
      })
        .then((res) => {
          console.log("Status:", res.status);
          return res.text();
        })
        .then((text) => {
          console.log("Body:", text);
          alert(
            "✅ Setup complete! Device will restart and connect to your WiFi network."
          );
        })
        .catch((err) => {
          console.error("Setup completion failed:", err);
          alert("❌ Setup completion failed. Please try again.");
        });
    }
  });
});
