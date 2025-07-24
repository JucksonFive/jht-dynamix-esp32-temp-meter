let currentStep = 1;

function showStep(step) {
  document.querySelectorAll(".step").forEach((el, i) => {
    el.classList.toggle("hidden", i !== step - 1);
  });
}

function nextStep() {
  if (currentStep === 2) {
    // Generate summary
    const form = document.getElementById("setupForm");
    const data = new FormData(form);
    const summary = {
      ssid: data.get("ssid"),
      username: data.get("username"),
    };
    document.getElementById("summaryBox").textContent = JSON.stringify(summary, null, 2);
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

document.getElementById("setupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const body = JSON.stringify({
    ssid: data.get("ssid"),
    password: data.get("password"),
    username: data.get("username"),
    userPassword: data.get("userPassword"),
  });

  await fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  alert("Configuration sent. Device will restart.");
});
