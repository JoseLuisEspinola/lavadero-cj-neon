document.addEventListener('DOMContentLoaded', function() {
    var checkbox = document.getElementById('check');
    var checkbtn = document.querySelector('.checkbtn');
    var faBars = checkbtn.querySelector('.fa-bars');
    var faTimes = checkbtn.querySelector('.fa-times');

    function toggleIcons() {
        if (checkbox.checked) {
            faBars.style.display = 'none';
            faTimes.style.display = 'block';
        } else {
            faBars.style.display = 'block';
            faTimes.style.display = 'none';
        }
    }

    // Inicializa los íconos al cargar la página
    toggleIcons();

    // Escucha cambios en el estado del checkbox
    checkbox.addEventListener('change', toggleIcons);
});