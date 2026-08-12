/* ============================================
   الرحيق الملكي | Royal Nectar
   JavaScript — Form Logic, Telegram API,
   Facebook Pixel, WhatsApp FAB, Animations
   ============================================ */

/* ─────────────────────────────────────────────
   ⚙️  CONFIGURATION — عدّل هذه القيم فقط
   ───────────────────────────────────────────── */
const CONFIG = {
  // رابط Web App الذي حصلنا عليه من Google Apps Script
  GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbzR_6fpS1zqkVkAVBuRWt4R_Q6ar_2Bnip_XXKK2jyYymU0mRZzpAq-LFlqEpILcbZI3g/exec',

  // WhatsApp رقم بدون + وبدون مسافات
  WHATSAPP_NUMBER: '971555039737',
};
/* ───────────────────────────────────────────── */


/* ─── Scroll Animations ──────────────────────  */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document
    .querySelectorAll('.reveal, .reveal-left, .reveal-right')
    .forEach((el) => observer.observe(el));
}


/* ─── Navbar Scroll Effect ───────────────────  */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}


/* ─── Quantity Buttons ───────────────────────  */
function initQuantity() {
  document.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('.qty-input');
      let val = parseInt(input.value) || 1;
      if (btn.dataset.action === 'plus')  val = Math.min(val + 1, 20);
      if (btn.dataset.action === 'minus') val = Math.max(val - 1, 1);
      input.value = val;
    });
  });
}


/* ─── Form Validation ────────────────────────  */
function validateForm() {
  let isValid = true;

  const rules = [
    {
      id:      'field-name',
      errorId: 'error-name',
      test:    (v) => v.trim().length >= 3,
      msg:     'الرجاء إدخال الاسم الكامل (3 أحرف على الأقل)',
    },
    {
      id:      'field-phone',
      errorId: 'error-phone',
      test:    (v) => /^(\+?971|0)5[0-9]{8}$/.test(v.replace(/\s|-/g, '')),
      msg:     'أدخل رقم واتساب إماراتي صحيح (مثال: 0501234567)',
    },
    {
      id:      'field-emirate',
      errorId: 'error-emirate',
      test:    (v) => v !== '',
      msg:     'الرجاء اختيار الإمارة',
    },
    {
      id:      'field-product',
      errorId: 'error-product',
      test:    (v) => v !== '',
      msg:     'الرجاء اختيار المنتج',
    },
  ];

  rules.forEach(({ id, errorId, test, msg }) => {
    const field = document.getElementById(id);
    const errorEl = document.getElementById(errorId);
    const group = field.closest('.form-group');
    const value = field.value;

    if (!test(value)) {
      group.classList.add('has-error');
      field.classList.add('error');
      if (errorEl) errorEl.textContent = msg;
      isValid = false;
    } else {
      group.classList.remove('has-error');
      field.classList.remove('error');
    }
  });

  return isValid;
}

// Clear error on input
function initFormRealtime() {
  ['field-name','field-phone','field-emirate','field-product'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      el.classList.remove('error');
      el.closest('.form-group').classList.remove('has-error');
    });
    el.addEventListener('change', () => {
      el.classList.remove('error');
      el.closest('.form-group').classList.remove('has-error');
    });
  });
}


/* ─── Facebook Pixel Helpers ─────────────────  */
function pixelTrack(event, params = {}) {
  if (typeof fbq === 'function') {
    fbq('track', event, params);
  }
}


/* ─── Form Submit Handler ────────────────────  */
async function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateForm()) {
    // Scroll to first error
    const firstError = document.querySelector('.form-input.error, .form-select.error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btn     = document.getElementById('submit-btn');
  const btnText = document.getElementById('submit-btn-text');
  const spinner = document.getElementById('submit-spinner');

  // Show loading
  btn.disabled = true;
  btnText.style.display = 'none';
  spinner.style.display = 'inline-block';

  const formData = {
    name:    document.getElementById('field-name').value.trim(),
    phone:   document.getElementById('field-phone').value.trim(),
    emirate: document.getElementById('field-emirate').value,
    city:    document.getElementById('field-city').value.trim(),
    address: document.getElementById('field-address').value.trim(),
    product: document.getElementById('field-product').value,
    notes:   document.getElementById('field-notes').value.trim(),
  };

  try {
    // Send to Google Apps Script Backend (which also handles Telegram)
    if (!CONFIG.GAS_WEBAPP_URL) {
      throw new Error("Backend URL is missing.");
    }
    
    const response = await fetch(CONFIG.GAS_WEBAPP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'newOrder', data: formData }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' } // plain to bypass CORS preflight issues
    });

    const result = await response.json();
    
    if (result.status === 'success') {
      // Success tracking
      pixelTrack('Purchase', { content_name: formData.product, currency: 'AED' });

      // Show modal
      document.getElementById('success-name').textContent = formData.name;
      document.getElementById('success-overlay').classList.add('show');
      document.getElementById('order-form').reset();
    } else {
      throw new Error("Backend error: " + result.message);
    }

  } catch (error) {
    console.error('Submission error:', error);
    alert('حدث خطأ أثناء إرسال الطلب. يرجى التواصل معنا مباشرةً عبر الواتساب.');
  } finally {
    btn.disabled = false;
    btnText.style.display = 'inline-block';
    spinner.style.display = 'none';
  }
}


/* ─── Success Modal ──────────────────────────  */
function showSuccessModal(data) {
  const overlay = document.getElementById('success-overlay');
  const nameEl  = document.getElementById('success-name');
  if (nameEl) nameEl.textContent = data.name;
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
  const overlay = document.getElementById('success-overlay');
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

function goToWhatsApp() {
  const msg = encodeURIComponent('مرحباً، لقد أرسلت طلبي للرحيق الملكي وأريد التأكيد 👑');
  window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  closeSuccessModal();
}


/* ─── Smooth scroll for CTA buttons ─────────  */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}


/* ─── Product Card CTAs → jump to form ───────  */
function selectProduct(value) {
  const select = document.getElementById('field-product');
  if (select) {
    select.value = value;
    select.dispatchEvent(new Event('change'));
  }
  document.getElementById('order-section').scrollIntoView({ behavior: 'smooth' });
}

/* ─── Pricing Package CTAs → select + scroll ─  */
function selectPackage(packageValue) {
  const select = document.getElementById('field-product');
  if (select) {
    select.value = packageValue;
    select.dispatchEvent(new Event('change'));
    // Remove error state if any
    select.classList.remove('error');
    select.closest('.form-group')?.classList.remove('has-error');
  }
  // Pixel tracking
  pixelTrack('InitiateCheckout', { content_name: packageValue });
  // Scroll to form
  const section = document.getElementById('order-section');
  if (section) {
    const offset = 100;
    const top = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}


/* ─── Pixel: InitiateCheckout on CTA click ───  */
function initCTATracking() {
  document.querySelectorAll('.btn-primary, .product-cta').forEach((btn) => {
    btn.addEventListener('click', () => {
      pixelTrack('InitiateCheckout');
    });
  });
}


/* ─── FAB WhatsApp link ──────────────────────  */
function initFAB() {
  const fab = document.getElementById('fab-wa');
  if (fab) {
    const msg = encodeURIComponent('مرحباً، أريد الاستفسار عن منتجات الرحيق الملكي 👑');
    fab.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${msg}`;
  }
}


/* ─── Fetch Config & Initialize App ──────── */
async function initApp() {
  if (!CONFIG.GAS_WEBAPP_URL) {
    console.warn("لم يتم إعداد رابط GAS_WEBAPP_URL.");
    return;
  }

  try {
    const response = await fetch(CONFIG.GAS_WEBAPP_URL + '?action=getConfig');
    const result = await response.json();
    
    if (result.status === 'success') {
      const data = result.data;
      
      // Update Prices in UI if provided
      if (data.PRICE_PACKAGE_1) updatePriceUI(1, data.PRICE_PACKAGE_1, 'عبوة واحدة');
      if (data.PRICE_PACKAGE_2) updatePriceUI(2, data.PRICE_PACKAGE_2, 'عبوتان');
      if (data.PRICE_PACKAGE_3) updatePriceUI(3, data.PRICE_PACKAGE_3, 'ثلاث عبوات');
      
      // Init Pixels
      if (data.FB_PIXEL_ID) initFacebookPixel(data.FB_PIXEL_ID);
      if (data.TIKTOK_PIXEL_ID) initTikTokPixel(data.TIKTOK_PIXEL_ID);
    }
  } catch (error) {
    console.error("فشل جلب الإعدادات من الخادم:", error);
  }
}

function updatePriceUI(packageNum, price, name) {
  // Update Price Amount in Card
  const cards = document.querySelectorAll('.pricing-card');
  if (cards[packageNum - 1]) {
    const priceAmount = cards[packageNum - 1].querySelector('.price-amount');
    if (priceAmount) priceAmount.textContent = price;
    
    // Update Button
    const btn = cards[packageNum - 1].querySelector('.pricing-cta');
    const fullText = `${name} — ${price} درهم`;
    if (btn) btn.setAttribute('onclick', `selectPackage('${fullText}', '${price}')`);
  }
  
  // Update Option in Select Form
  const select = document.getElementById('field-product');
  if (select && select.options[packageNum]) {
    const option = select.options[packageNum];
    if (packageNum === 1) option.textContent = `🍯 عبوة واحدة — ${price} درهم`;
    if (packageNum === 2) option.textContent = `🍯🍯 عبوتان — ${price} درهم (وفّري ${(price*2 - price)} درهم)`; // approximate saving text update
    if (packageNum === 3) option.textContent = `🍯🍯🍯 ثلاث عبوات — ${price} درهم (أفضل قيمة)`;
    option.value = `${name} — ${price} درهم`;
  }
}

/* ─── Pixels Initialization ──────────────── */
function initFacebookPixel(pixelId) {
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', pixelId);
  fbq('track', 'PageView');
  window.FB_PIXEL_ACTIVE = true;
}

function initTikTokPixel(pixelId) {
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
    ttq.load(pixelId);
    ttq.page();
  }(window, document, 'ttq');
  window.TIKTOK_PIXEL_ACTIVE = true;
}

function pixelTrack(eventName, data = {}) {
  // Extract price value for pixel tracking if missing
  if (!data.value && data.content_name) {
    const match = data.content_name.match(/(\d+)\s*درهم/);
    if (match) {
      data.value = parseInt(match[1], 10);
    } else {
      data.value = 180; // Default fallback
    }
  }

  if (window.FB_PIXEL_ACTIVE && typeof fbq === 'function') {
    fbq('track', eventName, data);
  }
  if (typeof ttq === 'object') {
    // Format data specifically for TikTok e-commerce requirements
    const ttqData = {
      content_type: 'product',
      content_id: data.content_name ? 'RN_' + data.value : 'RN_GENERIC',
      content_name: data.content_name || 'الرحيق الملكي',
      quantity: 1,
      price: data.value || 180,
      value: data.value || 180,
      currency: data.currency || 'AED',
      contents: [
        {
          content_id: data.content_name ? 'RN_' + data.value : 'RN_GENERIC',
          content_name: data.content_name || 'الرحيق الملكي',
          quantity: 1,
          price: data.value || 180
        }
      ]
    };

    if (eventName === 'InitiateCheckout') ttq.track('InitiateCheckout', ttqData);
    if (eventName === 'Purchase') ttq.track('CompletePayment', ttqData);
  }
}


/* ─── Counter Animation ──────────────────────  */
function animateCounter(el, target, suffix = '') {
  const duration = 1800;
  const start    = performance.now();
  const update   = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease out cubic
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = '1';
        const target = parseInt(entry.target.dataset.counter);
        const suffix = entry.target.dataset.suffix || '';
        animateCounter(entry.target, target, suffix);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((el) => obs.observe(el));
}


/* ─── FAQ Accordion ──────────────────────────  */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-question');
  faqItems.forEach(item => {
    item.addEventListener('click', () => {
      const parent = item.parentElement;
      const isActive = parent.classList.contains('active');
      
      // Close all
      document.querySelectorAll('.faq-item').forEach(el => {
        el.classList.remove('active');
        el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // If it wasn't active, open it
      if (!isActive) {
        parent.classList.add('active');
        item.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ─── Init All ───────────────────────────────  */
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initNavbar();
  initQuantity();
  initFormRealtime();
  initSmoothScroll();
  initCTATracking();
  initFAB();
  initCounters();
  initFAQ();

  // Form submit
  const form = document.getElementById('order-form');
  if (form) form.addEventListener('submit', handleFormSubmit);

  // Success modal close
  document.getElementById('success-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeSuccessModal();
  });

  // Pixel PageView
  pixelTrack('PageView');
});
