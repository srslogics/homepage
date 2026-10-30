(() => {
  const form = document.getElementById("enquiry-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const body = `Name: ${fields.get("name").trim()}\nEmail: ${fields.get("email").trim()}\n\nProject idea:\n${fields.get("message").trim()}`;
    window.location.href = "mailto:founder@ss49d1t1tech.in?subject=Custom%20software%20project%20enquiry&body=" + encodeURIComponent(body);
    document.getElementById("enquiry-status").textContent = "Your email app should open with a draft. Nothing has been sent yet. If it does not open, email founder@ss49d1t1tech.in directly. Your entries remain here.";
  });
  document.getElementById("enquiry-controls").disabled = false;
})();
