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

  document.addEventListener('DOMContentLoaded', () => {
    setupRevealAnimations();
    setupPhoneMask();
  });
})();
