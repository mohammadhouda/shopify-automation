const form = document.getElementById("checkoutForm");
const statusContainer = document.createElement("div");
statusContainer.className = "status-container";
statusContainer.style.whiteSpace = "pre-line"; // Allow new lines
document.body.appendChild(statusContainer);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    productUrl: form.productUrl.value,
    shoeSize: form.shoeSize.value,
    checkoutInfo: {
      email: form.email.value,
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      address1: form.address1.value,
      city: form.city.value,
      state: form.state.value,
      zip: form.zip.value,
      phone: form.phone.value,
    },
    cardInfo: {
      number: form.cardNumber.value,
      expiry: form.expiry.value,
      cvc: form.cvc.value,
    },
  };

  statusContainer.textContent = ""; // Clear old logs

  const result = await window.electronAPI.startAutomation(formData);

  if (result === "success") {
    alert("Automation done!");
  } else {
    alert("Something went wrong.");
  }
});

window.electronAPI.onStatusUpdate((event, message) => {
  statusContainer.textContent += `${message}\n`;
  statusContainer.scrollTop = statusContainer.scrollHeight;
});
