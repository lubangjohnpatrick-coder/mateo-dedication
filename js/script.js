/* ============================================================
   Mateo Gray Dedication — Passport Invitation
   ------------------------------------------------------------
   CONFIG lives at the top of this file. All event details,
   backend URL, and map links are edited there.
   ============================================================ */
(function () {
  'use strict';

  var CONFIG = window.MATEO_CONFIG;

/* Preview mode = honest, labelled, non-saving mode. RSVP is always sent
      through the Google Form link opened in a new tab — GitHub static hosting
      cannot read the submitted response — so the on-page boarding pass is a
      clearly-labelled preview and the site never claims it auto-created a
      personalised pass from an attendee name.                            */
   var isPreview = true;

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supports3d = (function () {
    try { return CSS.supports('transform-style', 'preserve-3d'); } catch (e) { return false; }
  })();
  if (!supports3d || prefersReduced) document.body.classList.add('no3d');

  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var activeGuestName = 'MATEO GRAY\u2019S GUEST';
  var activeTicket = 'PREVIEW-GUEST-001';
  var activeParty = '1 guest \u00b7 Preview';
  var audioUnlocked = false;

  /* ==========================================================
     Text helpers
     ========================================================== */
  function normalizeName(name) {
    return String(name || '').toUpperCase().replace(/\s+/g, ' ').trim();
  }
  function buildMrz() { return activeTicket; }
  function newRequestId() {
    return window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }
  function partyText(value) {
    return value === 'Just me' ? '1 guest · Just you' : value === '11 or more' ? '12+ guests · Including you' : (Number(value) + 1) + ' guests · Including you';
  }

  /* ==========================================================
     Event details injection (single source of truth)
     ========================================================== */
  function applyConfig() {
    $('deName').textContent = CONFIG.childFull;
    $('deDate').textContent = CONFIG.dateLong;
    $('deTime').textContent = CONFIG.timeInvitation || CONFIG.time;
    $('deVenue').textContent = CONFIG.venueShort;
    $('bpDate').textContent = String(CONFIG.dateBoarding || CONFIG.dateLong || CONFIG.dateShort || '').toUpperCase();
    $('bpTime').textContent = (CONFIG.time + ' AT CHURCH').toUpperCase();
    $('bpChurch').textContent = String(CONFIG.church || '').replace(/\s*\([^)]*\)/g, '');
    $('bpReception').textContent = String(CONFIG.reception || '').replace(/,/g, '');
    $('bpDedicationDay').textContent = CONFIG.childFull;
    $('bpClass').textContent = CONFIG.boardingClass;

    if (CONFIG.gate) $('bpGate').textContent = 'GATE ' + CONFIG.gate;
    if (CONFIG.seat) $('bpSeat').textContent = 'SEAT ' + CONFIG.seat;

    var passMsg = $('passPreview');
    if (passMsg) { passMsg.hidden = false; passMsg.textContent = 'PREVIEW \u00b7 RSVP VIA GOOGLE FORMS'; }

    var bpTitle = $('bpTitle');
    if (bpTitle) {
      var l1 = bpTitle.querySelector('.bp-heading-line1');
      if (l1) l1.textContent = 'Your boarding pass preview';
      var l2 = bpTitle.querySelector('.bp-heading-line2');
      if (l2) l2.textContent = 'A clearly-labelled preview \u2014 RSVP through the Google Form (new tab) to be counted on the guest list.';
    }

    var view = $('viewPass');
    if (view) view.hidden = true;
  }

  /* ==========================================================
     Toast helper
     ========================================================== */
  var toastTimer = null;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3600);
  }

  /* ==========================================================
     Sound engine — procedural Web Audio, no assets required.
     Defaults to on and starts on the first user gesture; browser autoplay
     policy still blocks audio before interaction.
     ========================================================== */
  var Sounds = {
    ctx: null,
    enabled: false,
    ambientOn: false,
    ambientTimer: null,

    ensure: function () {
      if (this.ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    },

    noiseBurst: function (start, dur, freqFrom, freqTo, gain) {
      if (!this.ctx) return;
      var t = this.ctx.currentTime + start;
      var buf = this.ctx.createBuffer(1, Math.max(1, Math.floor(this.ctx.sampleRate * dur)), this.ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * dur * 0.35));
      }
      var src = this.ctx.createBufferSource();
      src.buffer = buf;
      var flt = this.ctx.createBiquadFilter();
      flt.type = 'bandpass';
      flt.frequency.setValueAtTime(freqFrom, t);
      flt.frequency.exponentialRampToValueAtTime(Math.max(60, freqTo), t + dur);
      flt.Q.value = 0.9;
      var g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain || 0.5, t + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(flt); flt.connect(g); g.connect(this.ctx.destination);
      src.start(t); src.stop(t + dur + 0.05);
    },

    tone: function (start, freq, gain, dur, type) {
      if (!this.ctx) return;
      var t = this.ctx.currentTime + start;
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain || 0.16, t + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.2));
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + (dur || 0.2) + 0.05);
    },

    paper: function () {
      if (!this.enabled || !this.ctx) return;
      this.noiseBurst(0, 0.42, 1100, 360, 0.28);
      this.tone(0, 261.63, 0.10, 0.32, 'sine');
      this.tone(0.11, 392.00, 0.08, 0.42, 'sine');
      this.tone(0.24, 523.25, 0.06, 0.56, 'sine');
    },
    orient: function () {
      if (!this.enabled || !this.ctx) return;
      this.noiseBurst(0, 0.70, 760, 180, 0.18);
      this.tone(0, 196.00, 0.07, 0.70, 'sine');
      this.tone(0.14, 261.63, 0.08, 0.72, 'sine');
      this.tone(0.30, 329.63, 0.07, 0.78, 'sine');
    },
    close: function () {
      if (!this.enabled || !this.ctx) return;
      this.noiseBurst(0, 0.45, 520, 210, 0.24);
      this.tone(0, 392.00, 0.08, 0.28, 'sine');
      this.tone(0.13, 261.63, 0.07, 0.42, 'sine');
    },
    chime: function (major) {
      if (!this.enabled || !this.ctx) return;
      var freqs = major ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
      var self = this;
      freqs.forEach(function (f, i) { self.tone(i * 0.12, f, 0.15, 0.9); });
    },
    stamp: function () {
      if (!this.enabled || !this.ctx) return;
      this.tone(0, 150, 0.55, 0.22, 'sine');
      this.noiseBurst(0.02, 0.16, 4000, 6000, 0.25);
      this.tone(0.02, 2100, 0.1, 0.08, 'square');
    },

    ambientTick: function () {
      if (!this.ctx || !this.ambientOn) return;
      var self = this;
      var melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 783.99, 698.46];
      melody.forEach(function (f, i) {
        self.tone(i * 0.30, f, 0.045, 0.54, 'sine');
      });
      [261.63, 329.63, 392.00].forEach(function (f, i) {
        self.tone(0.05 + i * 0.04, f, 0.018, 2.35, 'sine');
      });
      if (this.ambientTimer) clearTimeout(this.ambientTimer);
      this.ambientTimer = setTimeout(function () { self.ambientTick(); }, 2550);
    },
    startAmbient: function () {
      this.ensure();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (!this.ambientOn) { this.ambientOn = true; this.ambientTick(); }
    },
    stopAmbient: function () {
      this.enabled = false;
      this.ambientOn = false;
      if (this.ambientTimer) clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
      if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
    },
    enable: function () {
      this.ensure();
      this.enabled = true;
    }
  };

  var pref = null;
  try { pref = localStorage.getItem('mg-sound'); } catch (e) { /* ignore */ }
  // Sound is opt-out: browsers still require the first user gesture before audio can play.
  var soundDesired = pref === null ? true : pref === 'on';

  function syncSoundUI() {
    $('sound-toggle').setAttribute('aria-pressed', soundDesired ? 'true' : 'false');
    $('sound-toggle').setAttribute('aria-label', soundDesired ? 'Mute sounds' : 'Turn sounds on');
    $('sound-label').textContent = soundDesired ? 'Sound on' : 'Sound off';
  }
  function applySound() {
    if (soundDesired && audioUnlocked) { Sounds.enable(); Sounds.startAmbient(); }
    else { Sounds.stopAmbient(); }
  }
  function unlockAudio() {
    audioUnlocked = true;
    applySound();
    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  }

  $('sound-toggle').addEventListener('click', function () {
    audioUnlocked = true;
    soundDesired = !soundDesired;
    applySound();
    toast(soundDesired ? 'Sounds on' : 'Sounds muted');
    try { localStorage.setItem('mg-sound', soundDesired ? 'on' : 'off'); } catch (e) { /* ignore */ }
    syncSoundUI();
  });
  syncSoundUI();
  applySound();
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });

  /* ==========================================================
     Passport open / close
     ========================================================== */
  var cover = $('frontCover');
  var opened = false;
  var opening = false;
  var openTimer = null;
  var nav = document.createElement('nav');
  nav.className = 'mobile-page-nav';
  nav.id = 'pageNav';
  nav.hidden = true;
  nav.setAttribute('aria-label', 'Passport pages');
  nav.innerHTML = '<button type="button" data-page="story" aria-pressed="true">01 · The Dedication</button><button type="button" data-page="details" aria-pressed="false">02 · Event Details</button>';
  $('heroActions').before(nav);
  nav.addEventListener('click', function (e) {
    var button = e.target.closest('[data-page]');
    if (!button) return;
    $('passport').dataset.page = button.dataset.page;
    nav.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
    Sounds.paper();
  });

  function openPassport(fromCover) {
    if (opened || opening) return;
    opened = true;
    opening = true;
    var passport = $('passport');
    passport.dataset.state = 'orienting';
    cover.setAttribute('aria-expanded','true');
    cover.setAttribute('aria-busy','true');
    cover.tabIndex = -1;
    $('openingHint').hidden = true;
    $('spread').inert = true;
    document.body.classList.add('passport-orienting');
    if (fromCover) { Sounds.orient(); }

    // Let the closed passport complete its orientation turn before the hinge opens.
    openTimer = window.setTimeout(function () {
      if (!opening) return;
      opening = false;
      openTimer = null;
      document.body.classList.remove('passport-orienting');
      document.body.classList.add('open');
      passport.dataset.state = 'open';
      cover.removeAttribute('aria-busy');
      $('heroActions').hidden = false;
      $('viewPass').hidden = false;
      $('spread').inert = false;
      nav.hidden = false;
      $('spread').setAttribute('aria-hidden', 'false');
      $('hero').setAttribute('aria-label', 'Open passport invitation');
      Sounds.paper();
      window.setTimeout(function () {
        var t = $('rsvpTrigger');
        if (t && opened && !anyModalOpen()) t.focus({ preventScroll: true });
      }, 760);
    }, prefersReduced ? 0 : 700);
  }
  function closePassport() {
    if (!opened && !opening) return;
    if (openTimer) window.clearTimeout(openTimer);
    openTimer = null;
    opening = false;
    opened = false;
    var passport = $('passport');
    passport.dataset.state = 'closed';
    cover.setAttribute('aria-expanded','false');
    cover.removeAttribute('aria-busy');
    cover.tabIndex = 0;
    $('heroActions').hidden = true;
    $('viewPass').hidden = true;
    $('openingHint').hidden = false;
    nav.hidden = true;
    $('spread').inert = true;
    document.body.classList.remove('open','passport-orienting');
    $('spread').setAttribute('aria-hidden', 'true');
    $('hero').setAttribute('aria-label', 'Closed passport');
    Sounds.close();
    window.setTimeout(function () { cover.focus({ preventScroll: true }); }, 200);
  }

  cover.addEventListener('click', function (ev) {
    if (ev.target.closest('button')) return;
    openPassport(true);
  });
  cover.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      openPassport(true);
    }
  });
  $('closePassport').addEventListener('click', closePassport);

  /* ==========================================================
     Modal helpers (focus trap + a11y)
     ========================================================== */
  var openModalId = null;

  function anyModalOpen() {
    return $('bpModal').hidden === false;
  }

  function showModal(id) {
    var modal = $(id);
    modal.classList.remove('hidden');
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    document.querySelector('.stage').inert = true;
    $('soundbar').inert = true;
    var card = modal.querySelector('.modal-card');
    if (card && card.animate && !prefersReduced) {
      card.animate(
        [{ opacity: 0, transform: 'translateY(16px) scale(0.98)' }, { opacity: 1, transform: 'none' }],
        { duration: 300, easing: 'cubic-bezier(.22,.9,.28,1)' }
      );
    }
    openModalId = id;
    if (id === 'bpModal') {
      window.setTimeout(fitBoardingPass, 0);
      window.setTimeout(fitBoardingPass, 120);
    }
    var focusable = getFocusable(modal);
    if (focusable.length) focusable[0].focus();
  }

  function hideModal(id, returnFocus) {
    var modal = $(id);
    modal.classList.add('hidden');
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    if (openModalId === id) openModalId = null;
    if (!anyModalOpen()) {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
      document.querySelector('.stage').inert = false;
      $('soundbar').inert = false;
    }
    if (returnFocus && returnFocus.focus) returnFocus.focus();
    else if (!anyModalOpen() && opened) $('rsvpTrigger').focus();
  }

  function getFocusable(root) {
    return $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', root)
      .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
  }

  function currentFocusable() {
    if (!openModalId) return null;
    var items = getFocusable($(openModalId));
    var idx = items.indexOf(document.activeElement);
    return { items: items, idx: idx };
  }

  document.addEventListener('keydown', function (ev) {
    if (!anyModalOpen()) return;
    if (ev.key === 'Escape') {
      ev.preventDefault();
      hideModal('bpModal', $('rsvpTrigger'));
      return;
    }
    if (ev.key === 'Tab') {
      var f = currentFocusable();
      if (!f || !f.items.length) return;
      if (ev.shiftKey && f.idx <= 0) { ev.preventDefault(); f.items[f.items.length - 1].focus(); }
      else if (!ev.shiftKey && f.idx === f.items.length - 1) { ev.preventDefault(); f.items[0].focus(); }
    }
  });

  $$('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      hideModal('bpModal', $('rsvpTrigger'));
    });
  });

  $('bpViewInvite').addEventListener('click', function () {
    hideModal('bpModal');
    if (!opened) openPassport(true);
  });

  /* ==========================================================
     RSVP: one action only — open the Google Form in a new tab.
     There is no custom questionnaire, and because static hosting
     cannot read the submitted response, the boarding pass here is
     an honest labelled preview (never a claimed personalised pass).
     ========================================================== */
  var rsvpTrigger = $('rsvpTrigger');

  rsvpTrigger.addEventListener('click', function () {
    var url = CONFIG.formUrl ||
      'https://docs.google.com/forms/d/e/1FAIpQLScAuOmAzvQ6JNdb-mUTfGfAYw9mp9Uvv7SWZkjbxv_TO3Xx4w/viewform';
    window.open(url, '_blank', 'noopener');
    try { rsvpTrigger.blur(); } catch (e) { /* ignore */ }
    toast('Opening the RSVP form in a new tab\u2026');
  });

  $('viewPass').addEventListener('click', function () {
    buildBoardingPass();
    $('boardingPass').classList.add('reveal');
    showModal('bpModal');
    Sounds.paper();
  });

  /* ==========================================================
     Boarding pass (DOM)
     ========================================================== */
  function fitBoardingPass() {
    var scroll = $('bpScroll');
    var viewport = $('bpViewport');
    if (!scroll || !viewport) return;
    var available = scroll.clientWidth || (window.innerWidth - 48);
    var minimum = window.innerWidth <= 740 ? 0.5 : 0.45;
    var scale = Math.min(1, Math.max(minimum, available / 1314));
    viewport.style.setProperty('--bp-scale', scale.toFixed(4));
    var scaledWidth = Math.round(1314 * scale);
    var scaledHeight = Math.round(621 * scale);
    viewport.style.width = scaledWidth + 'px';
    viewport.style.minWidth = scaledWidth + 'px';
    viewport.style.height = scaledHeight + 'px';
    viewport.style.minHeight = scaledHeight + 'px';
  }
  window.addEventListener('resize', fitBoardingPass);

  function buildBoardingPass(guestName) {
    activeGuestName = normalizeName(guestName) || 'MATEO GRAY\u2019S GUEST';
    $('bpPassenger').textContent = activeGuestName;
    $('bpMrz').textContent = buildMrz();
    $('bpParty').textContent = activeParty;
    $('bpFootnote').innerHTML = 'This is a <span class="preview-tag">PREVIEW</span> pass \u2014 RSVP through the Google Form (new tab) to be counted on the guest list.';
    renderQRCodes();
  }

  function qrTargets() {
    var maps = CONFIG.maps || {};
    return [
      { url: maps.church || '', box: 'qrChurchBox', cap: 'Church Directions', asset: 'assets/church-qr.png' },
      { url: maps.reception || '', box: 'qrReceptionBox', cap: 'Reception Directions', asset: 'assets/reception-qr.png' }
    ];
  }

  function renderQRCodes() {
    qrTargets().forEach(function (target) {
      var box = $(target.box);
      if (!box) return;
      var figure = box.closest('figure');
      if (!figure) return;
      figure.hidden = false;
      box.innerHTML = '';
      box.removeAttribute('aria-hidden');

      var img = document.createElement('img');
      img.src = target.asset;
      img.alt = target.cap + ' QR code';
      img.width = 88;
      img.height = 88;

      if (/^https?:\/\//.test(target.url)) {
        var link = document.createElement('a');
        link.href = target.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.setAttribute('aria-label', target.cap);
        link.appendChild(img);
        box.appendChild(link);
      } else {
        box.appendChild(img);
      }
    });
  }

  /* Fixed landscape PNG with wrapped fields; independent of phone screen size. */
  function loadImage(src) {
    return new Promise(function(resolve) {
      var image = new Image();
      image.onload = function(){ resolve(image); };
      image.onerror = function(){ resolve(null); };
      image.src = src;
    });
  }
  async function drawBoardingPassCanvas() {
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('400 39px Graduate'),
        document.fonts.load('700 16px "Roboto Mono"'),
        document.fonts.load('700 16px "Roboto Slab"')
      ]).catch(function () { /* system fallbacks are still valid */ });
    }

    var loaded = await Promise.all([
      loadImage('assets/boarding-background.png'),
      loadImage('assets/boarding-arrow.png'),
      loadImage('assets/boarding-barcode.png'),
      loadImage('assets/church-qr.png'),
      loadImage('assets/reception-qr.png')
    ]);
    var passBg = loaded[0], arrow = loaded[1], barcode = loaded[2];
    var churchQr = loaded[3], receptionQr = loaded[4];

    // Exact corrected reference canvas: 1414 × 680, with a 1314 × 621 pass card.
    var width = 1414, height = 680;
    var cardX = 50, cardY = 29, cardW = 1314, cardH = 621;
    var headerH = 161, bodyY = cardY + headerH, bodyH = cardH - headerH;
    var mainW = 877, stubX = cardX + mainW, stubW = cardW - mainW;
    var canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable in this browser');
    ctx.scale(2, 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    function text(value, x, y, size, font, color, weight, align) {
      ctx.fillStyle = color || '#0751ad';
      ctx.font = (weight || '400') + ' ' + size + 'px ' + font;
      ctx.textAlign = align || 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(String(value || ''), x, y);
    }
    function spaced(value, x, y, size, font, color, weight, tracking, align) {
      var str = String(value || '');
      ctx.font = (weight || '400') + ' ' + size + 'px ' + font;
      ctx.textBaseline = 'top';
      ctx.fillStyle = color || '#0751ad';
      var widths = Array.prototype.map.call(str, function (ch) { return ctx.measureText(ch).width; });
      var total = widths.reduce(function (sum, w) { return sum + w; }, 0) + Math.max(0, str.length - 1) * (tracking || 0);
      var startX = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
      ctx.textAlign = 'left';
      Array.prototype.forEach.call(str, function (ch, i) {
        ctx.fillText(ch, startX, y);
        startX += widths[i] + (tracking || 0);
      });
    }
    function wrap(value, x, y, maxWidth, size, font, color, weight, lineHeight) {
      ctx.font = (weight || '400') + ' ' + size + 'px ' + font;
      var words = String(value || '').split(/\s+/), lines = [], line = '';
      words.forEach(function (word) {
        while (ctx.measureText(word).width > maxWidth && word.length > 1) {
          var n = word.length - 1;
          while (n > 1 && ctx.measureText(word.slice(0, n)).width > maxWidth) n--;
          if (line) { lines.push(line); line = ''; }
          lines.push(word.slice(0, n));
          word = word.slice(n);
        }
        var candidate = line ? line + ' ' + word : word;
        if (ctx.measureText(candidate).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      });
      if (line) lines.push(line);
      lines.forEach(function (lineText, i) {
        text(lineText, x, y + i * lineHeight, size, font, color, weight);
      });
      return y + lines.length * lineHeight;
    }

    // Reference border and header.
    ctx.strokeStyle = '#272727';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.strokeRect(cardX, cardY, cardW, cardH);
    ctx.setLineDash([]);
    ctx.fillStyle = '#0751ad';
    ctx.fillRect(cardX, cardY, cardW, headerH);
    spaced('BOARDING PASS', cardX + 59, cardY + 50, 55, '"Graduate"', '#ffffff', '400', 1.1);
    if (arrow) {
      ctx.save();
      ctx.globalAlpha = .98;
      // Match the CSS object-fit: cover strip: keep the supplied chevrons
      // proportional and crop only the transparent top/bottom margins.
      var arrowW = 614, arrowH = headerH;
      var arrowSourceH = arrow.width / (arrowW / arrowH);
      var arrowSourceY = Math.max(0, (arrow.height - arrowSourceH) / 2);
      ctx.drawImage(arrow, 0, arrowSourceY, arrow.width, arrowSourceH, cardX + 700, cardY, arrowW, arrowH);
      ctx.restore();
    }

    // Aqua map panel and white passenger stub.
    ctx.fillStyle = '#c3e8ed';
    ctx.fillRect(cardX, bodyY, mainW, bodyH);
    if (passBg) {
      ctx.save();
      ctx.globalAlpha = .62;
      ctx.drawImage(passBg, cardX, bodyY, mainW, bodyH);
      ctx.restore();
    }
    ctx.fillStyle = '#fffefa';
    ctx.fillRect(stubX, bodyY, stubW, bodyH);
    if (passBg) {
      ctx.save();
      ctx.globalAlpha = .08;
      ctx.drawImage(passBg, stubX, bodyY, stubW, bodyH);
      ctx.restore();
    }
    ctx.strokeStyle = '#272727';
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(stubX, bodyY);
    ctx.lineTo(stubX, bodyY + bodyH);
    ctx.stroke();
    ctx.setLineDash([]);

    var fx = cardX + 48, mainTextWidth = 680;
    var labelFont = '"Roboto Mono"', valueFont = '"Roboto Mono"';
    function label(value, y) { spaced(value, fx, y, 21, labelFont, '#111111', '700', .3); }
    function value(value, y, size) { wrap(normalizeName(value), fx, y, mainTextWidth, size || 28, valueFont, '#0751ad', '700', (size || 28) + 5); }

    label('DEDICATION DAY OF:', bodyY + 18);
    value(CONFIG.childFull, bodyY + 63, 28);
    label('DESTINATION:', bodyY + 119);
    value(String(CONFIG.church || '').replace(/\s*\([^)]*\)/g, ''), bodyY + 160, 27);
    value(String(CONFIG.reception || '').replace(/,/g, ''), bodyY + 220, 27);
    label('DATE:', bodyY + 275);
    value(CONFIG.dateBoarding || CONFIG.dateLong, bodyY + 319, 28);
    label('TIME:', bodyY + 376);
    value(CONFIG.time + ' AT CHURCH', bodyY + 418, 28);

    // Exact QR pair and vertical barcode placement from the supplied reference.
    var qrY = bodyY + 327;
    [[churchQr, cardX + 553, 85, 85, 'CHURCH'], [receptionQr, cardX + 647, 86, 85, 'RECEPTION']].forEach(function (item) {
      if (!item[0]) return;
      text(item[4], item[1] + item[2] / 2, qrY - 25, 11, '"Roboto Mono"', '#0751ad', '700', 'center');
      ctx.drawImage(item[0], item[1], qrY, item[2], item[3]);
    });
    spaced('SCAN US FOR MAP', cardX + 643, qrY + 85 + 14, 11, '"Roboto Mono"', '#0751ad', '700', .4, 'center');

    var barX = cardX + 750, barY = bodyY + 25, barW = 96, barH = 413;
    if (barcode) ctx.drawImage(barcode, barX, barY, barW, barH);
    ctx.save();
    ctx.translate(barX + barW - 1, bodyY + 290);
    ctx.rotate(-Math.PI / 2);
    text('0 35545 62336 78 1', 0, 0, 11, 'Arial', '#252525', '400');
    ctx.restore();

    // Stub verse and the gold passenger card with GATE 2 / SEAT B3.
    wrap('MATTHEW 19:14 — “LET THE LITTLE CHILDREN COME TO ME, AND DO NOT HINDER THEM, FOR THE KINGDOM OF HEAVEN BELONGS TO SUCH AS THESE.”', stubX + 42, bodyY + 21, stubW - 78, 16, '"Roboto Slab"', '#111111', '700', 23);
    var ticketX = stubX + 31, ticketY = bodyY + 133, ticketW = 376, ticketH = 299;
    ctx.fillStyle = '#fffefa';
    ctx.fillRect(ticketX, ticketY, ticketW, ticketH);
    ctx.strokeStyle = '#dcae13';
    ctx.lineWidth = 8;
    ctx.strokeRect(ticketX, ticketY, ticketW, ticketH);
    ctx.lineWidth = 1;
    text('PASSENGER:', ticketX + 39, ticketY + 31, 16, 'Arial', '#101010', '700');
    wrap(activeGuestName, ticketX + 74, ticketY + 63, ticketW - 112, 16, '"Roboto Mono"', '#0751ad', '700', 20);

    var gateX = ticketX + 31, gateY = ticketY + 98, gateW = 316, gateH = 164;
    ctx.fillStyle = '#0751ad';
    ctx.fillRect(gateX, gateY, gateW, gateH);
    spaced('GATE ' + (CONFIG.gate || '2'), gateX + gateW / 2, gateY + 22, 57, '"Stardos Stencil"', '#ffffff', '700', .7, 'center');
    spaced('SEAT ' + (CONFIG.seat || 'B3'), gateX + gateW / 2, gateY + 101, 30, '"Courier New"', '#ffffff', '400', .8, 'center');

    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve, reject) {
      var finished = false;
      function done(blob) {
        if (finished) return;
        finished = true;
        if (blob) resolve(blob); else reject(new Error('PNG export returned no data'));
      }
      function fallback() {
        try {
          var data = canvas.toDataURL('image/png');
          var binary = atob(data.split(',')[1]);
          var bytes = new Uint8Array(binary.length);
          for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          done(new Blob([bytes], { type: 'image/png' }));
        } catch (e) { if (!finished) { finished = true; reject(e); } }
      }
      if (typeof canvas.toBlob !== 'function') { fallback(); return; }
      var timer = window.setTimeout(function () { if (!finished) fallback(); }, 5000);
      try {
        canvas.toBlob(function (blob) {
          window.clearTimeout(timer);
          done(blob);
        }, 'image/png');
      } catch (e) {
        window.clearTimeout(timer);
        fallback();
      }
    });
  }

  $('downloadPass').addEventListener('click', async function(){
    var button=$('downloadPass');button.disabled=true;
    try{
      var canvas=await drawBoardingPassCanvas();
      var blob=await canvasToBlob(canvas);
      var filename=(isPreview?'PREVIEW-':'')+'MateoGray-BoardingPass-'+activeGuestName.replace(/[^A-Z0-9]+/g,'_').slice(0,60)+'.png';
      var a=document.createElement('a');
      a.download=filename;
      if (window.URL && typeof URL.createObjectURL === 'function') {
        var url=URL.createObjectURL(blob);
        a.href=url;
        setTimeout(function(){URL.revokeObjectURL(url);},30000);
      } else {
        var reader = new FileReader();
        reader.onload = function () { a.href = reader.result; document.body.appendChild(a); a.click(); a.remove(); };
        reader.readAsDataURL(blob);
        toast('Boarding pass image ready.');
        return;
      }
      document.body.appendChild(a);a.click();a.remove();
      toast('Boarding pass image ready.');
    }catch(e){
      if (window.console && console.error) console.error('Boarding pass export failed', e);
      toast('Could not create the image. Please open the site through GitHub Pages or Live Server and try again.');
    }
    finally{button.disabled=false;}
  });

  applyConfig();
})();
