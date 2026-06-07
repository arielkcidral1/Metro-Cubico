  const header = document.getElementById('header');
    const mobileMenu = document.getElementById('mobileMenu');
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 40));
    function openMenu(){ mobileMenu.classList.add('open'); }
    function closeMenu(){ mobileMenu.classList.remove('open'); }

    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } });
    }, { threshold:.12, rootMargin:'0px 0px -40px 0px' });
    revealElements.forEach(el => revealObserver.observe(el));

    function animateCounters(){
      document.querySelectorAll('.counter').forEach(el => {
        const target = Number(el.dataset.target);
        if(!target || el.dataset.done) return;
        el.dataset.done = 'true';
        const duration = 1300;
        const start = performance.now();
        const original = el.textContent;
        function tick(now){
          const progress = Math.min((now - start) / duration, 1);
          const value = Math.floor(target * (1 - Math.pow(1-progress, 3)));
          el.textContent = value.toLocaleString('pt-BR');
          if(progress < 1) requestAnimationFrame(tick); else el.textContent = original;
        }
        requestAnimationFrame(tick);
      });
    }
    const statsObserver = new IntersectionObserver((entries)=>{ entries.forEach(entry=>{ if(entry.isIntersecting){ animateCounters(); statsObserver.disconnect(); } }); }, {threshold:.4});
    const stats = document.querySelector('.stats-card'); if(stats) statsObserver.observe(stats);

    function sendForm(event){
      event.preventDefault();
      const data = new FormData(event.target);
      const nome = data.get('nome') || '';
      const empresa = data.get('empresa') || '';
      const telefone = data.get('telefone') || '';
      const email = data.get('email') || '';
      const servico = data.get('servico') || '';
      const mensagem = data.get('mensagem') || '';
      const text = `Olá! Gostaria de solicitar um orçamento.%0A%0ANome: ${nome}%0AEmpresa: ${empresa}%0ATelefone: ${telefone}%0AE-mail: ${email}%0AServiço: ${servico}%0AMensagem: ${mensagem}`;
      window.open(`https://wa.me/5547999464635?text=${encodeURIComponent(decodeURIComponent(text))}`, '_blank');
    }

    // Lógica de Filtros do Portfólio (Página Separada)
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        
        portfolioItems.forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
      });
    });