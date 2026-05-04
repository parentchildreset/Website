/* ============================================================
   PARENT CHILD RESET — Main Script
   ============================================================ */
'use strict';

/* Make content visible immediately (JS-enhanced animations) */
document.documentElement.classList.add('js-ready');

/* ── SCROLL ANIMATIONS ───────────────────────────────────── */
const fadeObserver = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
);
document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

// Immediately reveal elements already in the viewport (avoids blank flash)
requestAnimationFrame(() => {
  document.querySelectorAll('.fade-up').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    }
  });
});

/* ── NAV SCROLL ──────────────────────────────────────────── */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 48);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ── MOBILE NAV ──────────────────────────────────────────── */
const mobileToggle = document.getElementById('mobileToggle');
const mobileMenu   = document.getElementById('mobileMenu');
mobileToggle.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  mobileToggle.setAttribute('aria-expanded', String(open));
});
mobileMenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    mobileToggle.setAttribute('aria-expanded', 'false');
  })
);

/* ── SMOOTH SCROLL ───────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const t = document.querySelector(this.getAttribute('href'));
    if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); }
  });
});

/* ============================================================
   CHATBOT — Guided 3-Minute Reset
   ============================================================ */
const chatbot          = document.getElementById('chatbot');
const chatbotMessages  = document.getElementById('chatbotMessages');
const chatbotInput     = document.getElementById('chatbotInput');
const chatbotSend      = document.getElementById('chatbotSend');
const chatbotInputArea = document.getElementById('chatbotInputArea');

let chatState = { step: 0, started: false, data: { name:'', friction:'', wish:'', fear:'' } };

const FLOW = [
  { type:'bot', text:"Hi. I'm glad you're here.\n\nThis takes about 3 minutes. No perfection required.\n\nMay I ask — what's your name?" },
  { type:'user-input', saveTo:'name', placeholder:'Your first name...' },
  { type:'bot', text:(s) => `${s.data.name}, thank you for being here.\n\nTell me — what is the exact moment that keeps breaking you with your child?\n\nThe moment that repeats. The one you can't seem to get past.` },
  { type:'user-input', saveTo:'friction', placeholder:'The moment that keeps repeating...' },
  { type:'bot', text:"I hear you.\n\nThat sounds exhausting to carry — especially when you love them so much.\n\nIf that moment went differently, what would happen instead? What are you wishing for?" },
  { type:'user-input', saveTo:'wish', placeholder:'What you wish would happen...' },
  { type:'bot', text:"Now I want to ask something deeper.\n\nUnder all of this — what are you really afraid this means?\n\nAbout your child? About yourself as a parent?" },
  { type:'user-input', saveTo:'fear', placeholder:'The fear underneath...' },
  { type:'bot', text:(s) => `${s.data.name}.\n\nWhat you just named — that is where the grip starts to loosen.\n\nWhen we can see the fear clearly, it begins to lose its power over us in the moment.\n\nYou are not broken. And neither is your child.\n\nYou came here because you care. That already tells me something important about you.` },
  { type:'cta', text:"Sharon works with parents through exactly this — not to fix your child, but to help you understand them in a way that changes everything.\n\nWould you like to book a reset session with her?", buttonText:"Book your reset session &rarr;", buttonHref:"#booking" }
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function addMsg(html, type) {
  const d = document.createElement('div');
  d.className = 'chatbot__message chatbot__message--' + type;
  d.innerHTML = html;
  chatbotMessages.appendChild(d);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  return d;
}

async function showTyping(ms) {
  const el = document.createElement('div');
  el.className = 'chatbot__typing'; el.id = 'chatTyping';
  el.innerHTML = '<span></span><span></span><span></span>';
  chatbotMessages.appendChild(el);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  await sleep(ms); el.remove();
}

function toHtml(t) { return t.replace(/\n/g,'<br>'); }

async function runStep() {
  if (chatState.step >= FLOW.length) return;
  const step = FLOW[chatState.step];
  if (step.type === 'bot') {
    const text = typeof step.text === 'function' ? step.text(chatState) : step.text;
    await showTyping(Math.min(600 + text.length * 7, 2200));
    addMsg(toHtml(text), 'bot');
    chatState.step++; runStep();
  } else if (step.type === 'user-input') {
    chatbotInput.placeholder = step.placeholder || 'Type your answer...';
    chatbotInputArea.style.display = 'flex';
    chatbotInput.focus();
  } else if (step.type === 'cta') {
    await showTyping(1600);
    const d = document.createElement('div');
    d.className = 'chatbot__message chatbot__message--cta';
    d.innerHTML = '<p>' + toHtml(step.text) + '</p><a href="' + step.buttonHref + '" class="chatbot__cta-btn" onclick="closeChatbot()">' + step.buttonText + '</a>';
    chatbotMessages.appendChild(d);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    chatbotInputArea.style.display = 'none';
    chatState.step++;
  }
}

function sendMsg() {
  const v = chatbotInput.value.trim(); if (!v) return;
  const step = FLOW[chatState.step]; if (!step || step.type !== 'user-input') return;
  chatState.data[step.saveTo] = v;
  addMsg(v.replace(/</g,'&lt;').replace(/>/g,'&gt;'), 'user');
  chatbotInput.value = '';
  chatbotInputArea.style.display = 'none';
  chatState.step++; runStep();
}

function openChatbot() {
  chatbot.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  if (!chatState.started) { chatState.started = true; chatbotInputArea.style.display = 'none'; runStep(); }
  setTimeout(() => chatbotInput.focus(), 420);
}

window.closeChatbot = function() {
  chatbot.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
};

document.getElementById('chatbotTrigger').addEventListener('click', openChatbot);
document.getElementById('closeChatbot').addEventListener('click', window.closeChatbot);
document.getElementById('chatbotBackdrop').addEventListener('click', window.closeChatbot);
chatbotSend.addEventListener('click', sendMsg);
chatbotInput.addEventListener('keydown', e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } });
['openChatbot','openChatbot2','openChatbot3'].forEach(id => { const el = document.getElementById(id); if(el) el.addEventListener('click', openChatbot); });
document.addEventListener('keydown', e => { if (e.key==='Escape' && chatbot.getAttribute('aria-hidden')==='false') window.closeChatbot(); });

/* ── FAQ ACCORDION ───────────────────────────────────────── */
document.querySelectorAll('.faq__question').forEach(btn => {
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.faq__question').forEach(o => {
      o.setAttribute('aria-expanded','false');
      o.nextElementSibling.classList.remove('open');
    });
    btn.setAttribute('aria-expanded', String(!open));
    btn.nextElementSibling.classList.toggle('open', !open);
  });
});

/* ── STICKY BAR ──────────────────────────────────────────── */
const stickyBar = document.getElementById('stickyBar');
const stickyClose = document.getElementById('stickyBarClose');
let stickyDismissed = false;

function updateSticky() {
  if (stickyDismissed || !stickyBar) return;
  const show = window.scrollY > window.innerHeight * 0.8;
  stickyBar.setAttribute('aria-hidden', String(!show));
}
window.addEventListener('scroll', updateSticky, { passive: true });

if (stickyClose) {
  stickyClose.addEventListener('click', () => {
    stickyDismissed = true;
    stickyBar.setAttribute('aria-hidden','true');
  });
}

const bookingEl = document.getElementById('booking');
if (bookingEl && stickyBar) {
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) stickyBar.setAttribute('aria-hidden','true');
    else if (!stickyDismissed && window.scrollY > window.innerHeight * 0.8) stickyBar.setAttribute('aria-hidden','false');
  }, { threshold: 0.15 }).observe(bookingEl);
}

/* ── STRIPE CHECKOUT ─────────────────────────────────────── */
const bookingForm = document.getElementById('bookingForm');
const checkoutBtn = document.getElementById('checkoutBtn');
const formError   = document.getElementById('formError');

function showErr(msg) {
  if (!formError) return;
  formError.textContent = msg;
  formError.classList.add('visible');
  formError.scrollIntoView({ behavior:'smooth', block:'center' });
}
function clearErr() {
  if (!formError) return;
  formError.textContent = '';
  formError.classList.remove('visible');
}

function validate() {
  clearErr();
  const fields = [
    { id:'parentName', label:'Your name' },
    { id:'childName',  label:"Your child's name" },
    { id:'email',      label:'Email address' },
    { id:'phone',      label:'Phone number' },
    { id:'childAge',   label:"Child's age" },
  ];
  for (const f of fields) {
    const el = document.getElementById(f.id);
    el.classList.remove('error');
    if (!el.value.trim()) {
      el.classList.add('error');
      showErr('Please fill in: ' + f.label);
      el.focus(); return false;
    }
  }
  const em = document.getElementById('email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) {
    em.classList.add('error');
    showErr('Please enter a valid email address.');
    em.focus(); return false;
  }
  return true;
}

if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    checkoutBtn.classList.add('btn--loading');
    checkoutBtn.textContent = 'Preparing your session...';
    const payload = {
      parentName:    document.getElementById('parentName').value.trim(),
      childName:     document.getElementById('childName').value.trim(),
      email:         document.getElementById('email').value.trim(),
      phone:         document.getElementById('phone').value.trim(),
      childAge:      document.getElementById('childAge').value,
      frictionPoint: document.getElementById('frictionPoint').value.trim(),
    };
    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
      });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Server error'); }
      const { url } = await res.json();
      if (url) { window.location.href = url; }
      else throw new Error('No checkout URL returned.');
    } catch(err) {
      checkoutBtn.classList.remove('btn--loading');
      checkoutBtn.innerHTML = 'Book &amp; pay to confirm &mdash; SGD <span class="price-display">180</span>';
      showErr(err.message.includes('fetch') ? 'Network error. Please check your connection and try again.' : (err.message || 'Something went wrong. Please email sharon@parentchildreset.com'));
    }
  });
}
