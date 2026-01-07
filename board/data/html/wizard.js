let currentStep = 1;
let selectedSSID = "";

let step2WifiGateToken = 0;

let isWifiSubmitting = false;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWifiStatusOnce() {
  try {
    const res = await fetch("/wifi-status");
    const text = await res.text();
    const data = JSON.parse(text);
    return data?.status ?? null;
  } catch {
    return null;
  }
}

async function waitForWifiConnected(
  maxAttempts = 60,
  intervalMs = 1000,
  onProgress
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const st = await getWifiStatusOnce();
    if (st === "connected") return "connected";
    if (st === "failed") return "failed";
    if (typeof onProgress === "function") onProgress(st, attempt);
    await sleep(intervalMs);
  }
  return "timeout";
}

function setWifiModalLoading(isLoading) {
  const connectBtn = document.getElementById("wifi-connect-btn");
  const cancelBtn = document.getElementById("wifi-cancel-btn");
  const pwd = document.getElementById("wifi-password");

  if (connectBtn) {
    if (!connectBtn.dataset.defaultText) {
      connectBtn.dataset.defaultText = connectBtn.textContent || "Connect";
    }
    connectBtn.textContent = isLoading
      ? "Connecting..."
      : connectBtn.dataset.defaultText;
    connectBtn.disabled = isLoading;
    connectBtn.setAttribute("aria-disabled", isLoading.toString());
  }

  if (cancelBtn) {
    cancelBtn.disabled = isLoading;
    cancelBtn.setAttribute("aria-disabled", isLoading.toString());
  }

  if (pwd) pwd.disabled = isLoading;
}

function setStep2NextEnabled(enabled) {
  const btn = document.getElementById("step2-next");
  if (!btn) return;
  btn.disabled = !enabled;
  btn.setAttribute("aria-disabled", (!enabled).toString());
}

async function watchStep2WifiGate() {
  const token = ++step2WifiGateToken;
  setStep2NextEnabled(false);

  while (currentStep === 2 && token === step2WifiGateToken) {
    const st = await getWifiStatusOnce();
    const isConnected = st === "connected";
    setStep2NextEnabled(isConnected);
    if (isConnected) return;
    await sleep(1000);
  }
}

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
        await sleep(interval);
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
      for (const network of data.networks) {
        const item = document.createElement("li");
        item.className = "wifi-item";
        item.textContent = network.ssid;
        item.onclick = () => openModal(network.ssid);
        list.appendChild(item);
      }

      return;
    } catch (err) {
      console.warn("⚠️ WiFi scan retry error:", err.message);
      await sleep(interval);
    }
  }

  console.error("❌ WiFi scan failed after max attempts");
};
const loadWifiList = () => {
  pollWifiList();
};

function openModal(ssid) {
  const scanSpinner = document.getElementById("scan-spinner");
  selectedSSID = ssid;

  isWifiSubmitting = false;
  setWifiModalLoading(false);

  document.getElementById("selected-ssid").innerText = ssid;
  document.getElementById("password-modal").classList.remove("hidden");
  scanSpinner.classList.add("hidden");
  // Focus password field and enable Enter submit
  const pwd = document.getElementById("wifi-password");
  if (pwd) {
    pwd.value = "";
    pwd.focus();
  }
}

function closeModal() {
  if (isWifiSubmitting) return;
  const scanSpinner = document.getElementById("scan-spinner");
  document.getElementById("password-modal").classList.add("hidden");
  document.getElementById("wifi-password").value = "";
  scanSpinner.classList.add("hidden");
}

function showStep(step) {
  const steps = document.querySelectorAll(".step");
  let index = 0;
  for (const el of steps) {
    const isActive = index === step - 1;
    el.classList.toggle("hidden", !isActive);

    // Disable inputs and remove required from inactive steps
    for (const input of el.querySelectorAll("input")) {
      input.disabled = !isActive;
      if (isActive) {
        input.setAttribute("required", "");
      } else {
        input.removeAttribute("required");
      }
    }
    index++;
  }

  // Step 2: keep Next disabled until WiFi is actually connected
  if (step === 2) {
    watchStep2WifiGate();
  } else {
    // Stop any running Step2 watcher
    step2WifiGateToken++;
  }

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
    const deviceId = form.querySelector("input[name='deviceId']").value.trim();
    if (!username || !userPassword || !deviceId) {
      alert(
        "Please enter username, password, and device ID before proceeding."
      );
      return;
    }

    // Call authentication function instead of just advancing
    handleUserAuth(username, userPassword, deviceId);
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
  if (isWifiSubmitting) return;
  const password = document.getElementById("wifi-password").value.trim();
  if (!password) {
    alert("Please enter WiFi password");
    return;
  }

  isWifiSubmitting = true;
  setWifiModalLoading(true);

  const wifiSpinner = document.getElementById("wifi-spinner");
  const wifiStatus = document.getElementById("wifi-status");

  // Loading is shown on the modal button; keep modal open.
  wifiSpinner.classList.add("hidden");
  wifiStatus.classList.add("hidden");

  const formData = new FormData();
  formData.append("ssid", selectedSSID);
  formData.append("password", password);

  fetch("/connect-to-wifi", {
    method: "POST",
    body: formData,
  })
    .then((res) => {
      if (res.status === 200 || res.status === 202) {
        // Always verify connection status before advancing to Step 2
        pollWifiConnectionStatus(wifiSpinner, wifiStatus);
        return;
      }

      isWifiSubmitting = false;
      setWifiModalLoading(false);

      wifiSpinner.classList.add("hidden");
      wifiStatus.innerText = "❌ Connection request failed.";
      wifiStatus.className = "status error";
      wifiStatus.classList.remove("hidden");
    })
    .catch((err) => {
      console.error("WiFi error:", err);

      isWifiSubmitting = false;
      setWifiModalLoading(false);

      wifiSpinner.classList.add("hidden");
      wifiStatus.innerText = "❌ Network error. Try again.";
      wifiStatus.className = "status error";
      wifiStatus.classList.remove("hidden");
    });
}

async function pollWifiConnectionStatus(
  spinnerEl,
  statusEl,
  maxAttempts = 60,
  intervalMs = 1000
) {
  const result = await waitForWifiConnected(maxAttempts, intervalMs, () =>
    statusEl.classList.add("hidden")
  );

  isWifiSubmitting = false;
  setWifiModalLoading(false);

  if (result === "connected") {
    spinnerEl.classList.add("hidden");
    statusEl.innerText = "✅ Connected to WiFi!";
    statusEl.className = "status success";
    statusEl.classList.remove("hidden");

    closeModal();

    setTimeout(() => {
      // Only advance from Step 1 -> Step 2; never increment blindly
      if (currentStep === 1) {
        currentStep = 2;
        showStep(currentStep);
      }
    }, 1500);
    return;
  }

  spinnerEl.classList.add("hidden");
  statusEl.innerText =
    result === "failed"
      ? "❌ Incorrect password or network unreachable."
      : "❌ Timeout waiting for WiFi connection.";
  statusEl.className = "status error";
  statusEl.classList.remove("hidden");

  const pwd = document.getElementById("wifi-password");
  if (pwd) {
    pwd.value = "";
    pwd.focus();
  }
}

async function handleUserAuth(username, userPassword, deviceId) {
  // Use the correct spinner elements from HTML
  const authSpinner = document.getElementById("auth-spinner");
  const authStatus = document.getElementById("auth-status");

  authSpinner.classList.remove("hidden");
  authStatus.innerText = "⏳ Waiting for WiFi connection...";
  authStatus.className = "status";
  authStatus.classList.remove("hidden");

  const wifiResult = await waitForWifiConnected(30, 1000);
  if (wifiResult !== "connected") {
    authSpinner.classList.add("hidden");
    authStatus.innerText =
      wifiResult === "failed"
        ? "❌ WiFi connection failed. Please reconnect WiFi first."
        : "❌ WiFi not connected yet. Please wait and try again.";
    authStatus.className = "status error";
    authStatus.classList.remove("hidden");
    return;
  }

  authStatus.classList.add("hidden");

  const formData = new FormData();
  formData.append("username", username);
  formData.append("userPassword", userPassword);
  formData.append("deviceId", deviceId);

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
          currentStep = 3;
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
  // Global key handler for Enter inside password modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const modal = document.getElementById("password-modal");
      if (!modal.classList.contains("hidden")) {
        e.preventDefault();
        submitWifi();
      }
    }
  });
  // Handle final form submission
  document.getElementById("setupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (currentStep === 3) {
      // Show immediate feedback
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Completing setup...";
      }

      // Send complete setup request
      fetch("/complete-setup", {
        method: "POST",
      })
        .then((res) => {
          if (res.ok) {
            // Success - device will restart
            showSuccessMessage();
          } else {
            throw new Error("Setup failed");
          }
        })
        .catch((err) => {
          // Connection closed - this is EXPECTED when device restarts!
          // NetworkError means the device restarted before sending response
          console.log("Connection closed (expected - device restarting):", err);

          // Show success message anyway
          showSuccessMessage();
        });
    }
  });
});

function showSuccessMessage() {
  // Replace form with success message
  const form = document.getElementById("setupForm");
  form.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <h2 style="color: #10b981;">✅ Setup Complete!</h2>
      <p style="margin: 1rem 0;">Device is restarting and connecting to your WiFi network.</p>
      <p style="margin: 1rem 0;">You can now close this page.</p>
      <p style="margin: 1rem 0; font-size: 0.9em; color: #666;">
        The device will appear in your dashboard within a few moments.
      </p>
    </div>
  `;
}
