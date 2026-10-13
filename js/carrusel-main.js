let imagenActual = document.getElementById('imagenFondo');
let imagenSiguiente = document.getElementById('imagenFondoSiguiente');
const botonAnterior = document.getElementById('imagenAnterior');
const botonSiguiente = document.getElementById('imagenSiguiente');

const imagenes = [
    '/img/carrusel01.jpg',
    '/img/carrusel02.jpg',
    '/img/carrusel03.jpg',
    '/img/carrusel04.jpg',
    '/img/carrusel05.jpg',
    '/img/carrusel06.jpg'
];

if (imagenActual && imagenSiguiente && botonAnterior && botonSiguiente) {
    let indiceActual = 0;
    let animando = false;
    let temporizador;

    imagenActual.src = imagenes[indiceActual];

    function cambiarImagen(direccion) {
        if (animando) return;

        animando = true;
        const indiceDestino = (indiceActual + direccion + imagenes.length) % imagenes.length;
        const entraDesdeLaDerecha = direccion > 0;
        const claseFuera = entraDesdeLaDerecha
            ? 'imagen-fondo--fuera-derecha'
            : 'imagen-fondo--fuera-izquierda';
        const claseSale = entraDesdeLaDerecha
            ? 'imagen-fondo--sale-izquierda'
            : 'imagen-fondo--sale-derecha';

        imagenSiguiente.className = `imagen-fondo imagen-fondo--sin-transicion ${claseFuera}`;
        imagenSiguiente.src = imagenes[indiceDestino];

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                imagenSiguiente.classList.remove('imagen-fondo--sin-transicion', claseFuera);
                imagenSiguiente.classList.add('imagen-fondo--entra');
                imagenActual.classList.add(claseSale);
            });
        });
    }

    function finalizarTransicion(event) {
        if (event.target !== imagenSiguiente ||
            event.propertyName !== 'transform' ||
            !animando) {
            return;
        }

        imagenActual.className = 'imagen-fondo imagen-fondo--sin-transicion imagen-fondo--fuera-derecha';
        imagenSiguiente.classList.remove('imagen-fondo--entra');
        [imagenActual, imagenSiguiente] = [imagenSiguiente, imagenActual];
        indiceActual = (indiceActual + direccionEnCurso + imagenes.length) % imagenes.length;
        animando = false;

        requestAnimationFrame(function () {
            imagenActual.classList.remove('imagen-fondo--sin-transicion');
        });
    }

    let direccionEnCurso = 1;

    function navegar(direccion) {
        if (animando) return;
        direccionEnCurso = direccion;
        cambiarImagen(direccion);
    }

    imagenActual.addEventListener('transitionend', finalizarTransicion);
    imagenSiguiente.addEventListener('transitionend', finalizarTransicion);
    botonAnterior.addEventListener('click', function () {
        navegar(-1);
        reiniciarTemporizador();
    });
    botonSiguiente.addEventListener('click', function () {
        navegar(1);
        reiniciarTemporizador();
    });

    function reiniciarTemporizador() {
        clearInterval(temporizador);
        temporizador = setInterval(function () {
            navegar(1);
        }, 5000);
    }

    reiniciarTemporizador();
}
