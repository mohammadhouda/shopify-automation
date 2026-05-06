const form = document.getElementById("checkoutForm");
const submitBtn = document.getElementById("submitBtn");
const statusLog = document.getElementById("statusLog");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    productUrl: form.productUrl.value.trim(),
    shoeSize: form.shoeSize.value.trim(),
    checkoutInfo: {
      email: form.email.value.trim(),
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      address1: form.address1.value.trim(),
      city: form.city.value.trim(),
      state: form.state.value.trim(),
      zip: form.zip.value.trim(),
      phone: form.phone.value.trim(),
    },
    cardInfo: {
      number: form.cardNumber.value.trim(),
      expiry: form.expiry.value.trim(),
      cvc: form.cvc.value.trim(),
    },
  };

  statusLog.textContent = "";
  statusLog.removeAttribute("hidden");
  submitBtn.disabled = true;
  submitBtn.textContent = "Running...";

  // Remove previous listener before adding a new one to prevent accumulation
  window.electronAPI.offStatusUpdate();
  window.electronAPI.onStatusUpdate((_event, message) => {
    statusLog.textContent += `${message}\n`;
    statusLog.scrollTop = statusLog.scrollHeight;
  });

  const result = await window.electronAPI.startAutomation(formData);

  submitBtn.disabled = false;
  submitBtn.textContent = "Run Task";

  statusLog.textContent += result === "success"
    ? "\n✓ Automation completed successfully.\n"
    : "\n✗ Automation encountered an error. Check the log above.\n";
});
