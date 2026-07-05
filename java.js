(function () {
  const header = document.getElementById('header');
  const mobileMenu = document.getElementById('mobileMenu');

  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  window.openMenu = function openMenu() {
    if (mobileMenu) mobileMenu.classList.add('open');
  };

  window.closeMenu = function closeMenu() {
    if (mobileMenu) mobileMenu.classList.remove('open');
  };

  function setupRevealAnimations() {
    const revealElements = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('visible'));
      return;
    }

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach((el) => revealObserver.observe(el));
  }

  function onlyDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatPhone(value) {
    const digits = onlyDigits(value).slice(0, 11);
    if (!digits) return '';

    if (digits.length <= 2) return `(${digits}`;

    const ddd = digits.slice(0, 2);
    const number = digits.slice(2);

    if (number.length <= 4) return `(${ddd}) ${number}`;
    if (number.length <= 8) return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;

    return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5, 9)}`;
  }

  function setupPhoneMask() {
    const input = document.getElementById('telefone');
    if (!input) return;

    input.addEventListener('input', () => {
      input.value = formatPhone(input.value);
    });
  }

  window.sendForm = function sendForm(event) {
    event.preventDefault();

    const form = event.target;
    const data = new FormData(form);
    const nome = data.get('nome') || '';
    const empresa = data.get('empresa') || '';
    const telefone = data.get('telefone') || '';
    const email = data.get('email') || '';
    const servico = data.get('servico') || '';
    const mensagem = data.get('mensagem') || '';

    const text = [
      'Ola! Gostaria de solicitar um orcamento.',
      '',
      `Nome: ${nome}`,
      `Empresa: ${empresa}`,
      `Telefone: ${telefone}`,
      `E-mail: ${email}`,
      `Servico: ${servico}`,
      `Mensagem: ${mensagem}`
    ].join('\n');

    window.open(`https://wa.me/5547999464635?text=${encodeURIComponent(text)}`, '_blank');
    form.reset();
  };

  // ==========================================================
  // CARROSSEL DE IMAGENS - secao Experiencia
  // ==========================================================
  // Para adicionar as imagens de cada bloco, preencha o array
  // correspondente abaixo com os caminhos dos arquivos, na ordem
  // em que aparecem os cards na secao #experiencia:
  // 1) Central de Residuos
  // 2) Central de Cavacos
  // 3) Fundicoes
  // 4) Usinagem
  // 5) Areas Externas e Jardins Corporativos
  //
  // Exemplo:
  // [ 'assets/residuos-1.png', 'assets/residuos-2.png' ]
  const experienciaImages = [
    [], // Central de Residuos
    [], // Central de Cavacos
    [], // Fundicoes
    [], // Usinagem
    []  // Areas Externas e Jardins Corporativos
  ];

  function buildCarousel(carouselEl, images) {
    const track = carouselEl.querySelector('.carousel-track');
    const dotsWrap = carouselEl.querySelector('.carousel-dots');
    if (!track || !images || !images.length) return;

    track.innerHTML = images
      .map((src) => `<div class="carousel-slide" style="background-image:url('${src}')"></div>`)
      .join('');

    dotsWrap.innerHTML = images
      .map((_, i) => `<span class="${i === 0 ? 'active' : ''}" data-index="${i}"></span>`)
      .join('');

    carouselEl.dataset.index = '0';

    dotsWrap.querySelectorAll('span').forEach((dot) => {
      dot.addEventListener('click', () => {
        goToSlide(carouselEl, parseInt(dot.dataset.index, 10));
      });
    });
  }

  function goToSlide(carouselEl, index) {
    const track = carouselEl.querySelector('.carousel-track');
    const slides = track.querySelectorAll('.carousel-slide');
    const dots = carouselEl.querySelectorAll('.carousel-dots span');
    if (!slides.length) return;

    const total = slides.length;
    const newIndex = (index + total) % total;

    track.style.transform = `translateX(-${newIndex * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === newIndex));
    carouselEl.dataset.index = String(newIndex);
  }

  window.carouselMove = function carouselMove(btn, direction) {
    const carouselEl = btn.closest('[data-carousel]');
    if (!carouselEl) return;
    const current = parseInt(carouselEl.dataset.index || '0', 10);
    goToSlide(carouselEl, current + direction);
  };

  function setupCarousels() {
    const carousels = document.querySelectorAll('#experiencia [data-carousel]');
    carousels.forEach((el, i) => buildCarousel(el, experienciaImages[i]));
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupRevealAnimations();
    setupPhoneMask();
    setupCarousels();
    setupExpCarousel();
  });

  // ==========================================================
  // CARROSSEL DE BLOCOS - secao Experiencia
  // ==========================================================
  let expIndex = 0;

  function getExpVisibleCount() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 980) return 2;
    return 3;
  }

  function getExpTotal() {
    const track = document.getElementById('expCarouselTrack');
    return track ? track.children.length : 0;
  }

  function getExpMaxIndex() {
    const total = getExpTotal();
    const visible = getExpVisibleCount();
    return Math.max(0, total - visible);
  }

  function renderExpDots() {
    const dotsWrap = document.getElementById('expCarouselDots');
    if (!dotsWrap) return;
    const maxIndex = getExpMaxIndex();
    const count = maxIndex + 1;

    dotsWrap.innerHTML = Array.from({ length: count })
      .map((_, i) => `<span class="${i === expIndex ? 'active' : ''}" data-index="${i}"></span>`)
      .join('');

    dotsWrap.querySelectorAll('span').forEach((dot) => {
      dot.addEventListener('click', () => {
        expIndex = parseInt(dot.dataset.index, 10);
        updateExpCarousel();
      });
    });
  }

  function updateExpCarousel() {
    const track = document.getElementById('expCarouselTrack');
    if (!track) return;

    const maxIndex = getExpMaxIndex();
    const total = maxIndex + 1;
    expIndex = ((expIndex % total) + total) % total;

    const card = track.children[0];
    if (!card) return;

    const cardWidth = card.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap || '22');
    const offset = expIndex * (cardWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;

    const dotsWrap = document.getElementById('expCarouselDots');
    if (dotsWrap) {
      dotsWrap.querySelectorAll('span').forEach((dot, i) => {
        dot.classList.toggle('active', i === expIndex);
      });
    }
  }

  window.expCarouselMove = function expCarouselMove(direction) {
    const maxIndex = getExpMaxIndex();
    const total = maxIndex + 1;
    expIndex = ((expIndex + direction) % total + total) % total;
    updateExpCarousel();
  };

  function setupExpCarousel() {
    if (!document.getElementById('expCarouselTrack')) return;
    renderExpDots();
    updateExpCarousel();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderExpDots();
        updateExpCarousel();
      }, 150);
    });
  }
})();