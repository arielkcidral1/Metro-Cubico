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

  function onlyDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function formatPhone(value) {
    const text = String(value || '');
    const withoutPrefix = text.startsWith('+55') ? text.slice(3) : text;
    let digits = onlyDigits(withoutPrefix);
    digits = digits.slice(0, 11);
    if (digits.length === 0) return '+55 ';

    const ddd = digits.slice(0, 2);
    const first = digits.slice(2, 3);
    const middle = digits.slice(3, 7);
    const last = digits.slice(7, 11);

    let formatted = '+55';
    if (ddd) formatted += ` (${ddd}`;
    if (ddd.length === 2) formatted += ')';
    if (first) formatted += ` ${first}`;
    if (middle) formatted += ` ${middle}`;
    if (last) formatted += `-${last}`;

    return formatted;
  }

  function setupCpfMask() {
    const input = document.getElementById('cpf');
    if (!input) return;

    input.addEventListener('input', () => {
      input.value = formatCpf(input.value);
    });
  }

  function setupPhoneMask() {
    const input = document.getElementById('telefone');
    if (!input) return;

    input.addEventListener('input', () => {
      input.value = formatPhone(input.value);
    });

    input.addEventListener('focus', () => {
      if (!input.value.trim()) input.value = '+55 ';
    });
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

  function safeStorageFileName(fileName, fallback = 'arquivo') {
    const rawName = fileName || fallback;
    const extension = rawName.includes('.') ? rawName.split('.').pop().toLowerCase() : '';
    const baseName = rawName
      .replace(/\.[^.]+$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback;

    return extension ? `${baseName}.${extension}` : baseName;
  }

  function getProjectPhotos(project) {
    const photos = [...(project.portfolio_fotos || [])].sort((a, b) => {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    });

    if (photos.length > 0) {
      return photos.map((photo) => photo.imagem_url).filter(Boolean);
    }

    return [project.imagem_url || project.imagem || project.image_path].filter(Boolean);
  }

  function renderPortfolioCard(project, options = {}) {
    const photos = getProjectPhotos(project);
    if (photos.length === 0) return '';

    const image = getPublicUrl('portfolio', photos[0]);
    const title = escapeHtml(project.titulo || project.titulo_projeto || 'Projeto');
    const category = escapeHtml(project.categoria || project.categoria_projeto || 'Portfólio');
    const description = escapeHtml(project.descricao || category);
    const photoCount = photos.length;
    const albumBadge = photoCount > 1 ? `<span class="album-badge">${photoCount} fotos</span>` : '';
    const itemClass = options.full ? 'work portfolio-item reveal visible' : 'work reveal visible';
    const dataCategory = options.full ? ` data-category="${category}"` : '';
    const clickAction = ` onclick="openPortfolioAlbum(${Number(project.id)})"`;

    return `
      <article class="${itemClass}"${dataCategory} data-project-id="${Number(project.id)}" style="background-image:url('${image}')"${clickAction}>
        ${albumBadge}
        <div><h3>${title}</h3><p>${options.full ? category : description}</p></div>
      </article>
    `;
  }

  function getJobRequirements(job) {
    return String(job.requisitos || '')
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function renderJobCard(job) {
    const id = Number(job.id);
    const title = escapeHtml(job.titulo || 'Vaga');
    const area = escapeHtml(job.area || 'Oportunidade');
    const type = escapeHtml(job.tipo || 'Presencial');
    const description = escapeHtml(job.descricao || '');
    const requirements = getJobRequirements(job);
    const requirementList = requirements.length > 0
      ? `<ul>${requirements.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '';

    return `
      <article class="job-card reveal visible">
        <div class="job-card-head">
          <span class="job-tag">${area}</span>
          <span class="job-type">${type}</span>
        </div>
        <h2>${title}</h2>
        <p>${description}</p>
        ${requirementList || '<p class="job-no-requirements">Requisitos não informados.</p>'}
        <a class="btn btn-primary" href="Curriculo.html?vaga=${id}">Enviar currículo</a>
      </article>
    `;
  }

  async function loadPublicJobs() {
    const container = document.getElementById('dynamic-jobs');
    if (!db || !container) return;

    const { data, error } = await db
      .from('vagas')
      .select('*')
      .eq('status', 'aberta')
      .order('created_at', { ascending: false });

    if (error) {
      container.innerHTML = `<div class="jobs-empty">${escapeHtml(error.message)}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="jobs-empty">Nenhuma vaga aberta no momento.</div>';
      return;
    }

    container.innerHTML = data.map((job) => renderJobCard(job)).join('');
  }

  async function loadCurriculoJobOptions() {
    const select = document.getElementById('vaga_id');
    const hiddenTitle = document.getElementById('vaga_titulo');
    if (!db || !select) return;

    const selectedFromUrl = new URLSearchParams(window.location.search).get('vaga') || '';
    const { data, error } = await db
      .from('vagas')
      .select('id, titulo, area')
      .eq('status', 'aberta')
      .order('created_at', { ascending: false });

    if (error) {
      select.innerHTML = `<option value="">${escapeHtml(error.message)}</option>`;
      return;
    }

    if (!data || data.length === 0) {
      select.innerHTML = '<option value="">Nenhuma vaga aberta no momento</option>';
      return;
    }

    select.innerHTML = '<option value="">Selecione uma vaga...</option>';
    data.forEach((job) => {
      const option = document.createElement('option');
      option.value = job.id;
      option.textContent = `${job.titulo} (${job.area})`;
      option.dataset.title = job.titulo;
      select.appendChild(option);
    });

    if (selectedFromUrl) select.value = selectedFromUrl;
    if (!select.value && data.length === 1) select.value = data[0].id;

    function syncTitle() {
      const option = select.selectedOptions[0];
      if (hiddenTitle) hiddenTitle.value = option?.dataset.title || option?.textContent || '';
    }

    select.addEventListener('change', syncTitle);
    syncTitle();
  }

  async function loadPortfolioHighlights() {
    const container = document.getElementById('dynamic-portfolio-highlights');
    if (!db || !container) return;

    const { data, error } = await db
      .from('portfolio')
      .select('*, portfolio_fotos(id, imagem_url, created_at)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      container.innerHTML = '';
      return;
    }

    window.portfolioAlbums = data;
    container.innerHTML = data.map((project) => renderPortfolioCard(project)).join('');
  }

  async function loadFullPortfolio() {
    const container = document.getElementById('dynamic-full-portfolio');
    if (!db || !container) return;

    const { data, error } = await db
      .from('portfolio')
      .select('*, portfolio_fotos(id, imagem_url, created_at)')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      container.innerHTML = '';
      return;
    }

    window.portfolioAlbums = data;
    container.innerHTML = data.map((project) => renderPortfolioCard(project, { full: true })).join('');

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

  function ensurePortfolioAlbumModal() {
    let modal = document.getElementById('portfolio-album-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'portfolio-album-modal';
    modal.className = 'album-modal';
    modal.innerHTML = `
      <div class="album-dialog" role="dialog" aria-modal="true" aria-label="Álbum do projeto">
        <button class="album-close" type="button" aria-label="Fechar álbum" onclick="closePortfolioAlbum()">×</button>
        <div class="album-media">
          <button class="album-nav album-prev" type="button" aria-label="Foto anterior" onclick="changePortfolioPhoto(-1)">‹</button>
          <img id="album-image" alt="Foto do projeto" />
          <button class="album-nav album-next" type="button" aria-label="Próxima foto" onclick="changePortfolioPhoto(1)">›</button>
        </div>
        <div class="album-info">
          <h3 id="album-title"></h3>
          <p id="album-meta"></p>
        </div>
      </div>
    `;

    modal.addEventListener('click', (event) => {
      if (event.target === modal) closePortfolioAlbum();
    });

    document.body.appendChild(modal);
    return modal;
  }

  function renderCurrentAlbumPhoto() {
    const state = window.currentPortfolioAlbum;
    if (!state) return;

    const modal = ensurePortfolioAlbumModal();
    const image = modal.querySelector('#album-image');
    const title = modal.querySelector('#album-title');
    const meta = modal.querySelector('#album-meta');
    const previous = modal.querySelector('.album-prev');
    const next = modal.querySelector('.album-next');
    const currentPhoto = state.photos[state.index];

    image.src = getPublicUrl('portfolio', currentPhoto);
    title.textContent = state.title;
    meta.textContent = `${state.category} • Foto ${state.index + 1} de ${state.photos.length}`;
    previous.style.display = state.photos.length > 1 ? 'grid' : 'none';
    next.style.display = state.photos.length > 1 ? 'grid' : 'none';
  }

  window.openPortfolioAlbum = function openPortfolioAlbum(projectId) {
    const project = (window.portfolioAlbums || []).find((item) => Number(item.id) === Number(projectId));
    if (!project) return;

    const photos = getProjectPhotos(project);
    if (photos.length === 0) return;

    window.currentPortfolioAlbum = {
      index: 0,
      photos,
      title: project.titulo || project.titulo_projeto || 'Projeto',
      category: project.categoria || project.categoria_projeto || 'Portfólio'
    };

    ensurePortfolioAlbumModal().classList.add('open');
    document.body.classList.add('album-open');
    renderCurrentAlbumPhoto();
  };

  window.closePortfolioAlbum = function closePortfolioAlbum() {
    const modal = document.getElementById('portfolio-album-modal');
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('album-open');
    window.currentPortfolioAlbum = null;
  };

  window.changePortfolioPhoto = function changePortfolioPhoto(direction) {
    const state = window.currentPortfolioAlbum;
    if (!state || state.photos.length < 2) return;

    state.index = (state.index + direction + state.photos.length) % state.photos.length;
    renderCurrentAlbumPhoto();
  };

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePortfolioAlbum();
    if (event.key === 'ArrowLeft') changePortfolioPhoto(-1);
    if (event.key === 'ArrowRight') changePortfolioPhoto(1);
  });

  async function handleCurriculoSubmit(event) {
    event.preventDefault();
    if (!db) return;

    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const fileInput = form.querySelector('#arquivo');
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    const cpf = onlyDigits(data.get('cpf'));
    const telefone = formatPhone(data.get('telefone'));
    const vagaId = data.get('vaga_id') ? Number(data.get('vaga_id')) : null;
    const vagaTitulo = data.get('vaga_titulo') || '';

    if (!file || !file.name) {
      alert('Selecione um arquivo de currículo antes de enviar.');
      return;
    }

    if (!vagaId) {
      alert('Selecione a vaga de interesse antes de enviar.');
      return;
    }

    if (cpf.length !== 11) {
      alert('Informe um CPF válido com 11 números.');
      return;
    }

    if (onlyDigits(telefone).length !== 13) {
      alert('Informe o telefone no formato +55 (xx) 9 XXXX-XXXX.');
      return;
    }

    button.disabled = true;
    button.textContent = 'Enviando...';

    try {
      const existing = await db
        .from('curriculos')
        .select('id')
        .eq('cpf', cpf)
        .eq('vaga_id', vagaId)
        .maybeSingle();

      if (existing.error) throw existing.error;
      if (existing.data) {
        alert('Já existe um currículo enviado para este CPF nesta vaga.');
        return;
      }

      const filePath = `${vagaId}/${Date.now()}-${safeStorageFileName(file.name, 'curriculo')}`;
      const upload = await db.storage.from('curriculos').upload(filePath, file);
      if (upload.error) throw upload.error;

      const insert = await db.from('curriculos').insert({
        nome: data.get('nome'),
        cpf,
        telefone,
        email: data.get('email'),
        vaga_id: vagaId,
        vaga_titulo: vagaTitulo,
        arquivo_url: filePath
      });
      if (insert.error) throw insert.error;

      alert('Obrigado! Seu currículo foi recebido.');
      form.reset();
    } catch (error) {
      if (error.code === '23505') {
        alert('Já existe um currículo enviado para este CPF nesta vaga.');
      } else {
        alert(`Não foi possível enviar o currículo: ${error.message}`);
      }
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

    if (user.toLowerCase() === 'alexandre' && (password === 'Metro123' || password === 'metro123')) {
      if (errorBox) errorBox.style.display = 'none';
      sessionStorage.setItem('metroAdminLoggedIn', 'true');
      window.location.href = 'admin.html';
      return;
    }

    if (errorBox) errorBox.style.display = 'block';
  }

  async function protectAdmin() {
    const isAdminPage = document.body.classList.contains('admin-page');
    if (!isAdminPage) return;

    if (sessionStorage.getItem('metroAdminLoggedIn') !== 'true') {
      window.location.href = 'login.html';
      return;
    }

    loadAdminData();
  }

  window.logoutAdmin = function logoutAdmin() {
    sessionStorage.removeItem('metroAdminLoggedIn');
    window.location.href = 'login.html';
  };

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

    const insert = await db.from('portfolio').insert({
      titulo: data.get('titulo_projeto'),
      categoria: data.get('categoria_projeto')
    });

    if (insert.error) {
      alert(insert.error.message);
      return;
    }

    alert('Projeto salvo com sucesso!');
    form.reset();
    loadAdminData();
  }

  async function handleAdminPortfolioFotosSubmit(event) {
    event.preventDefault();
    if (!db) return;

    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const projectId = data.get('projeto_foto');
    const files = Array.from(form.querySelector('#imagens_projeto').files || []);

    if (!projectId || files.length === 0) return;

    button.disabled = true;
    button.textContent = 'Enviando fotos...';

    try {
      const rows = [];

      for (const file of files) {
        const safeName = safeStorageFileName(file.name, 'foto');
        const filePath = `${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
        const upload = await db.storage.from('portfolio').upload(filePath, file);
        if (upload.error) throw upload.error;
        rows.push({ projeto_id: Number(projectId), imagem_url: filePath });
      }

      const insert = await db.from('portfolio_fotos').insert(rows);
      if (insert.error) throw insert.error;

      alert(`${files.length} foto(s) adicionada(s) com sucesso!`);
      form.reset();
      loadAdminData();
    } catch (error) {
      alert(`Não foi possível adicionar as fotos: ${error.message}`);
    } finally {
      button.disabled = false;
      button.textContent = 'Adicionar Fotos';
    }
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

  async function handleAdminJobSubmit(event) {
    event.preventDefault();
    if (!db) return;

    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const jobId = data.get('id');
    const payload = {
      titulo: data.get('titulo'),
      area: data.get('area'),
      tipo: data.get('tipo'),
      status: 'aberta',
      descricao: data.get('descricao'),
      requisitos: data.get('requisitos')
    };

    button.disabled = true;
    button.textContent = jobId ? 'Salvando...' : 'Publicando...';

    try {
      const response = jobId
        ? await db.from('vagas').update(payload).eq('id', Number(jobId))
        : await db.from('vagas').insert(payload);

      if (response.error) throw response.error;

      alert(jobId ? 'Vaga atualizada com sucesso!' : 'Vaga publicada com sucesso!');
      resetJobForm();
      loadAdminData();
    } catch (error) {
      alert(`Não foi possível salvar a vaga: ${error.message}`);
    } finally {
      button.disabled = false;
      button.textContent = document.getElementById('vaga_id_admin')?.value ? 'Salvar vaga' : 'Publicar vaga';
    }
  }

  async function loadAdminData() {
    if (!db) return;
    await Promise.all([
      loadAdminJobs(),
      loadAdminJobOptions(),
      loadAdminCurriculos(),
      loadAdminPortfolio(),
      loadAdminProjetoOptions(),
      loadAdminAvaliacoes()
    ]);
  }

  async function loadAdminCurriculos() {
    const tbody = document.getElementById('admin-curriculos-list');
    if (!db || !tbody) return;
    const filter = document.getElementById('curriculo-vaga-filter')?.value || '';
    let query = db
      .from('curriculos')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter) query = query.eq('vaga_id', Number(filter));

    const { data, error } = await query;

    if (error) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-row">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Nenhum currículo recebido.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((item) => {
      const fileUrl = getPublicUrl('curriculos', item.arquivo_url || item.arquivo);

      return `
        <tr>
          <td>${formatDate(item.created_at)}</td>
          <td>${escapeHtml(item.vaga_titulo || 'Sem vaga vinculada')}</td>
          <td>${escapeHtml(item.nome)}</td>
          <td>${escapeHtml(formatCpf(item.cpf))}</td>
          <td>${escapeHtml(item.email)}</td>
          <td>${escapeHtml(formatPhone(item.telefone))}</td>
          <td><a href="${fileUrl}" class="btn-download" target="_blank" rel="noopener">Baixar</a></td>
          <td><button type="button" class="btn-danger" onclick="deleteCurriculo(${item.id}, '${encodeURIComponent(item.arquivo_url || item.arquivo || '')}')">Excluir</button></td>
        </tr>
      `;
    }).join('');
  }
  window.loadAdminCurriculos = loadAdminCurriculos;

  async function loadAdminJobs() {
    const tbody = document.getElementById('admin-vagas-list');
    if (!db || !tbody) return;

    const { data, error } = await db
      .from('vagas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-row">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Nenhuma vaga publicada.</td></tr>';
      window.adminJobsData = [];
      return;
    }

    window.adminJobsData = data;
    tbody.innerHTML = data.map((job) => {
      return `
        <tr>
          <td>${formatDate(job.created_at)}</td>
          <td>${escapeHtml(job.titulo)}</td>
          <td>${escapeHtml(job.area)}</td>
          <td>
            <button type="button" class="btn-edit" onclick="editJob(${job.id})">Editar</button>
            <button type="button" class="btn-danger" onclick="deleteJob(${job.id})">Excluir</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function loadAdminJobOptions() {
    const select = document.getElementById('curriculo-vaga-filter');
    if (!db || !select) return;

    const selected = select.value;
    const { data, error } = await db
      .from('vagas')
      .select('id, titulo, area')
      .order('created_at', { ascending: false });

    if (error) return;

    select.innerHTML = '<option value="">Todas as vagas</option>';
    (data || []).forEach((job) => {
      const option = document.createElement('option');
      option.value = job.id;
      option.textContent = `${job.titulo} (${job.area})`;
      select.appendChild(option);
    });

    if (selected) select.value = selected;
  }

  async function loadAdminPortfolio() {
    const tbody = document.getElementById('admin-portfolio-list');
    if (!db || !tbody) return;

    const { data, error } = await db
      .from('portfolio')
      .select('*, portfolio_fotos(id, imagem_url)')
      .order('created_at', { ascending: false });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-row">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-row">Nenhum projeto cadastrado.</td></tr>';
      window.adminPortfolioData = [];
      return;
    }

    window.adminPortfolioData = data;

    tbody.innerHTML = data.map((item) => {
      const photos = item.portfolio_fotos || [];
      const firstPhoto = photos[0]?.imagem_url || item.imagem_url || '';
      const fileUrl = firstPhoto ? getPublicUrl('portfolio', firstPhoto) : '';
      const photoLabel = photos.length === 1 ? '1 foto' : `${photos.length} fotos`;
      const photoCell = fileUrl
        ? `<a href="${fileUrl}" class="btn-download" target="_blank" rel="noopener">${photoLabel}</a>`
        : photoLabel;

      return `
        <tr>
          <td>${formatDate(item.created_at)}</td>
          <td>${escapeHtml(item.titulo)}</td>
          <td>${escapeHtml(item.categoria)}</td>
          <td>${photoCell}</td>
          <td>
            <button type="button" class="btn-edit" onclick="openEditModal(${item.id})">Editar</button>
            <button type="button" class="btn-danger" onclick="deletePortfolioItem(${item.id})">Excluir</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function loadAdminProjetoOptions() {
    const select = document.getElementById('projeto_foto');
    if (!db || !select) return;

    const selected = select.value;
    const { data, error } = await db
      .from('portfolio')
      .select('id, titulo, categoria')
      .order('titulo', { ascending: true });

    if (error) return;

    select.innerHTML = '<option value="">Selecione um projeto...</option>';
    if (!data || data.length === 0) {
      select.innerHTML = '<option value="">Cadastre um projeto primeiro</option>';
      return;
    }

    (data || []).forEach((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.titulo} (${item.categoria})`;
      select.appendChild(option);
    });

    if (selected) select.value = selected;
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

  window.deletePortfolioItem = async function deletePortfolioItem(id) {
    if (!db || !confirm('Excluir este projeto?')) return;

    const { data: photos } = await db
      .from('portfolio_fotos')
      .select('imagem_url')
      .eq('projeto_id', id);

    const { error } = await db.from('portfolio').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }

    const files = (photos || [])
      .map((photo) => photo.imagem_url)
      .filter((path) => path && !/^https?:\/\//i.test(path));

    if (files.length > 0) {
      await db.storage.from('portfolio').remove(files);
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

  function resetJobForm() {
    const form = document.querySelector('form[data-form="admin-vaga"]');
    if (!form) return;

    form.reset();
    const idInput = document.getElementById('vaga_id_admin');
    const submitButton = document.getElementById('vaga-submit-btn');
    const cancelButton = document.getElementById('vaga-cancel-btn');

    if (idInput) idInput.value = '';
    if (submitButton) submitButton.textContent = 'Publicar vaga';
    if (cancelButton) cancelButton.style.display = 'none';
  }

  window.cancelJobEdit = function cancelJobEdit() {
    resetJobForm();
  };

  window.editJob = function editJob(id) {
    const job = (window.adminJobsData || []).find((item) => Number(item.id) === Number(id));
    if (!job) return;

    document.getElementById('vaga_id_admin').value = job.id;
    document.getElementById('vaga_titulo_admin').value = job.titulo || '';
    document.getElementById('vaga_area_admin').value = job.area || '';
    document.getElementById('vaga_tipo_admin').value = job.tipo || 'Presencial';
    document.getElementById('vaga_descricao_admin').value = job.descricao || '';
    document.getElementById('vaga_requisitos_admin').value = job.requisitos || '';

    const submitButton = document.getElementById('vaga-submit-btn');
    const cancelButton = document.getElementById('vaga-cancel-btn');
    if (submitButton) submitButton.textContent = 'Salvar vaga';
    if (cancelButton) cancelButton.style.display = 'inline-flex';

    document.querySelector('form[data-form="admin-vaga"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.deleteJob = async function deleteJob(id) {
    if (!db || !confirm('Excluir esta vaga? Os currículos enviados continuarão no painel com o nome da vaga.')) return;

    const { error } = await db.from('vagas').delete().eq('id', id);
    if (error) {
      alert(`Não foi possível excluir a vaga: ${error.message}`);
      return;
    }

    loadAdminData();
  };

  window.deleteCurriculo = async function deleteCurriculo(id, encodedFilePath) {
    if (!db) return;

    const firstConfirm = confirm('Tem certeza que deseja excluir este currículo?');
    if (!firstConfirm) return;

    const secondConfirm = confirm('Confirma novamente? Esta ação apagará o currículo do painel e não poderá ser desfeita.');
    if (!secondConfirm) return;

    const filePath = decodeURIComponent(encodedFilePath || '');

    const { error } = await db.from('curriculos').delete().eq('id', id);
    if (error) {
      alert(`Não foi possível excluir o currículo: ${error.message}`);
      return;
    }

    if (filePath && !/^https?:\/\//i.test(filePath)) {
      await db.storage.from('curriculos').remove([filePath]);
    }

    alert('Currículo excluído com sucesso.');
    loadAdminData();
  };

  window.openEditModal = function(id) {
    const project = window.adminPortfolioData?.find(p => p.id === id);
    if (!project) return;
    
    document.getElementById('edit_projeto_id').value = project.id;
    document.getElementById('edit_titulo').value = project.titulo || '';
    
    const catSelect = document.getElementById('edit_categoria');
    if (project.categoria) {
      catSelect.value = project.categoria;
    }
    
    const photosGrid = document.getElementById('edit-photos-list');
    photosGrid.innerHTML = '';
    
    const photos = project.portfolio_fotos || [];
    if (photos.length === 0) {
      photosGrid.innerHTML = '<p style="color: #666; font-size: 0.9rem; grid-column: 1 / -1;">Nenhuma foto cadastrada.</p>';
    } else {
      photos.forEach(photo => {
        const url = getPublicUrl('portfolio', photo.imagem_url);
        photosGrid.innerHTML += `
          <div class="photo-edit-item">
            <img src="${url}" alt="Foto">
            <button type="button" title="Apagar Foto" onclick="deleteProjectPhoto(${photo.id}, '${encodeURIComponent(photo.imagem_url)}', ${project.id})">X</button>
          </div>
        `;
      });
    }
    
    document.getElementById('edit-modal').style.display = 'flex';
  };

  window.closeEditModal = function() {
    document.getElementById('edit-modal').style.display = 'none';
  };

  window.deleteProjectPhoto = async function(photoId, encodedPhotoPath, projectId) {
    if (!db || !confirm('Tem certeza que deseja apagar esta foto do projeto?')) return;
    const photoPath = decodeURIComponent(encodedPhotoPath || '');
    
    if (photoPath && !/^https?:\/\//i.test(photoPath)) {
      await db.storage.from('portfolio').remove([photoPath]);
    }
    
    const { error } = await db.from('portfolio_fotos').delete().eq('id', photoId);
    if (error) {
      alert('Erro ao apagar foto: ' + error.message);
      return;
    }
    
    alert('Foto apagada com sucesso!');
    await loadAdminData();
    if (document.getElementById('edit-modal').style.display === 'flex') {
      openEditModal(projectId);
    }
  };

  async function handleEditProjectSubmit(event) {
    event.preventDefault();
    if (!db) return;
    
    const id = document.getElementById('edit_projeto_id').value;
    const titulo = document.getElementById('edit_titulo').value;
    const categoria = document.getElementById('edit_categoria').value;
    
    const { error } = await db.from('portfolio').update({
      titulo: titulo,
      categoria: categoria
    }).eq('id', id);
    
    if (error) {
      alert('Erro ao atualizar projeto: ' + error.message);
      return;
    }
    
    alert('Projeto atualizado com sucesso!');
    closeEditModal();
    loadAdminData();
  }

  function setupForms() {
    const curriculoForm = document.querySelector('form[data-form="curriculo"]');
    if (curriculoForm) curriculoForm.addEventListener('submit', handleCurriculoSubmit);

    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const portfolioForm = document.querySelector('form[data-form="admin-portfolio"]');
    if (portfolioForm) portfolioForm.addEventListener('submit', handleAdminPortfolioSubmit);

    const portfolioFotosForm = document.querySelector('form[data-form="admin-portfolio-fotos"]');
    if (portfolioFotosForm) portfolioFotosForm.addEventListener('submit', handleAdminPortfolioFotosSubmit);

    const reviewForm = document.querySelector('form[data-form="admin-avaliacao"]');
    if (reviewForm) reviewForm.addEventListener('submit', handleAdminReviewSubmit);

    const jobForm = document.querySelector('form[data-form="admin-vaga"]');
    if (jobForm) jobForm.addEventListener('submit', handleAdminJobSubmit);

    const editProjectForm = document.getElementById('edit-project-form');
    if (editProjectForm) editProjectForm.addEventListener('submit', handleEditProjectSubmit);
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupCpfMask();
    setupPhoneMask();
    setupForms();
    setupPortfolioFilters();
    loadPortfolioHighlights();
    loadFullPortfolio();
    loadTestimonials();
    loadPublicJobs();
    loadCurriculoJobOptions();
    protectAdmin();
  });
})();
