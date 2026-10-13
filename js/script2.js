document.getElementById("btnCotizar").addEventListener("click", () => {
  window.location.href = "https://wa.me/541176039395?text=Hola%20Nico,%20quiero%20una%20cotización";
});

document.getElementById("formContacto").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Gracias por tu mensaje, nos pondremos en contacto pronto.");
  e.target.reset();
});
