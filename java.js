(function () {
  const db = window.metroSupabase || null;

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

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('visible'));
  }

  function animateCounters() {
    document.querySelectorAll('.counter').forEach((el) => {
      const target = Number(el.dataset.target);
      if (!target || el.dataset.done) return;

      el.dataset.done = 'true';
      const duration = 1300;
      const start = performance.now();
      const original = el.textContent;

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const value = Math.floor(target * (1 - Math.pow(1 - progress, 3)));
        el.textContent = value.toLocaleString('pt-BR');

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = original;
        }
      }

      requestAnimationFrame(tick);
    });
  }

  const stats = document.querySelector('.stats-card');
  if (stats && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounters();
          statsObserver.disconnect();
        }
      });
    }, { threshold: 0.4 });
    statsObserver.observe(stats);
  }

  window.sendForm = function sendForm(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    const nome = data.get('nome') || '';
    const empresa = data.get('empresa') || '';
    const telefone = data.get('telefone') || '';
    const email = data.get('email') || '';
    const servico = data.get('servico') || '';
    const mensagem = data.get('mensagem') || '';
    const text = `Olá! Gostaria de solicitar um orçamento.\n\nNome: ${nome}\nEmpresa: ${empresa}\nTelefone: ${telefone}\nE-mail: ${email}\nServiço: ${servico}\nMensagem: ${mensagem}`;

    window.open(`https://wa.me/5547999464635?text=${encodeURIComponent(text)}`, '_blank');
  };

  function getPublicUrl(bucket, path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const { data } = db.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  function formatDate(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[char]);
  }

  async function loadPortfolioHighlights() {
    const container = document.getElementById('dynamic-portfolio-highlights');
    if (!db || !container) return;

    const { data, error } = await db
      .from('portfolio')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = data.map((item) => {
      const image = getPublicUrl('portfolio', item.imagem_url || item.imagem || item.image_path);
      const title = escapeHtml(item.titulo || item.titulo_projeto || 'Projeto');
      const category = escapeHtml(item.categoria || item.categoria_projeto || 'Portfólio');
      const description = escapeHtml(item.descricao || category);

      return `
        <article class="work reveal visible" style="background-image:url('${image}')">
          <div><h3>${title}</h3><p>${description}</p></div>
        </article>
      `;
    }).join('');
  }

  async function loadFullPortfolio() {
    const container = document.getElementById('dynamic-full-portfolio');
    if (!db || !container) return;

    const { data, error } = await db
      .from('portfolio')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = data.map((item) => {
      const image = getPublicUrl('portfolio', item.imagem_url || item.imagem || item.image_path);
      const title = escapeHtml(item.titulo || item.titulo_projeto || 'Projeto');
      const category = escapeHtml(item.categoria || item.categoria_projeto || 'Portfólio');

      return `
        <article class="work portfolio-item reveal visible" data-category="${category}" style="background-image:url('${image}')">
          <div><h3>${title}</h3><p>${category}</p></div>
        </article>
      `;
    }).join('');

    setupPortfolioFilters();
  }

  async function loadTestimonials() {
    const container = document.getElementById('dynamic-testimonials');
    if (!db || !container) return;

    const { data, error } = await db
      .from('avaliacoes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error || !data || data.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = data.map((item) => {
      const name = escapeHtml(item.nome || item.nome_comentador || 'Cliente');
      const company = escapeHtml(item.instituicao || item.instituicao_comentador || '');
      const comment = escapeHtml(item.comentario || item.comentario_avaliacao || '');

      return `
        <div class="quote reveal visible">
          <p>“${comment}”</p>
          <strong>${name}</strong>
          <span>${company}</span>
        </div>
      `;
    }).join('');
  }

  function setupPortfolioFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((button) => button.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        document.querySelectorAll('.portfolio-item').forEach((item) => {
          item.classList.toggle('hidden', filter !== 'all' && item.dataset.category !== filter);
        });
      });
    });
  }

  async function handleCurriculoSubmit(event) {
    event.preventDefault();
    if (!db) return;

    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const file = data.get('arquivo');

    button.disabled = true;
    button.textContent = 'Enviando...';

    try {
      const filePath = `${Date.now()}-${file.name}`;
      const upload = await db.storage.from('curriculos').upload(filePath, file);
      if (upload.error) throw upload.error;

      const insert = await db.from('curriculos').insert({
        nome: data.get('nome'),
        telefone: data.get('telefone'),
        email: data.get('email'),
        arquivo_url: filePath
      });
      if (insert.error) throw insert.error;

      alert('Obrigado! Seu currículo foi recebido.');
      form.reset();
    } catch (error) {
      alert(`Não foi possível enviar o currículo: ${error.message}`);
    } finally {
      button.disabled = false;
      button.textContent = 'Enviar Currículo';
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    const user = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;
    const errorBox = document.getElementById('login-error');

    if (user.toLowerCase() === 'alexandre' && password === 'Metro123') {
      if (errorBox) errorBox.style.display = 'none';
      document.getElementById('login-overlay').style.display = 'none';
      loadAdminData();
      return;
    }

    if (errorBox) errorBox.style.display = 'block';
  }

  async function protectAdmin() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.style.display = 'flex';
  }

  window.showTab = function showTab(tabId) {
    document.querySelectorAll('.admin-section').forEach((sec) => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.remove('active'));

    const section = document.getElementById(tabId);
    if (section) section.classList.add('active');
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
  };

  async function handleAdminPortfolioSubmit(event) {
    event.preventDefault();
    if (!db) return;

    const form = event.target;
    const data = new FormData(form);
    const file = data.get('imagem_projeto');
    const filePath = `${Date.now()}-${file.name}`;

    const upload = await db.storage.from('portfolio').upload(filePath, file);
    if (upload.error) {
      alert(upload.error.message);
      return;
    }

    const insert = await db.from('portfolio').insert({
      titulo: data.get('titulo_projeto'),
      categoria: data.get('categoria_projeto'),
      imagem_url: filePath
    });

    if (insert.error) {
      alert(insert.error.message);
      return;
    }

    alert('Projeto salvo com sucesso!');
    form.reset();
    loadAdminData();
  }

  async function handleAdminReviewSubmit(event) {
    event.preventDefault();
    if (!db) return;

    const form = event.target;
    const data = new FormData(form);
    const { error } = await db.from('avaliacoes').insert({
      nome: data.get('nome_comentador'),
      instituicao: data.get('instituicao_comentador'),
      comentario: data.get('comentario_avaliacao')
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert('Avaliação adicionada com sucesso!');
    form.reset();
    loadAdminData();
  }

  async function loadAdminData() {
    if (!db) return;
    await Promise.all([
      loadAdminCurriculos(),
      loadAdminPortfolio(),
      loadAdminAvaliacoes()
    ]);
  }

  async function loadAdminCurriculos() {
    const tbody = document.querySelector('#curriculos tbody');
    if (!db || !tbody) return;
    const { data, error } = await db
      .from('curriculos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-row">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-row">Nenhum currículo recebido.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((item) => {
      const fileUrl = getPublicUrl('curriculos', item.arquivo_url || item.arquivo);

      return `
        <tr>
          <td>${formatDate(item.created_at)}</td>
          <td>${escapeHtml(item.nome)}</td>
          <td>${escapeHtml(item.email)}</td>
          <td>${escapeHtml(item.telefone)}</td>
          <td><a href="${fileUrl}" class="btn-download" target="_blank" rel="noopener">Baixar</a></td>
        </tr>
      `;
    }).join('');
  }

  async function loadAdminPortfolio() {
    const tbody = document.getElementById('admin-portfolio-list');
    if (!db || !tbody) return;

    const { data, error } = await db
      .from('portfolio')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-row">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-row">Nenhum projeto cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((item) => {
      const filePath = item.imagem_url || item.imagem || item.image_path || '';
      const fileUrl = getPublicUrl('portfolio', filePath);

      return `
        <tr>
          <td>${formatDate(item.created_at)}</td>
          <td>${escapeHtml(item.titulo)}</td>
          <td>${escapeHtml(item.categoria)}</td>
          <td><a href="${fileUrl}" class="btn-download" target="_blank" rel="noopener">Abrir</a></td>
          <td><button type="button" class="btn-danger" onclick="deletePortfolioItem(${item.id}, '${encodeURIComponent(filePath)}')">Excluir</button></td>
        </tr>
      `;
    }).join('');
  }

  async function loadAdminAvaliacoes() {
    const tbody = document.getElementById('admin-avaliacoes-list');
    if (!db || !tbody) return;

    const { data, error } = await db
      .from('avaliacoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-row">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-row">Nenhuma avaliação cadastrada.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((item) => `
      <tr>
        <td>${formatDate(item.created_at)}</td>
        <td>${escapeHtml(item.nome)}</td>
        <td>${escapeHtml(item.instituicao)}</td>
        <td>${escapeHtml(item.comentario)}</td>
        <td><button type="button" class="btn-danger" onclick="deleteAvaliacao(${item.id})">Excluir</button></td>
      </tr>
    `).join('');
  }

  window.deletePortfolioItem = async function deletePortfolioItem(id, encodedFilePath) {
    if (!db || !confirm('Excluir este projeto?')) return;
    const filePath = decodeURIComponent(encodedFilePath || '');

    const { error } = await db.from('portfolio').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }

    if (filePath && !/^https?:\/\//i.test(filePath)) {
      await db.storage.from('portfolio').remove([filePath]);
    }

    loadAdminData();
  };

  window.deleteAvaliacao = async function deleteAvaliacao(id) {
    if (!db || !confirm('Excluir esta avaliação?')) return;

    const { error } = await db.from('avaliacoes').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }

    loadAdminData();
  };

  function setupForms() {
    const curriculoForm = document.querySelector('form[data-form="curriculo"]');
    if (curriculoForm) curriculoForm.addEventListener('submit', handleCurriculoSubmit);

    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const portfolioForm = document.querySelector('form[data-form="admin-portfolio"]');
    if (portfolioForm) portfolioForm.addEventListener('submit', handleAdminPortfolioSubmit);

    const reviewForm = document.querySelector('form[data-form="admin-avaliacao"]');
    if (reviewForm) reviewForm.addEventListener('submit', handleAdminReviewSubmit);
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupForms();
    setupPortfolioFilters();
    loadPortfolioHighlights();
    loadFullPortfolio();
    loadTestimonials();
    protectAdmin();
  });
})();
