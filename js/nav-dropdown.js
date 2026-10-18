document.addEventListener('DOMContentLoaded', function () {
    var dropdowns = document.querySelectorAll('.nav-dropdown');

    function cerrar(dropdown) {
        var button = dropdown.querySelector('.nav-dropdown-toggle');
        dropdown.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
    }

    dropdowns.forEach(function (dropdown) {
        var button = dropdown.querySelector('.nav-dropdown-toggle');

        button.addEventListener('click', function () {
            var abrir = !dropdown.classList.contains('open');
            dropdowns.forEach(cerrar);
            if (abrir) {
                dropdown.classList.add('open');
                button.setAttribute('aria-expanded', 'true');
            }
        });

        dropdown.querySelectorAll('.nav-submenu a').forEach(function (link) {
            link.addEventListener('click', function () {
                cerrar(dropdown);
                var mobileMenu = document.getElementById('check');
                if (mobileMenu) mobileMenu.checked = false;
            });
        });
    });

    document.addEventListener('click', function (event) {
        dropdowns.forEach(function (dropdown) {
            if (!dropdown.contains(event.target)) cerrar(dropdown);
        });
    });

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        dropdowns.forEach(function (dropdown) {
            if (!dropdown.classList.contains('open')) return;
            cerrar(dropdown);
            dropdown.querySelector('.nav-dropdown-toggle').focus();
        });
    });
});
