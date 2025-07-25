let currentStep = 1;

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

function handleWifiSubmit() {
  const form = document.getElementById("setupForm");
  const ssid = form.querySelector("input[name='ssid']").value.trim();
  const password = form.querySelector("input[name='password']").value.trim();

  if (!ssid || !password) {
    alert("Please enter SSID and password.");
    return;
  }

  // Use the correct spinner elements from HTML
  const wifiSpinner = document.getElementById("wifi-spinner");
  const wifiStatus = document.getElementById("wifi-status");

  wifiSpinner.classList.remove("hidden");
  wifiStatus.classList.add("hidden");

  const formData = new FormData();
  formData.append("ssid", ssid);
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

        // Auto advance to next step after delay
        setTimeout(() => {
          currentStep++;
          showStep(currentStep);
        }, 1500);
      } else {
        wifiStatus.innerText = "❌ Connection failed. Check SSID/password.";
        wifiStatus.className = "status error";
        wifiStatus.classList.remove("hidden");
      }
    })
    .catch((err) => {
      console.error("Network error:", err);
      wifiSpinner.classList.add("hidden");
      wifiStatus.innerText = "❌ Network error. Try again.";
      wifiStatus.className = "status error";
      wifiStatus.classList.remove("hidden");
    });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  showStep(currentStep);

  // Handle final form submission
  document.getElementById("setupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (currentStep === 3) {
      // Send complete setup request
      fetch("/complete-setup", {
        method: "POST",
      })
        .then((res) => {
          if (res.ok) {
            alert(
              "✅ Setup complete! Device will restart and connect to your WiFi network."
            );
          } else {
            alert("❌ Setup completion failed.");
          }
        })
        .catch((err) => {
          console.error("Setup completion failed:", err);
          alert("❌ Setup completion failed. Please try again.");
        });
    }
  });
});
