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
  GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbzXIwuM3mCm46TXXzPFPdnSVE7VN-srKN0cYI9xyvpP8lGJJF-gtifbl40UHdsDOmtxiQ/exec',

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

  // Fire Purchase event immediately so it doesn't wait for backend response
  pixelTrack('Purchase', { content_name: formData.product, currency: 'AED' });

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


/* ─── Pixel: AddToCart on CTA click ──────────  */
function initCTATracking() {
  document.querySelectorAll('.btn-primary, .product-cta').forEach((btn) => {
    btn.addEventListener('click', () => {
      pixelTrack('AddToCart');
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

  if (typeof fbq === 'function') {
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

    if (eventName === 'ViewContent') ttq.track('ViewContent', ttqData);
    if (eventName === 'AddToCart') ttq.track('AddToCart', ttqData);
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

/* ─── Remote Config (CRM) ────────────────────  */
async function loadRemoteConfig() {
  if (!CONFIG.GAS_WEBAPP_URL) return;

  try {
    const response = await fetch(CONFIG.GAS_WEBAPP_URL + '?action=getConfig');
    const result = await response.json();
    if (result.status === 'success') {
      applyRemoteConfig(result.data);
    }
  } catch (e) {
    // Silent fail — use default values already in HTML
    console.log('CRM config: using defaults');
  }
}

function applyRemoteConfig(data) {
  if (!data) return;

  // ─── Prices ───
  const priceMap = {
    '1': { price: data.PRICE_PACKAGE_1, default: '180' },
    '2': { price: data.PRICE_PACKAGE_2, default: '300' },
    '3': { price: data.PRICE_PACKAGE_3, default: '450' }
  };

  Object.entries(priceMap).forEach(([key, val]) => {
    const price = val.price || val.default;
    // Update price display cards
    document.querySelectorAll(`[data-crm-price="${key}"]`).forEach(el => {
      el.textContent = price;
    });
  });

  // Update product select options and pricing CTAs
  const p1 = data.PRICE_PACKAGE_1 || '180';
  const p2 = data.PRICE_PACKAGE_2 || '300';
  const p3 = data.PRICE_PACKAGE_3 || '450';

  const productSelect = document.getElementById('field-product');
  if (productSelect) {
    const options = productSelect.querySelectorAll('option');
    if (options[1]) { options[1].value = `عبوة واحدة — ${p1} درهم`; options[1].textContent = `🍯 عبوة واحدة — ${p1} درهم`; }
    if (options[2]) { options[2].value = `عبوتان — ${p2} درهم`; options[2].textContent = `🍯🍯 عبوتان — ${p2} درهم (وفّري ${360 - parseInt(p2)} درهم)`; }
    if (options[3]) { options[3].value = `ثلاث عبوات — ${p3} درهم`; options[3].textContent = `🍯🍯🍯 ثلاث عبوات — ${p3} درهم (أفضل قيمة)`; }
  }

  // Update pricing card CTAs
  const pricingCtas = document.querySelectorAll('.pricing-cta');
  if (pricingCtas[0]) pricingCtas[0].setAttribute('onclick', `selectPackage('عبوة واحدة — ${p1} درهم', '${p1}')`);
  if (pricingCtas[1]) pricingCtas[1].setAttribute('onclick', `selectPackage('عبوتان — ${p2} درهم', '${p2}')`);
  if (pricingCtas[2]) pricingCtas[2].setAttribute('onclick', `selectPackage('ثلاث عبوات — ${p3} درهم', '${p3}')`);

  // Update saving badges
  const savingBadges = document.querySelectorAll('.pricing-saving');
  if (savingBadges[0]) savingBadges[0].innerHTML = `وفّري <strong>${parseInt(p1) * 2 - parseInt(p2)} درهم</strong> 🎉`;
  if (savingBadges[1]) savingBadges[1].innerHTML = `وفّري <strong>${parseInt(p1) * 3 - parseInt(p3)} درهم</strong> 💎`;

  // ─── WhatsApp ───
  if (data.WHATSAPP_NUMBER) {
    CONFIG.WHATSAPP_NUMBER = data.WHATSAPP_NUMBER;
    const waNum = data.WHATSAPP_NUMBER;
    // Update navbar WA link
    const navWa = document.getElementById('nav-whatsapp');
    if (navWa) navWa.href = `https://wa.me/${waNum}?text=مرحباً، أريد الاستفسار عن الرحيق الملكي`;
    // Update FAB
    const fabWa = document.getElementById('fab-wa');
    if (fabWa) fabWa.href = `https://wa.me/${waNum}?text=مرحباً، أريد الاستفسار عن الرحيق الملكي`;
    // Update footer WA links
    document.querySelectorAll('[data-crm-wa-link]').forEach(el => {
      el.href = `https://wa.me/${waNum}`;
    });
    // Update footer contact items
    document.querySelectorAll('.footer-contact-item[href*="wa.me"]').forEach(el => {
      el.href = `https://wa.me/${waNum}`;
    });
  }

  // ─── Social Links ───
  const socialMap = {
    'instagram': data.SOCIAL_INSTAGRAM,
    'tiktok': data.SOCIAL_TIKTOK,
    'snapchat': data.SOCIAL_SNAPCHAT
  };
  Object.entries(socialMap).forEach(([platform, url]) => {
    if (url) {
      document.querySelectorAll(`[data-crm-social="${platform}"]`).forEach(el => {
        el.href = url;
        el.target = '_blank';
        el.rel = 'noopener';
      });
    }
  });

  // ─── Announcement Texts ───
  if (data.ANNOUNCE_TEXT_1) {
    document.querySelectorAll('[data-crm-announce="1"]').forEach(el => {
      el.innerHTML = data.ANNOUNCE_TEXT_1;
    });
  }
  if (data.ANNOUNCE_TEXT_2) {
    document.querySelectorAll('[data-crm-announce="2"]').forEach(el => {
      el.innerHTML = data.ANNOUNCE_TEXT_2;
    });
  }
  if (data.ANNOUNCE_TEXT_3) {
    document.querySelectorAll('[data-crm-announce="3"]').forEach(el => {
      el.innerHTML = data.ANNOUNCE_TEXT_3;
    });
  }

  // ─── Form Fields Toggle ───
  const cityField = document.getElementById('field-city');
  if (cityField && data.FORM_SHOW_CITY === false) {
    cityField.closest('.form-group').style.display = 'none';
  }
  const addressField = document.getElementById('field-address');
  if (addressField && data.FORM_SHOW_ADDRESS === false) {
    addressField.closest('.form-group').style.display = 'none';
  }
  const notesField = document.getElementById('field-notes');
  if (notesField && data.FORM_SHOW_NOTES === false) {
    notesField.closest('.form-group').style.display = 'none';
  }

  // ─── Dynamic Pixels Injection ───
  if (data.FB_PIXEL_ID && !window.fbq) {
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', data.FB_PIXEL_ID);
    fbq('track', 'PageView');
  }

  if (data.TIKTOK_PIXEL_ID && !window.ttq) {
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
    var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
    ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
      ttq.load(data.TIKTOK_PIXEL_ID);
      ttq.page();
    }(window, document, 'ttq');
  }
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

  // Load remote CRM config
  loadRemoteConfig();

  // Form submit
  const form = document.getElementById('order-form');
  if (form) form.addEventListener('submit', handleFormSubmit);

  // Success modal close
  document.getElementById('success-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeSuccessModal();
  });

  // Pixel PageView & ViewContent
  pixelTrack('PageView');
  pixelTrack('ViewContent');
});
