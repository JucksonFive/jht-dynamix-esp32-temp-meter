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
// // UUSI FUNKTIO: Käyttäjän autentikointi step 2:ssa
// function handleUserAuth() {
//   const form = document.getElementById("setupForm");
//   const username = form.querySelector("input[name='username']").value.trim();
//   const userPassword = form
//     .querySelector("input[name='userPassword']")
//     .value.trim();
//   const statusBox = document.getElementById("user-auth-status");

//   if (!username || !userPassword) {
//     alert("Please enter username and password.");
//     return;
//   }

//   statusBox.innerText = "Authenticating...";
//   statusBox.className = "status";
//   statusBox.classList.remove("hidden");

//   const formData = new FormData();
//   formData.append("username", username);
//   formData.append("userPassword", userPassword);

//   fetch("/link-device", {
//     method: "POST",
//     body: formData,
//   })
//     .then((res) => {
//       if (res.ok) {
//         statusBox.innerText = "✅ Authenticated!";
//         statusBox.className = "status success";
//         setTimeout(() => {
//           currentStep++;
//           showStep(currentStep);
//         }, 1200);
//       } else {
//         statusBox.innerText = "❌ Authentication failed.";
//         statusBox.className = "status error";
//       }
//     })
//     .catch((err) => {
//       console.error("Auth network error:", err);
//       statusBox.innerText = "❌ Network error. Try again.";
//       statusBox.className = "status error";
//     });
// }

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
