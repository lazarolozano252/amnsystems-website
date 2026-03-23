/* =====================
   LOADING SCREEN
   ===================== */
(function initLoader() {
  const loader = document.getElementById('loader');
  const bar    = document.getElementById('loaderBar');

  // Lock scroll during load
  document.body.classList.add('loading');

  // Animate progress bar over ~2.4 s
  const DURATION   = 2400;   // ms until bar hits 100 %
  const HIDE_DELAY = 300;    // ms after 100 % before fade-out starts
  const start      = performance.now();

  // Ease-out curve so it feels fast then slows near the end
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / DURATION, 1);
    bar.style.width = easeOut(progress) * 100 + '%';

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Bar full → short pause → fade out → remove from DOM entirely
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.classList.remove('loading');
        // Remove loader from DOM after fade — belt-and-suspenders:
        // transitionend fires normally, timeout is backup for iOS Safari
        // where transitionend can be skipped when tab is in background.
        const hideFn = () => { loader.style.display = 'none'; };
        loader.addEventListener('transitionend', hideFn, { once: true });
        setTimeout(hideFn, 800); // 0.7s transition + 100ms buffer
      }, HIDE_DELAY);
    }
  }

  requestAnimationFrame(tick);
})();

/* =====================
   NAV — scroll effect & burger
   ===================== */
const navbar   = document.getElementById('navbar');
const burger   = document.getElementById('burger');
const mobile   = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
});

burger.addEventListener('click', () => {
  mobile.classList.toggle('open');
});

// Close mobile menu when any link inside it is tapped — no preventDefault
mobile.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobile.classList.remove('open'));
});

/* Canvas de partículas eliminado — fondo manejado por CSS */

/* =====================
   COUNTER ANIMATION
   ===================== */
function animateCounters() {
  document.querySelectorAll('.stat__number').forEach(el => {
    const target   = +el.dataset.target;
    const duration = 1800;
    const start    = performance.now();

    function update(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(ease * target);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

// trigger counters when hero is visible
const heroObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    animateCounters();
    heroObserver.disconnect();
  }
}, { threshold: 0.4 });
heroObserver.observe(document.querySelector('.hero'));

/* =====================
   SCROLL REVEAL
   ===================== */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const el    = entry.target;
    const delay = +(el.dataset.delay || 0);

    setTimeout(() => el.classList.add('visible'), delay);
    revealObserver.unobserve(el);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.card, .why__item').forEach(el => {
  revealObserver.observe(el);
});

/* ── Case cards: reveal + animate progress bars ── */
const caseObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const card  = entry.target;
    const delay = +(card.dataset.delay || 0);

    setTimeout(() => {
      card.classList.add('visible');
      // Animate bar after card fades in
      setTimeout(() => {
        const fill = card.querySelector('.case-card__bar-fill');
        if (fill) fill.style.width = fill.dataset.width + '%';
      }, 300);
    }, delay);

    caseObserver.unobserve(card);
  });
}, { threshold: 0.15 });

document.querySelectorAll('.case-card').forEach(el => caseObserver.observe(el));

/* Anchor links: scroll nativo del browser — sin JS que intercepte */

/* =====================
   CONTACT FORM
   ===================== */
const form        = document.getElementById('contactForm');
const btnText     = form.querySelector('.btn__text');
const btnLoader   = form.querySelector('.btn__loader');
const formSuccess = document.getElementById('formSuccess');

form.addEventListener('submit', async e => {
  e.preventDefault();

  // Loading state
  btnText.hidden   = true;
  btnLoader.hidden = false;
  form.querySelector('button').disabled = true;

  // Simulate async submission (replace with your real endpoint)
  await new Promise(r => setTimeout(r, 1600));

  btnText.hidden   = false;
  btnLoader.hidden = true;
  form.querySelector('button').disabled = false;

  formSuccess.hidden = false;
  form.reset();

  setTimeout(() => { formSuccess.hidden = true; }, 6000);
});

/* =====================
   CHAT WIDGET — AIDA
   ===================== */
(function initChat() {

  const widget   = document.getElementById('chatWidget');
  const toggle   = document.getElementById('chatToggle');
  const panel    = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const messages = document.getElementById('chatMessages');
  const form     = document.getElementById('chatForm');
  const input    = document.getElementById('chatInput');
  const quick    = document.getElementById('chatQuick');
  const dot      = document.getElementById('chatDot');
  const iconOpen = toggle.querySelector('.chat-toggle__icon--open');
  const iconClose= toggle.querySelector('.chat-toggle__icon--close');

  let isOpen    = false;
  let isBusy    = false;   // prevents double-send while bot is typing
  let firstOpen = true;

  // ── Knowledge base ─────────────────────────────────────
  const BOT_NAME = 'AIDA';

  const KB = [
    {
      keys: ['servicio','ofrecen','hacen','qué hacen','ayudan','soluciones','qué ofrecen'],
      answer: `En <strong>AMN Systems</strong> ofrecemos:\n\n• 🤖 <strong>Automatización Inteligente</strong> — agentes IA y flujos autónomos\n• 🧠 <strong>Consultoría en IA</strong> — auditoría y hoja de ruta estratégica\n• ⚙️ <strong>Desarrollo de soluciones IA</strong> — modelos, chatbots, NLP\n• 🔗 <strong>Integración Empresarial</strong> — conectamos IA a tu ERP/CRM\n• 📊 <strong>Análisis de datos</strong> — dashboards y forecasting\n• ✨ <strong>IA Generativa</strong> — LLMs privados y asistentes internos\n\n¿Te interesa alguno en particular?`,
    },
    {
      keys: ['precio','costo','cuánto','vale','cobran','tarifa','presupuesto','inversión'],
      answer: `Los precios varían según el alcance de cada proyecto. Manejamos dos modelos:\n\n• <strong>Proyecto fijo</strong> — ideal para soluciones definidas (desde $2,500 USD)\n• <strong>Retención mensual</strong> — soporte y desarrollo continuo\n\nAgendamos una llamada gratuita de 30 min para entender tu caso y darte una propuesta sin compromiso. ¿Quieres coordinar?`,
    },
    {
      keys: ['empez','inicio','cómo funciona','proceso','pasos','primero','qué hago'],
      answer: `El proceso es simple y rápido:\n\n1️⃣ <strong>Consulta gratuita</strong> — 30 min para entender tu desafío\n2️⃣ <strong>Propuesta</strong> — te enviamos un plan con alcance y precio\n3️⃣ <strong>Kick-off</strong> — arrancamos en ≤ 1 semana\n4️⃣ <strong>Entrega ágil</strong> — resultados desde la primera semana\n\nPuedes escribir a <strong>lazarolozano@amnsystems.com</strong> o llenar el formulario de contacto. 🚀`,
    },
    {
      keys: ['pequeña','pyme','startup','mediana','chica','pequeño negocio'],
      answer: `¡Absolutamente! Trabajamos con empresas de todos los tamaños, desde startups hasta corporativos.\n\nPara PyMEs tenemos soluciones de <strong>entrada rápida</strong> que entregan valor real sin requerir grandes presupuestos o equipos de tecnología internos.\n\n¿En qué industria opera tu empresa?`,
    },
    {
      keys: ['automatiz','robot','rpa','tarea repetitiva','flujo','pipeline'],
      answer: `Nuestra especialidad en automatización incluye:\n\n• Agentes autónomos que trabajan 24/7\n• Flujos multi-paso con toma de decisiones IA\n• Integración con cualquier sistema via API\n• RPA potenciado con LLMs para tareas no estructuradas\n\nUn cliente del sector retail eliminó <strong>14 horas diarias</strong> de trabajo manual con un solo agente. ¿Te cuento más?`,
    },
    {
      keys: ['chatbot','asistente','bot','virtual','atención','cliente','soporte'],
      answer: `Desarrollamos asistentes virtuales que van mucho más allá de los chatbots tradicionales:\n\n• Entienden lenguaje natural en español e inglés\n• Se entrenan con la información de <em>tu</em> empresa\n• Se integran a WhatsApp, web, Slack, o tu CRM\n• Aprenden y mejoran con cada conversación\n\nUno de nuestros chatbots resuelve el <strong>87% de las consultas</strong> sin intervención humana. ¿Quieres uno así?`,
    },
    {
      keys: ['dato','analisis','analítica','reporte','dashboard','predicción','forecast'],
      answer: `Transformamos tus datos en decisiones con:\n\n• <strong>Dashboards inteligentes</strong> en tiempo real\n• <strong>Modelos predictivos</strong> (ventas, inventario, churn)\n• <strong>Reportes automáticos</strong> generados por IA\n• <strong>Detección de anomalías</strong> antes de que sean problemas\n\nUn cliente de manufactura ahorró <strong>$340,000 USD</strong> al año con nuestro sistema de predicción de inventario. ¿Quieres saber cómo?`,
    },
    {
      keys: ['tiempo','cuánto tarda','demora','plazo','entrega','rápido','semana'],
      answer: `Nuestros plazos típicos:\n\n• <strong>Chatbot básico</strong>: 1–2 semanas\n• <strong>Automatización de proceso</strong>: 2–4 semanas\n• <strong>Solución personalizada</strong>: 4–8 semanas\n• <strong>Consultoría</strong>: entregamos la hoja de ruta en 1 semana\n\nUsamos metodología ágil — ves avances reales desde el primer sprint, no meses después.`,
    },
    {
      keys: ['seguridad','dato','privacidad','gdpr','confidencial','seguro'],
      answer: `La seguridad es prioridad en AMN Systems:\n\n• 🔒 Podemos desplegar modelos en <strong>infraestructura privada</strong> (tus datos nunca salen)\n• 📋 Cumplimiento con GDPR, HIPAA e ISO 27001\n• 🔐 Contratos de confidencialidad (NDA) desde el primer día\n• ☁️ Opciones cloud (AWS, GCP, Azure) o on-premise\n\n¿Tienes requerimientos específicos de cumplimiento?`,
    },
    {
      keys: ['puerto rico','pr','caribe','local','latinoamer','latam','hispano'],
      answer: `¡Sí, somos de Puerto Rico! 🇵🇷\n\nAtendemos clientes en toda Latinoamérica, Estados Unidos y el Caribe. Nuestro equipo opera de manera remota con disponibilidad para reuniones en persona en PR.\n\nPuedes contactarnos directamente al <strong>787-509-3844</strong> o por email.`,
    },
    {
      keys: ['contacto','correo','email','llamar','teléfono','reunión','cita','agendar','hablar'],
      answer: `¡Con gusto! Puedes contactarnos por:\n\n📧 <strong>lazarolozano@amnsystems.com</strong>\n📞 <strong>787-509-3844</strong>\n💬 <strong>WhatsApp</strong> — botón verde en esta página\n\nO llena el formulario de contacto y te respondemos en menos de 24 horas. ¿Prefieres que te llamemos?`,
    },
    {
      keys: ['gracias','perfecto','excelente','genial','ok','listo','chevere'],
      answer: `¡Con mucho gusto! 😊 Estoy aquí para cualquier otra pregunta.\n\nRecuerda que puedes contactar al equipo directamente en <strong>787-509-3844</strong> o escribirnos a <strong>lazarolozano@amnsystems.com</strong>. ¡Éxito en tu proyecto!`,
    },
    {
      keys: ['hola','buenas','hey','saludos','buenos días','buenas tardes','qué tal'],
      answer: `¡Hola! 👋 Soy <strong>AIDA</strong>, asistente virtual de <strong>AMN Systems</strong>.\n\nEstoy aquí para responder tus dudas sobre nuestros servicios de IA. ¿En qué puedo ayudarte hoy?`,
    },
  ];

  const FALLBACK = `No estoy 100% segura de cómo responderte eso, pero me encantaría conectarte con nuestro equipo.\n\n📞 <strong>787-509-3844</strong>\n📧 <strong>lazarolozano@amnsystems.com</strong>\n\n¿Hay algo más que pueda aclarar?`;

  function findAnswer(text) {
    const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const entry of KB) {
      if (entry.keys.some(k => t.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
        return entry.answer;
      }
    }
    return FALLBACK;
  }

  // ── Render helpers ──────────────────────────────────────
  function now() {
    return new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }

  function appendMsg({ role, html }) {
    const isBot = role === 'bot';
    const div = document.createElement('div');
    div.className = `msg msg--${isBot ? 'bot' : 'user'}`;

    if (isBot) {
      div.innerHTML = `
        <div class="msg__avatar">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div>
          <div class="msg__bubble">${html}</div>
          <span class="msg__time">${BOT_NAME} · ${now()}</span>
        </div>`;
    } else {
      div.innerHTML = `
        <div>
          <div class="msg__bubble">${html}</div>
          <span class="msg__time">${now()}</span>
        </div>`;
    }

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'msg msg--bot msg--typing';
    div.innerHTML = `
      <div class="msg__avatar">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </div>
      <div class="msg__bubble">
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function formatAnswer(text) {
    // Newlines → <br>, keep bold tags
    return text.replace(/\n/g, '<br>');
  }

  // ── Send flow ───────────────────────────────────────────
  async function sendMessage(text) {
    if (!text.trim() || isBusy) return;
    isBusy = true;
    quick.style.display = 'none';

    // User bubble
    appendMsg({ role: 'user', html: text.replace(/</g, '&lt;') });
    input.value = '';

    // Typing delay proportional to answer length
    const answer = findAnswer(text);
    const delay  = 700 + Math.min(answer.length * 1.5, 1600);

    const typingEl = showTyping();

    await new Promise(r => setTimeout(r, delay));
    typingEl.remove();

    appendMsg({ role: 'bot', html: formatAnswer(answer) });
    isBusy = false;
  }

  // ── Open / close ────────────────────────────────────────
  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    iconOpen.hidden  = true;
    iconClose.hidden = false;
    dot.classList.remove('visible');

    if (firstOpen) {
      firstOpen = false;
      // Greeting after short delay
      setTimeout(() => {
        appendMsg({
          role: 'bot',
          html: formatAnswer(`¡Hola! 👋 Soy <strong>AIDA</strong>, asistente virtual de <strong>AMN Systems</strong>.\n\n¿En qué puedo ayudarte hoy? Puedes preguntarme sobre servicios, precios, tiempos de entrega o cómo empezar.`),
        });
      }, 400);
    }

    setTimeout(() => input.focus(), 350);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    iconOpen.hidden  = false;
    iconClose.hidden = true;
  }

  // Show dot after 4 s if user hasn't opened chat
  setTimeout(() => { if (!isOpen) dot.classList.add('visible'); }, 4000);

  // ── Events ──────────────────────────────────────────────
  toggle.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);

  form.addEventListener('submit', e => {
    e.preventDefault();
    sendMessage(input.value.trim());
  });

  quick.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.dataset.q));
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closePanel();
  });

})();

/* =====================
   CARD TILT — subtle 3D (desktop/mouse only)
   ===================== */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left) / rect.width  - 0.5;
      const y    = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-4px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
