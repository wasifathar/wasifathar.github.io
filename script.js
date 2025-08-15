document.addEventListener("DOMContentLoaded", () => {
  const gate = document.getElementById("gate");
  const profiles = document.querySelectorAll(".profile");
  const yearSpan = document.getElementById("year");

  // Set current year in footer
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Click on profile
  profiles.forEach(profile => {
    profile.addEventListener("click", () => {
      // Add fade-out effect
      gate.style.transition = "opacity 0.7s ease";
      gate.style.opacity = "0";
      setTimeout(() => {
        gate.style.display = "none";
      }, 700);
    });
  });
});
