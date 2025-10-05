(function() {
  const pages = [
    document.getElementById('page-1'),
    document.getElementById('page-2'),
    document.getElementById('page-3'),
    document.getElementById('page-4')
  ];

  function showPage(index) {
    pages.forEach((p, i) => {
      if (i === index) {
        p.classList.add('page-enter');
        requestAnimationFrame(() => { p.classList.add('page-active'); });
      } else {
        p.classList.remove('page-active');
        p.classList.remove('page-enter');
      }
    });
    currentPage = index;
    if (currentPage === 3) stopHearts(); else startHearts();
  }

  let currentPage = 0;

  // Toast popups (top-center)
  const toastRoot = document.getElementById('toast');
  function showToast(message) {
    const div = document.createElement('div');
    div.className = 'toast-item';
    div.textContent = message;
    toastRoot.appendChild(div);
    setTimeout(() => div.remove(), 3200);
  }

  // Floating hearts (SVG) with exclusion over central cards on pages 1-3
  const heartsBg = document.querySelector('.hearts-bg');
  const landingCard = document.getElementById('landingCard');
  const verifyCard = document.getElementById('verifyCard');
  const envelopeEl = document.getElementById('envelope');

  function isInsideExclusion(xvw, yvh) {
    if (currentPage === 3) return false; // page 4 has no hearts
    let rect;
    if (currentPage === 0 && landingCard) rect = landingCard.getBoundingClientRect();
    else if (currentPage === 1 && verifyCard) rect = verifyCard.getBoundingClientRect();
    else if (currentPage === 2 && envelopeEl) rect = envelopeEl.getBoundingClientRect();
    if (!rect) return false;

    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const leftVw = (rect.left / vw) * 100;
    const rightVw = ((rect.left + rect.width) / vw) * 100;
    const topVh = (rect.top / vh) * 100;
    const bottomVh = ((rect.top + rect.height) / vh) * 100;

    return xvw > leftVw - 5 && xvw < rightVw + 5 && yvh > topVh - 5 && yvh < bottomVh + 5;
  }

  function createHeartSVG(size) {
    const span = document.createElement('span');
    span.className = 'heart';
    span.style.width = size + 'px';
    span.style.height = size + 'px';
    span.innerHTML = `<svg viewBox="0 0 34 29" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><path fill="url(#g)" d="M23.6,0c-2.6,0-4.9,1.3-6.6,3.4C15.3,1.3,13,0,10.4,0C4.7,0,0,4.7,0,10.4c0,10.6,16.9,18.1,17,18.2 c0.2-0.1,17-7.6,17-18.2C34,4.7,29.3,0,23.6,0z" /></svg>`;
    const svg = span.querySelector('svg');
    const defs = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
    defs.setAttribute('id','g');
    defs.setAttribute('x1','0%'); defs.setAttribute('y1','0%'); defs.setAttribute('x2','100%'); defs.setAttribute('y2','100%');
    const s1 = document.createElementNS('http://www.w3.org/2000/svg','stop'); s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','#ffd6e8');
    const s2 = document.createElementNS('http://www.w3.org/2000/svg','stop'); s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#ff8fb3');
    defs.appendChild(s1); defs.appendChild(s2);
    const defsWrap = document.createElementNS('http://www.w3.org/2000/svg','defs');
    defsWrap.appendChild(defs);
    svg.insertBefore(defsWrap, svg.firstChild);
    return span;
  }

  function spawnHeart() {
    const size = 14 + Math.random() * 20;
    const heart = createHeartSVG(size);

    // Clamp spawn away from extreme edges to avoid clipping
    let left = 2 + Math.random() * 96; // 2vw .. 98vw
    let top = -12 + Math.random() * 6;
    let tries = 0;
    while (isInsideExclusion(left, 0) && tries < 16) { left = 2 + Math.random() * 96; tries++; }
    heart.style.left = left + 'vw';
    heart.style.top = top + 'vh';

    const duration = 10 + Math.random() * 8;
    heart.style.animation = `rainDown ${duration}s linear forwards`;
    heart.style.animationDelay = (Math.random() * 1.2) + 's';
    heartsBg.appendChild(heart);
    setTimeout(() => heart.remove(), (duration + 2) * 1000);
  }

  let heartInterval;
  function startHearts() {
    if (currentPage === 3) return; // disable on page 4
    if (heartInterval) return;
    const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const initial = isLowEnd ? 18 : 32;
    const intervalMs = isLowEnd ? 520 : 380;
    for (let i = 0; i < initial; i++) spawnHeart();
    heartInterval = setInterval(spawnHeart, intervalMs);
  }
  function stopHearts() {
    clearInterval(heartInterval);
    heartInterval = undefined;
    setTimeout(() => { heartsBg.querySelectorAll('.heart').forEach(h => h.remove()); }, 1200);
  }
  startHearts();

  // Page 1 -> Page 2
  const beginBtn = document.getElementById('beginBtn');
  const bgMusic = document.getElementById('bgMusic');
  beginBtn.addEventListener('click', async () => {
    showPage(1);
    // Prime audio on first user gesture to satisfy autoplay policies
    if (bgMusic) { try { await bgMusic.play(); bgMusic.pause(); } catch(_) {} }
  });

  // Verification logic (strict: age 20 and PIN 0715 only)
  const verifyForm = document.getElementById('verifyForm');
  const ageInput = document.getElementById('age');
  const pinInput = document.getElementById('pin');
  const verifyMsg = document.getElementById('verifyMsg');
  const REQUIRED_AGE = 20;
  const CORRECT_PIN = '0715';

  verifyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const age = parseInt(ageInput.value, 10);
    const pin = (pinInput.value || '').trim();

    if (age !== REQUIRED_AGE) { showError(`Age must be ${REQUIRED_AGE}.`); return; }
    if (pin !== CORRECT_PIN) { showError('Oops! Try again 🥺'); pinInput.focus(); pinInput.select?.(); return; }

    showSuccess('Verified 💕');
    setTimeout(() => { showPage(2); }, 450);
  });

  function showError(msg) { verifyMsg.textContent = msg; verifyMsg.classList.remove('hidden', 'success'); verifyMsg.classList.add('error'); }
  function showSuccess(msg) { verifyMsg.textContent = msg; verifyMsg.classList.remove('hidden', 'error'); verifyMsg.classList.add('success'); }

  // Envelope behavior — letter remains outside after open until closed
  const envelope = document.getElementById('envelope');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const finalMsg = document.getElementById('finalMsg');
  const letterEl = envelope.querySelector('.letter');
  const letterBody = envelope.querySelector('.letter-body');
  const scrollHint = envelope.querySelector('.scroll-hint');
  let userHasScrolledLetter = false;

  function toggleEnvelope(forceOpen) {
    if (typeof forceOpen === 'boolean') envelope.classList.toggle('open', forceOpen);
    else envelope.classList.toggle('open');

    const isOpen = envelope.classList.contains('open');
    if (!bgMusic) return;
    if (isOpen) {
      // Try to play when opened
      try { bgMusic.muted = false; } catch(_) {}
      // If metadata not loaded, try to load first (helps some browsers)
      if (bgMusic.readyState < 2) { try { bgMusic.load(); } catch(_) {} }
      bgMusic.play().catch(() => {});
      // Reset scroll state when opening
      if (letterBody) {
        letterBody.scrollTop = 0;
        scrollHint?.classList.remove('hide');
        letterEl?.classList.remove('at-bottom');
        userHasScrolledLetter = false;
      }
    } else {
      bgMusic.pause();
    }
  }
  envelope.addEventListener('click', () => toggleEnvelope());
  envelope.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEnvelope(); }});

  // Prevent clicks inside the letter or on its buttons from toggling the envelope
  if (letterEl) {
    letterEl.addEventListener('click', (e) => e.stopPropagation());
  }
  if (letterBody) {
    letterBody.addEventListener('click', (e) => e.stopPropagation());
    const onScroll = () => {
      if (!letterBody) return;
      if (letterBody.scrollTop > 8) { scrollHint?.classList.add('hide'); userHasScrolledLetter = true; }
      const threshold = 16; // px tolerance for bottom detection
      const atBottom = Math.ceil(letterBody.scrollTop + letterBody.clientHeight + threshold) >= letterBody.scrollHeight;
      if (userHasScrolledLetter && atBottom) { letterEl?.classList.add('at-bottom'); } else { letterEl?.classList.remove('at-bottom'); }
    };
    letterBody.addEventListener('scroll', onScroll);
    // Allow touch scrolling inside the letter body without toggling the envelope
    letterBody.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
    letterBody.addEventListener('touchmove', (e) => { e.stopPropagation(); }, { passive: true });
    letterBody.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
    letterBody.addEventListener('pointermove', (e) => { e.stopPropagation(); });
  }
  yesBtn.addEventListener('click', (e) => e.stopPropagation());
  noBtn.addEventListener('click', (e) => e.stopPropagation());

  // No -> playful error toast + enlarge Yes; keep letter out
  const messages = ["ekep ka pala eh", 'sure na yan?', 'parang awa mo naaa', 'babyyyy🥺', 'what if bigyan kita kare-kare?', 'ayaw mo ba sa yakap at halik ko?'];
  let msgIndex = 0; let yesScale = 1; let noClicks = 0;
  noBtn.addEventListener('click', () => {
    noClicks++;
    showToast(messages[msgIndex % messages.length]);
    msgIndex++;
    yesScale = Math.min(yesScale + 0.14, 3.6);
    yesBtn.style.transform = `scale(${yesScale})`;
    toggleEnvelope(true); // keep it open so letter stays out
  });

  // Yes -> Page 4 with daisies + send silent email with counts
  yesBtn.addEventListener('click', async () => {
    try { await sendFeedbackEmail({ accepted: true, noClicks }); } catch(_) {}
    showPage(3);
    startDaisies();
  });

  // EmailJS (silent) — configured with provided keys
  const EMAILJS_PUBLIC_KEY = 'M0Hs8NzIMnUB7GSqx';
  const EMAILJS_SERVICE_ID = 'service_0e04qbo';
  const EMAILJS_TEMPLATE_ID = 'template_ou4g1l4';
  if (window.emailjs) { emailjs.init(EMAILJS_PUBLIC_KEY); }
  async function sendFeedbackEmail(payload) {
    if (!window.emailjs) return;
    const subject = payload.accepted ? 'She said YES 💖' : 'She did not say yes';
    const body = `Decision: ${payload.accepted ? 'YES' : 'NO'}\nNo button clicks: ${String(payload.noClicks ?? 0)}\nTime: ${new Date().toLocaleString()}`;
    const templateParams = {
      to_email: 'taylanreginam@gmail.com',
      accepted: payload.accepted ? 'yes' : 'no',
      no_clicks: String(payload.noClicks ?? 0),
      timestamp: new Date().toISOString(),
      subject,
      message: body
    };
    try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams); } catch (_) {}
  }

  // Daisies animation (page 4)
  const daisiesBg = document.getElementById('daisiesBg');
  const colors = ['#ff9ac2', '#ffd166', '#7be3c6', '#a29bfe', '#f4a261', '#f77f00'];
  const glyphs = ['✿','❀'];
  function createDaisy() {
    const span = document.createElement('span');
    span.className = 'daisy';
    span.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    span.style.left = Math.random() * 100 + 'vw';
    span.style.color = colors[Math.floor(Math.random() * colors.length)];
    const size = 16 + Math.random() * 28; span.style.fontSize = size + 'px';
    const dur = 5 + Math.random() * 6; span.style.animationDuration = dur + 's';
    daisiesBg.appendChild(span);
    setTimeout(() => span.remove(), (dur + 1) * 1000);
  }
  let daisyTimer; function startDaisies() {
    const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const initial = isLowEnd ? 10 : 18;
    const intervalMs = isLowEnd ? 480 : 320;
    for (let i = 0; i < initial; i++) createDaisy();
    daisyTimer = setInterval(createDaisy, intervalMs);
  }
})();
