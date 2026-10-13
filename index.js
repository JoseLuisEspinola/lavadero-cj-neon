const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');
const year = document.querySelector('#current-year');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (header && menuToggle && siteNav) {
  function closeMenu() {
    header.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
  }

  menuToggle.addEventListener('click', function () {
    const isOpen = header.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });

  siteNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeMenu();
      menuToggle.focus();
    }
  });

  document.addEventListener('click', function (event) {
    if (!header.contains(event.target)) {
      closeMenu();
    }
  });
}

if (header) {
  function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach(function (element) {
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach(function (element) {
    element.classList.add('is-visible');
  });
}

const heroCarousel = document.querySelector('.hero-image-wrap');

if (heroCarousel) {
  let currentSlide = heroCarousel.querySelector('.hero-slide--active');
  let incomingSlide = heroCarousel.querySelector('.hero-slide:not(.hero-slide--active)');
  const slideCaption = heroCarousel.querySelector('.caption-text');
  const dots = Array.from(heroCarousel.querySelectorAll('.carousel-dot'));
  const slides = [
    {
      src: './img/carrusel02.jpg',
      alt: 'Lavado cuidadoso de un vehículo',
      caption: 'Lavado con cuidado'
    },
    {
      src: './img/carrusel05.jpg',
      alt: 'Mecánica ligera y revisión del motor de un vehículo',
      caption: 'Mecánica ligera'
    },
    {
      src: './img/carrusel06.jpg',
      alt: 'Pulido y cuidado de la pintura de un vehículo',
      caption: 'Detalles de pintura'
    }
  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = 0;
  let directionInProgress = 1;
  let isAnimating = false;
  let autoAdvance;

  function updateCarouselControls() {
    dots.forEach(function (dot, index) {
      const isCurrent = index === currentIndex;
      dot.classList.toggle('is-active', isCurrent);
      dot.setAttribute('aria-pressed', String(isCurrent));
    });
    currentSlide.alt = slides[currentIndex].alt;
    currentSlide.removeAttribute('aria-hidden');
    incomingSlide.alt = '';
    incomingSlide.setAttribute('aria-hidden', 'true');
    slideCaption.textContent = slides[currentIndex].caption;
  }

  function showSlide(index, direction) {
    if (isAnimating || index === currentIndex) return;

    isAnimating = true;
    directionInProgress = direction;
    const offClass = direction > 0 ? 'hero-slide--off-right' : 'hero-slide--off-left';
    const exitClass = direction > 0 ? 'hero-slide--exit-left' : 'hero-slide--exit-right';

    incomingSlide.className = `hero-slide hero-slide--no-transition ${offClass}`;
    incomingSlide.src = slides[index].src;
    incomingSlide.alt = slides[index].alt;
    incomingSlide.removeAttribute('aria-hidden');

    if (reducedMotion.matches) {
      finishSlide(index);
      return;
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        incomingSlide.classList.remove('hero-slide--no-transition', offClass);
        incomingSlide.classList.add('hero-slide--active');
        currentSlide.classList.add(exitClass);
      });
    });
    currentIndex = index;
  }

  function finishSlide(index) {
    const resetSide = directionInProgress > 0
      ? 'hero-slide--off-right'
      : 'hero-slide--off-left';

    currentSlide.className = `hero-slide hero-slide--no-transition ${resetSide}`;
    incomingSlide.className = 'hero-slide hero-slide--active';
    currentIndex = index;
    [currentSlide, incomingSlide] = [incomingSlide, currentSlide];
    isAnimating = false;
    updateCarouselControls();

    requestAnimationFrame(function () {
      incomingSlide.classList.remove('hero-slide--no-transition');
    });
  }

  function onTransitionEnd(event) {
    if (event.target !== incomingSlide ||
        event.propertyName !== 'transform' ||
        !isAnimating) {
      return;
    }

    finishSlide(currentIndex);
  }

  heroCarousel.querySelectorAll('.hero-slide').forEach(function (slide) {
    slide.addEventListener('transitionend', onTransitionEnd);
  });

  heroCarousel.querySelectorAll('.carousel-arrow').forEach(function (button) {
    button.addEventListener('click', function () {
      const direction = Number(button.dataset.carouselDirection);
      const nextIndex = (currentIndex + direction + slides.length) % slides.length;
      showSlide(nextIndex, direction);
      restartAutoAdvance();
    });
  });

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      const nextIndex = Number(dot.dataset.carouselIndex);
      const direction = nextIndex > currentIndex ? 1 : -1;
      showSlide(nextIndex, direction);
      restartAutoAdvance();
    });
  });

  function stopAutoAdvance() {
    window.clearInterval(autoAdvance);
    autoAdvance = undefined;
  }

  function restartAutoAdvance() {
    stopAutoAdvance();
    if (reducedMotion.matches ||
        document.hidden ||
        heroCarousel.matches(':hover') ||
        heroCarousel.contains(document.activeElement)) {
      return;
    }

    autoAdvance = window.setInterval(function () {
      showSlide((currentIndex + 1) % slides.length, 1);
    }, 6500);
  }

  heroCarousel.addEventListener('mouseenter', stopAutoAdvance);
  heroCarousel.addEventListener('mouseleave', restartAutoAdvance);
  heroCarousel.addEventListener('focusin', stopAutoAdvance);
  heroCarousel.addEventListener('focusout', function (event) {
    if (!heroCarousel.contains(event.relatedTarget)) {
      restartAutoAdvance();
    }
  });
  document.addEventListener('visibilitychange', restartAutoAdvance);
  reducedMotion.addEventListener('change', restartAutoAdvance);

  updateCarouselControls();
  restartAutoAdvance();
}
