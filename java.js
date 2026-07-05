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
  // CARROSSEL DE EXPERIENCIA (estilo hero com vidro)
  // ==========================================================
  // Para definir a imagem de fundo de cada slide, preencha o
  // array abaixo com o caminho do arquivo, na mesma ordem dos
  // slides no HTML:
  // 1) Central de Residuos
  // 2) Central de Cavacos
  // 3) Fundicoes
  // 4) Usinagem
  // 5) Areas Externas e Jardins Corporativos
  //
  // Exemplo: 'assets/foto8.png'
  // Deixe null para manter o fundo em gradiente (sem imagem).
  const experienciaImages = [
    'assets/central_de_residuos.png', // Central de Residuos
    null, // Central de Cavacos
    null, // Fundicoes
    null, // Usinagem
    null  // Areas Externas e Jardins Corporativos
  ];

  let expIndex = 0;
  let expAutoplayTimer = null;

  function applyExpImages() {
    const slides = document.querySelectorAll('#expCarouselTrack .hero-slide');
    slides.forEach((slide, i) => {
      const src = experienciaImages[i];
      if (src) slide.style.backgroundImage = `url('${src}')`;
    });
  }

  function renderExpDots() {
    const dotsWrap = document.getElementById('expCarouselDots');
    const track = document.getElementById('expCarouselTrack');
    if (!dotsWrap || !track) return;
    const total = track.children.length;

    dotsWrap.innerHTML = Array.from({ length: total })
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

    const total = track.children.length;
    expIndex = ((expIndex % total) + total) % total;

    track.style.transform = `translateX(-${expIndex * 100}%)`;

    const dotsWrap = document.getElementById('expCarouselDots');
    if (dotsWrap) {
      dotsWrap.querySelectorAll('span').forEach((dot, i) => {
        dot.classList.toggle('active', i === expIndex);
      });
    }
  }

  window.expCarouselMove = function expCarouselMove(direction) {
    const track = document.getElementById('expCarouselTrack');
    if (!track) return;
    const total = track.children.length;
    expIndex = ((expIndex + direction) % total + total) % total;
    updateExpCarousel();
    restartExpAutoplay();
  };

  function restartExpAutoplay() {
    if (expAutoplayTimer) clearInterval(expAutoplayTimer);
    expAutoplayTimer = setInterval(() => {
      const track = document.getElementById('expCarouselTrack');
      if (!track) return;
      const total = track.children.length;
      expIndex = (expIndex + 1) % total;
      updateExpCarousel();
    }, 6000);
  }

  function setupExpCarousel() {
    if (!document.getElementById('expCarouselTrack')) return;
    applyExpImages();
    renderExpDots();
    updateExpCarousel();
    restartExpAutoplay();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupRevealAnimations();
    setupPhoneMask();
    setupExpCarousel();
  });
})();