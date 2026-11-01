(() => {
  const form = document.getElementById("enquiry-form");
  if (!form) return;
  const status = document.getElementById("enquiry-status");
  function enquiry() {
    const fields = new FormData(form);
    return `Name: ${fields.get("name").trim()}\nEmail: ${fields.get("email").trim()}\n\nProject idea:\n${fields.get("message").trim()}`;
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const url = "mailto:founder@ss49d1t1tech.in?subject=Custom%20software%20project%20enquiry&body=" + encodeURIComponent(enquiry());
    if (url.length > 1800) {
      status.textContent = "Your enquiry is too long for a reliable email link. Use Copy enquiry and paste it into an email to founder@ss49d1t1tech.in. Nothing has been sent.";
      return;
    }
    window.location.href = url;
    status.textContent = "Your email app should open with a draft. Review and send it there. If it does not open, use Copy enquiry and paste it into your email. Nothing has been sent by this website.";
  });
  document.getElementById("copy-enquiry").addEventListener("click", async () => {
    if (!form.reportValidity()) return;
    try {
      await navigator.clipboard.writeText(enquiry());
      status.textContent = "Enquiry copied. Paste it into an email to founder@ss49d1t1tech.in and send it when ready. Nothing has been sent yet.";
    } catch {
      status.textContent = "Copying is unavailable. Your entries remain here; copy them manually into an email to founder@ss49d1t1tech.in.";
    }
  });
  document.getElementById("enquiry-controls").disabled = false;
})();
