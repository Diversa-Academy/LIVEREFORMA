(() => {
  const config = window.LIVE_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const byId = (id) => document.getElementById(id);
  const make = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value != null) element.textContent = String(value);
    return element;
  };

  for (const element of document.querySelectorAll('[data-copy]')) {
    const value = config[element.dataset.copy];
    if (typeof value === 'string') element.textContent = value;
  }
  document.title = `${config.eventName || 'Live'} | Diversa Investimentos`;
  const description = $('meta[name="description"]');
  if (description) description.content = `Live da Diversa Investimentos: ${config.eventName || ''}. ${config.description || ''}`;
  byId('year').textContent = String(new Date().getFullYear());
  byId('event-name-input').value = config.eventName || '';
  byId('event-id-input').value = config.eventId || '';

  const start = Date.parse(config.eventStartsAt || '');
  if (Number.isFinite(start)) {
    const date = new Date(start);
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
    const weekday = (parts.weekday || '').toLocaleUpperCase('pt-BR');
    const month = (parts.month || '').toLocaleUpperCase('pt-BR');
    const hours = parts.hour || '--';
    const minutes = parts.minute || '--';
    byId('event-day').textContent = (parts.day || '').padStart(2, '0');
    byId('event-month').firstChild.textContent = month;
    byId('event-weekday').textContent = weekday;
    byId('event-time').textContent = `${hours}h${minutes}`;
    $('.header-date').textContent = `${(parts.day || '').padStart(2, '0')} ${month.slice(0, 3)} · ${hours}H${minutes}`;
    byId('event-date-line').textContent = `${weekday}, ${parts.day} DE ${month} · ${hours}H${minutes}`;
    byId('event-date-line').dateTime = config.eventStartsAt;
    byId('closing-date').textContent = `${weekday} · ${parts.day} DE ${month} DE ${parts.year} · ${hours}H${minutes}`;
  }

  const speakers = Array.isArray(config.speakers) ? config.speakers : [];
  const speakerGrid = byId('speakers-grid');
  const avatarRow = byId('hero-avatars');
  for (const speaker of speakers) {
    const card = make('article', 'speaker-card');
    let photo;
    if (speaker.photo) {
      photo = make('img', 'speaker-photo');
      photo.src = speaker.photo;
      photo.alt = speaker.name || 'Participante da live';
      photo.loading = 'lazy';
      photo.decoding = 'async';
      if (speaker.position) photo.style.objectPosition = speaker.position;
    } else {
      photo = make('div', 'speaker-photo speaker-photo-fallback', (speaker.name || 'P').split(/\s+/).slice(0, 2).map((part) => part[0]).join(''));
      photo.setAttribute('aria-label', `Foto de ${speaker.name || 'participante'} em breve`);
    }
    const copy = make('div', 'speaker-copy');
    copy.append(make('span', 'speaker-role', speaker.role || 'Participante'));
    copy.append(make('h3', '', speaker.name || 'Participante'));
    copy.append(make('p', '', speaker.bio || ''));
    if (speaker.link) {
      try {
        const linkUrl = new URL(speaker.link);
        if (linkUrl.protocol === 'https:') {
          const link = make('a', '', speaker.linkLabel || 'Conheça o participante');
          link.href = linkUrl.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.append(makeArrow(true));
          copy.append(link);
        }
      } catch (_) { /* Link opcional inválido: omitir. */ }
    }
    card.append(photo, copy);
    speakerGrid.append(card);
  }
  for (const speaker of speakers.slice(0, 3)) {
    const avatar = speaker.photo ? make('img') : make('span', 'hero-avatar-fallback', (speaker.name || 'P')[0]);
    if (speaker.photo) {
      avatar.src = speaker.photo;
      avatar.alt = '';
      avatar.decoding = 'async';
      if (speaker.position) avatar.style.objectPosition = speaker.position;
    }
    avatarRow.append(avatar);
  }
  if (speakers.length) byId('hero-speaker-names').textContent = `Com ${speakers.map((speaker) => speaker.name).join(', ').replace(/, ([^,]+)$/, ' e $1')}`;

  const factors = byId('factor-list');
  for (const factor of Array.isArray(config.factors) ? config.factors : []) factors.append(make('span', '', factor));
  const agenda = byId('question-list');
  for (const item of Array.isArray(config.agenda) ? config.agenda : []) {
    const line = make('li');
    line.append(make('h3', '', item.title));
    line.append(make('p', '', item.text));
    agenda.append(line);
  }

  function makeArrow(external = false) {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.8');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', external ? 'M5 19 19 5M9 5h10v10' : 'M5 12h14m-6-6 6 6-6 6');
    icon.append(path);
    return icon;
  }

  const timer = byId('countdown');
  const timerHeading = byId('countdown-heading');
  const timerValues = byId('countdown-values');
  let interval;
  const two = (number) => String(number).padStart(2, '0');
  function updateCountdown() {
    if (!Number.isFinite(start)) { timer.hidden = true; return; }
    const remaining = start - Date.now();
    if (remaining <= 0) {
      timerValues.hidden = true;
      timerHeading.textContent = Date.now() - start < 6 * 60 * 60 * 1000 ? 'A live já começou' : 'Esta data já passou';
      timer.setAttribute('aria-label', timerHeading.textContent);
      if (interval) clearInterval(interval);
      return;
    }
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    byId('countdown-days').textContent = two(days);
    byId('countdown-hours').textContent = two(hours);
    byId('countdown-minutes').textContent = two(minutes);
    byId('countdown-seconds').textContent = two(seconds);
    timer.setAttribute('aria-label', `Faltam ${days} dias, ${hours} horas e ${minutes} minutos para a live`);
  }
  updateCountdown();
  if (Number.isFinite(start) && start > Date.now()) interval = setInterval(updateCountdown, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateCountdown(); });

  let endpoint = '';
  try {
    const url = new URL(config.registrationEndpoint);
    if (url.protocol === 'https:' && url.hostname === 'script.google.com' && /^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)) endpoint = url.href;
  } catch (_) { /* O destino ainda não foi configurado. */ }
  const form = byId('registration-form');
  const submitButton = byId('submit-button');
  const status = byId('form-status');
  if (endpoint) {
    form.action = endpoint;
  } else {
    submitButton.disabled = true;
    submitButton.textContent = 'Inscrições em preparação';
    form.querySelectorAll('input:not([type="hidden"])').forEach((input) => { input.disabled = true; });
    status.hidden = false;
    status.textContent = 'Inscrição indisponível no momento. Tente novamente mais tarde.';
  }
  try {
    const url = new URL(config.youtubeUrl);
    if (url.protocol === 'https:' && /^(www\.|m\.)?(youtube\.com|youtu\.be)$/.test(url.hostname)) {
      for (const id of ['watch-link', 'hero-watch-link']) {
        const watch = byId(id);
        watch.href = url.href;
        watch.hidden = false;
      }
    }
  } catch (_) { /* O link da transmissão ainda não foi informado. */ }

  const fields = [
    { id: 'full-name', error: 'name-error' },
    { id: 'email', error: 'email-error' },
    { id: 'whatsapp', error: 'whatsapp-error' }
  ];
  const digitsForWhatsapp = (value) => {
    const digits = value.replace(/\D/g, '');
    return (digits.length === 12 || digits.length === 13) && digits.startsWith('55') ? digits.slice(2) : digits;
  };
  const formatWhatsapp = (digits) => digits.length === 11
    ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    : `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  function setError(field, message) {
    const input = byId(field.id);
    const error = byId(field.error);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    if (message) input.setAttribute('aria-describedby', field.error);
    else input.removeAttribute('aria-describedby');
    error.textContent = message;
  }
  function validateField(field) {
    const value = byId(field.id).value.trim();
    let message = '';
    if (field.id === 'full-name' && value.length < 2) message = 'Informe seu nome.';
    if (field.id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Informe um e-mail válido, com @ e domínio.';
    if (field.id === 'whatsapp') {
      const length = digitsForWhatsapp(value).length;
      if (length > 11) message = 'Use até 11 dígitos, incluindo o DDD.';
      else if (length < 10) message = 'Informe DDD e número, com 10 ou 11 dígitos.';
    }
    setError(field, message);
    return !message;
  }
  for (const field of fields) {
    const input = byId(field.id);
    input.addEventListener('blur', () => {
      input.value = input.value.trim();
      if (field.id === 'whatsapp') {
        const digits = digitsForWhatsapp(input.value);
        if (digits.length === 10 || digits.length === 11) input.value = formatWhatsapp(digits);
      }
      if (input.value) validateField(field);
    });
    input.addEventListener('input', () => {
      if (field.id === 'whatsapp' && digitsForWhatsapp(input.value).length > 11) validateField(field);
      else if (byId(field.error).textContent) validateField(field);
    });
  }
  let submitting = false;
  form.addEventListener('submit', (event) => {
    if (!endpoint || submitting) { event.preventDefault(); return; }
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) {
      event.preventDefault();
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    byId('full-name').value = byId('full-name').value.trim();
    byId('email').value = byId('email').value.trim();
    byId('whatsapp').value = digitsForWhatsapp(byId('whatsapp').value);
    submitting = true;
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    submitButton.textContent = 'Enviando inscrição…';
  });
  window.addEventListener('pageshow', () => {
    submitting = false;
    submitButton.removeAttribute('aria-busy');
    if (endpoint) { submitButton.disabled = false; submitButton.textContent = 'Confirmar inscrição'; }
  });
})();
