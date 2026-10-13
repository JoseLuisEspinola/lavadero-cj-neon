const buscador = document.getElementById('buscador');
const cards = document.querySelectorAll('.card-article');
const mensaje = document.getElementById('mensaje-vacio');

buscador.addEventListener('input', function (e) {
    const texto = e.target.value.toLowerCase().trim();
    let hayCoincidencia = false;

    if (texto === '') {
        // Mostrar todas las cards y ocultar el mensaje
        cards.forEach(card => card.style.display = 'block');
        mensaje.classList.remove('visible');
        return;
    }

    // Primero evaluamos coincidencias
    const cardsCoincidentes = [];

    cards.forEach(card => {
        const titulo = card.querySelector('h3').textContent.toLowerCase();
        const coincide = titulo.includes(texto);

        if (coincide) {
          cardsCoincidentes.push(card);
        }
    });

    if (cardsCoincidentes.length > 0) {
        // Mostrar solo las cards que coinciden
        cards.forEach(card => {
          card.style.display = cardsCoincidentes.includes(card) ? 'block' : 'none';
        });
        mensaje.classList.remove('visible');
    } else {
        // No hay coincidencias: mostrar todas y el mensaje
        cards.forEach(card => card.style.display = 'block');
        mensaje.classList.add('visible');
    }
});
