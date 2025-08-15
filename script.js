document.addEventListener("DOMContentLoaded", () => {
  const gate = document.getElementById("gate");
  const profiles = document.querySelectorAll(".profile");
  const yearSpan = document.getElementById("year");

  // Footer year
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Click on profile
  profiles.forEach(profile => {
    profile.addEventListener("click", () => {
      gate.style.transition = "opacity 0.7s ease, transform 0.7s ease";
      gate.style.opacity = "0";
      gate.style.transform = "translateY(-20px)";
      setTimeout(() => {
        gate.style.display = "none";
      }, 700);
    });
  });
});
