/* ============================================================
   PARENT RESET — Main Script
   Chatbot · Scroll Animations · Nav · Stripe Checkout
   ============================================================ */

'use strict';

/* ── SCROLL ANIMATIONS ───────────────────────────────── */
const fadeObserver = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
);
document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

/* ── NAV SCROLL BEHAVIOUR ────────────────────────────── */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 48);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll(); // run on load in case page is already scrolled

/* ── MOBILE NAV ──────────────────────────────────────── */
const mobileToggle = document.getElementById('mobileToggle');
const mobileMenu   = document.getElementById('mobileMenu');

mobileToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  mobileToggle.setAttribute('aria-expanded', String(isOpen));
});
mobileMenu.querySelectorAll('a').forEach(link =>
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    mobileToggle.setAttribute('aria-expanded', 'false');
  })
);

/* ── SMOOTH ANCHOR SCROLL ────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80; // nav height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ============================================================
   GUIDED CHATBOT — 3-Minute Reset
   ============================================================ */

const chatbot          = document.getElementById('chatbot');
const chatbotMessages  = document.getElementById('chatbotMessages');
const chatbotInput     = document.getElementById('chatbotInput');
const chatbotSend      = document.getElementById('chatbotSend');
const chatbotInputArea = document.getElementById('chatbotInputArea');
const chatbotTrigger   = document.getElementById('chatbotTrigger');

let chatState = {
  step:    0,
  started: false,
  data: { name: '', friction: '', wish: '', fear: '' }
};

/**
 * Chat flow definition.
 * Each step is either:
 *   { type: 'bot', text: string | fn(state) }
 *   { type: 'user-input', saveTo: keyof data, placeholder: string }
 *   { type: 'cta', text: string, buttonText: string, buttonHref: string }
 */
const CHAT_FLOW = [
  {
    type: 'bot',
    text: 'Hi. I\'m glad you\'re here.\n\nThis takes about 3 minutes. No perfection required.\n\nMay I ask — what\'s your name?'
  },
  {
    type: 'user-input',
    saveTo: 'name',
    placeholder: 'Your first name...'
  },
  {
    type: 'bot',
    text: (s) => `${s.data.name}, thank you for being here.\n\nTell me — what is the exact moment that keeps breaking you with your child?\n\nThe moment that repeats. The one you can\'t seem to get past.`
  },
  {
    type: 'user-input',
    saveTo: 'friction',
    placeholder: 'The moment that keeps repeating...'
  },
  {
    type: 'bot',
    text: 'I hear you.\n\nThat sounds exhausting to carry — especially when you love them so much.\n\nIf that moment went differently, what would happen instead? What are you wishing for?'
  },
  {
    type: 'user-input',
    saveTo: 'wish',
    placeholder: 'What you wish would happen...'
  },
  {
    type: 'bot',
    text: 'Now I want to ask something deeper.\n\nUnder all of this — what are you really afraid this means?\n\nAbout your child? About yourself as a parent?'
  },
  {
    type: 'user-input',
    saveTo: 'fear',
    placeholder: 'The fear underneath...'
  },
  {
    type: 'bot',
    text: (s) => `${s.data.name}.\n\nWhat you just named — that is where the grip starts to loosen.\n\nWhen we can see the fear clearly, it begins to lose its power over us in the moment.\n\nYou are not broken. And neither is your child.\n\nYou came here because you care. That already tells me something important about you.`
  },
  {
    type: 'cta',
    text: 'Sharon works with parents through exactly this — not to fix your child, but to help you understand them in a way that changes everything.\n\nWould you like to book a reset session with her?',
    buttonText: 'Book your reset session →',
    buttonHref: '#booking'
  }
];

/* ── helpers ── */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function addMessage(html, type = 'bot') {
  const div = document.createElement('div');
  div.className = `chatbot__message chatbot__message--${type}`;
  div.innerHTML = html;
  chatbotMessages.appendChild(div);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  return div;
}

async function showTyping(durationMs) {
  const el = document.createElement('div');
  el.className = 'chatbot__typing';
  el.id = 'chatTyping';
  el.innerHTML = '<span></span><span></span><span></span>';
  chatbotMessages.appendChild(el);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  await sleep(durationMs);
  el.remove();
}

function textToHtml(text) {
  return text.replace(/\n/g, '<br>');
}

function typingDelay(text) {
  // 600ms base + ~7ms per char, capped at 2200ms
  return Math.min(600 + text.length * 7, 2200);
}

/* ── run a single step ── */
async function runStep() {
  if (chatState.step >= CHAT_FLOW.length) return;
  const step = CHAT_FLOW[chatState.step];

  if (step.type === 'bot') {
    const text = typeof step.text === 'function' ? step.text(chatState) : step.text;
    await showTyping(typingDelay(text));
    addMessage(textToHtml(text), 'bot');
    chatState.step++;
    // auto-advance to next step (which will be user-input or another bot)
    runStep();

  } else if (step.type === 'user-input') {
    chatbotInput.placeholder = step.placeholder || 'Type your answer...';
    chatbotInputArea.style.display = 'flex';
    chatbotInput.focus();
    // wait for user — handled via sendUserMessage()

  } else if (step.type === 'cta') {
    await showTyping(1600);
    const div = document.createElement('div');
    div.className = 'chatbot__message chatbot__message--cta';
    div.innerHTML = `<p>${textToHtml(step.text)}</p>
      <a href="${step.buttonHref}" class="chatbot__cta-btn" onclick="closeChatbot()">${step.buttonText}</a>`;
    chatbotMessages.appendChild(div);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    chatbotInputArea.style.display = 'none';
    chatState.step++;
  }
}

/* ── user sends a message ── */
function sendUserMessage() {
  const value = chatbotInput.value.trim();
  if (!value) return;

  const currentStep = CHAT_FLOW[chatState.step];
  if (!currentStep || currentStep.type !== 'user-input') return;

  // save
  chatState.data[currentStep.saveTo] = value;

  // render user bubble
  addMessage(value.replace(/</g, '&lt;').replace(/>/g, '&gt;'), 'user');

  // clear & hide input temporarily
  chatbotInput.value = '';
  chatbotInputArea.style.display = 'none';

  // advance
  chatState.step++;
  runStep();
}

/* ── open / close ── */
function openChatbot() {
  chatbot.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  if (!chatState.started) {
    chatState.started = true;
    chatbotInputArea.style.display = 'none'; // hidden until first user-input step
    runStep();
  }
  setTimeout(() => chatbotInput.focus(), 420);
}

// expose globally for onclick in HTML
window.closeChatbot = function () {
  chatbot.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
};

/* ── event listeners ── */
chatbotTrigger.addEventListener('click', openChatbot);
document.getElementById('closeChatbot').addEventListener('click', window.closeChatbot);
document.getElementById('chatbotBackdrop').addEventListener('click', window.closeChatbot);

chatbotSend.addEventListener('click', sendUserMessage);
chatbotInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendUserMessage(); }
});

// multiple "open chatbot" triggers
['openChatbot', 'openChatbot2', 'openChatbot3'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', openChatbot);
});

// close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && chatbot.getAttribute('aria-hidden') === 'false') {
    window.closeChatbot();
  }
});

/* ── FAQ ACCORDION ───────────────────────────────────── */
document.querySelectorAll('.faq__question').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen  = btn.getAttribute('aria-expanded') === 'true';
    const answer  = btn.nextElementSibling;

    // Close all other open items first
    document.querySelectorAll('.faq__question').forEach(other => {
      if (other !== btn) {
        other.setAttribute('aria-expanded', 'false');
        other.nextElementSibling.classList.remove('open');
      }
    });

    // Toggle current
    btn.setAttribute('aria-expanded', String(!isOpen));
    answer.classList.toggle('open', !isOpen);
  });
});

/* ── STICKY BOOKING BAR ──────────────────────────────── */
const stickyBar      = document.getElementById('stickyBar');
const stickyBarClose = document.getElementById('stickyBarClose');
let   stickyDismissed = false;

function updateStickyBar() {
  if (stickyDismissed || !stickyBar) return;
  const show = window.scrollY > window.innerHeight * 0.8;
  stickyBar.setAttribute('aria-hidden', String(!show));
  document.body.classList.toggle('sticky-visible', show);
}
window.addEventListener('scroll', updateStickyBar, { passive: true });

stickyBarClose.addEventListener('click', () => {
  stickyDismissed = true;
  stickyBar.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('sticky-visible');
});

// Auto-hide sticky bar when booking form is in view
const bookingSection = document.getElementById('booking');
if (bookingSection) {
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      stickyBar.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('sticky-visible');
    } else if (!stickyDismissed && window.scrollY > window.innerHeight * 0.8) {
      stickyBar.setAttribute('aria-hidden', 'false');
      document.body.classList.add('sticky-visible');
    }
  }, { threshold: 0.15 }).observe(bookingSection);
}

/* ============================================================
   STRIPE CHECKOUT
   ============================================================ */

const bookingForm = document.getElementById('bookingForm');
const checkoutBtn = document.getElementById('checkoutBtn');
const formError   = document.getElementById('formError');

function showFormError(msg) {
  formError.textContent = msg;
  formError.classList.add('visible');
  formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearFormError() {
  formError.textContent = '';
  formError.classList.remove('visible');
}

function validateForm() {
  clearFormError();
  const fields = [
    { id: 'parentName', label: 'Your name' },
    { id: 'childName',  label: "Your child's name" },
    { id: 'email',      label: 'Email address' },
    { id: 'phone',      label: 'Phone number' },
    { id: 'childAge',   label: "Child's age" },
  ];
  for (const f of fields) {
    const el = document.getElementById(f.id);
    const val = el.value.trim();
    el.classList.remove('error');
    if (!val) {
      el.classLis