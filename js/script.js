/* ============================================================
   Mateo Gray Dedication — Passport Invitation
   ------------------------------------------------------------
   CONFIG lives at the top of this file. All event details,
   backend URL, and map links are edited there.
   ============================================================ */
(function () {
  'use strict';

  var CONFIG = window.MATEO_CONFIG;

  /* Preview mode = honest, labelled, non-saving fallback. Off (i.e. real saving) whenever there  */
  /*   is a working save target: an Apps Script web app OR a direct Google Form POST (hidden      */
  /*   iframe — Apps Script-free, no CORS).                                                      */
  var hasAppsScript = typeof CONFIG.scriptUrl === 'string' &&
    /script\.google\.com\/macros\/s\//.test(CONFIG.scriptUrl);
  var hasDirectForm = (typeof CONFIG.formResponse === 'string' &&
    /docs\.google\.com\/forms/.test(CONFIG.formResponse)) &&
    typeof CONFIG.fbzx === 'string' && CONFIG.fbzx.length > 0 &&
    typeof CONFIG.formEntries === 'object' && CONFIG.formEntries;
  var isPreview = !(hasAppsScript || hasDirectForm);

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supports3d = (function () {
    try { return CSS.supports('transform-style', 'preserve-3d'); } catch (e) { return false; }
  })();
  if (!supports3d || prefersReduced) document.body.classList.add('no3d');

  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var activeGuestName = '';
  var activeTicket = '';
  var activeParty = '';
  var lastPayload = null;
  var pendingPayload = null;
  var requestId = '';
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
    if (!CONFIG.gate && !CONFIG.seat) {
      var optGrid = $('bpOptionalGrid');
      if (optGrid && optGrid.parentNode) optGrid.parentNode.removeChild(optGrid);
    }

    var note = $('integrationNote');
    note.textContent = isPreview ? 'Preview only — responses are not saved here yet. To send your RSVP now, use the Google Form below.' : 'Your response will be saved to the organizer’s guest list.';
    note.className = isPreview ? 'form-note warn' : 'form-note';
    var gl = $('googleFormLink'); if (gl) gl.href = CONFIG.formUrl;
    $('rsvpSubmit').querySelector('.btn-label').textContent = isPreview ? 'Preview My Response' : 'Send Confirmation';
    $('rsvpTrigger').innerHTML = (isPreview ? 'RSVP / Preview Invitation' : 'Confirm Attendance') + ' <span aria-hidden="true">→</span>';
    $('viewPass').hidden = true;
    $('passPreview').hidden = !isPreview;
    if (isPreview) {
      $('bpTitle').querySelector('.bp-heading-line1').textContent = 'Your boarding pass preview';
      $('bpTitle').querySelector('.bp-heading-line2').textContent = 'Here’s how your personalized invitation will look.';
    }

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

    // Stage the motion: orient the closed passport, complete the cover flip while
    // the inside stays hidden, then reveal the inside pages together. This
    // prevents the cover and inside from ever appearing in the same reveal beat.
    openTimer = window.setTimeout(function () {
      if (!opening) return;
      document.body.classList.remove('passport-orienting');
      document.body.classList.add('passport-flipping');
      openTimer = window.setTimeout(function () {
        if (!opening) return;
        opening = false;
        openTimer = null;
        document.body.classList.remove('passport-flipping');
        document.body.classList.add('open');
        _mrzCall();
        passport.dataset.state = 'open';
        cover.removeAttribute('aria-busy');
        $('heroActions').hidden = false;
        $('spread').inert = false;
        nav.hidden = false;
        $('spread').setAttribute('aria-hidden', 'false');
        $('hero').setAttribute('aria-label', 'Open passport invitation');
        Sounds.paper();
        window.setTimeout(function () {
          var t = $('rsvpTrigger');
          if (t && opened && !anyModalOpen()) t.focus({ preventScroll: true });
        }, 760);
      }, prefersReduced ? 0 : 1050);
    }, prefersReduced ? 0 : 820);
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
    $('openingHint').hidden = false;
    nav.hidden = true;
    $('spread').inert = true;
    document.body.classList.remove('open','passport-orienting','passport-flipping');
    _mrzCall();
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
    return ['rsvpModal', 'thanksModal', 'bpModal'].some(function (id) { return $(id).hidden === false; });
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
      if (!$('bpModal').hidden) hideModal('bpModal', $('rsvpTrigger'));
      else if (!$('rsvpModal').hidden) hideModal('rsvpModal', $('rsvpTrigger'));
      else hideModal('thanksModal', $('rsvpTrigger'));
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
      var target = btn.getAttribute('data-close');
      if (target === 'rsvp') hideModal('rsvpModal', $('rsvpTrigger'));
      else if (target === 'thanks') hideModal('thanksModal', $('rsvpTrigger'));
      else if (target === 'bp') hideModal('bpModal', $('rsvpTrigger'));
    });
  });

  $('thanksViewInvite').addEventListener('click', function () {
    hideModal('thanksModal');
    if (!opened) openPassport(true);
  });
  $('bpViewInvite').addEventListener('click', function () {
    hideModal('bpModal');
    if (!opened) openPassport(true);
  });

  /* ==========================================================
     RSVP modal
     ========================================================== */
  var rsvpForm = $('rsvpForm');
  var rsvpStatus = $('rsvpStatus');
  var rsvpSubmit = $('rsvpSubmit');
  var guestCountField = $('rsvpGuests');
  var companionsField = $('rsvpCompanions');

  $('rsvpTrigger').addEventListener('click', function () { showModal('rsvpModal'); });

  function setStatus(msg, kind) {
    rsvpStatus.textContent = msg;
    rsvpStatus.className = 'form-status' + (kind ? ' ' + kind : '');
  }
  function setSubmitting(submitting) {
    rsvpSubmit.disabled = submitting;
    rsvpForm.setAttribute('aria-busy', String(submitting));
    Array.from(rsvpForm.elements).forEach(function(el){ if (el !== rsvpSubmit) el.disabled = submitting; });
    if (!submitting) {
      var radio = rsvpForm.querySelector('input[name=attend]:checked');
      setDeclined(radio && radio.value.indexOf('cannot') !== -1);
    }
    rsvpSubmit.classList.toggle('sending', submitting);
  }

  /* "Cannot attend" → guest-count and companions no longer apply. */
  function setDeclined(declined) {
    guestCountField.closest('.field').classList.toggle('disabled', declined);
    companionsField.closest('.field').classList.toggle('disabled', declined);
    guestCountField.disabled = declined;
    companionsField.disabled = declined;
    if (declined) {
      // Retain the draft when switching attendance options.
    }
  }
  $$('input[name="attend"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      setDeclined(radio.value.indexOf('cannot') !== -1);
    });
  });

  function guestPayload() {
    var name = $('rsvpName').value.trim();
    var phone = $('rsvpPhone').value.trim();
    var checked = rsvpForm.querySelector('input[name="attend"]:checked');
    var declined = checked && checked.value.indexOf('cannot') !== -1;
    var guestCount = declined ? '' : $('rsvpGuests').value;
    var companions = declined ? '' : $('rsvpCompanions').value.trim();

    if (!name) { setStatus('Please enter your full name.', 'error'); $('rsvpName').focus(); return null; }
    if (!checked) { setStatus('Please choose whether you will attend.', 'error'); return null; }
    if (!declined && !guestCount) {
      setStatus('Please tell us how many guests are coming with you.', 'error');
      $('rsvpGuests').focus();
      return null;
    }
    return {
      name: name,
      phone: phone,
      attend: checked.value,
      guestCount: guestCount || (declined ? '0' : 'Just me'),
      companions: companions
    };
  }

  rsvpForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (rsvpSubmit.disabled) return;
    var payload = guestPayload();
    if (!payload) return;
    var signature = JSON.stringify(payload);
    if (signature !== pendingPayload) { pendingPayload = signature; requestId = newRequestId(); }
    payload.requestId = requestId;
    setSubmitting(true);
    setStatus(isPreview ? 'Simulating a successful response\u2026 (preview)' : 'Sending your confirmation\u2026', 'sending');
    saveRsvp(payload);
  });

  function rsvpSucceeded(payload, ticket) {
    setSubmitting(false);
    setStatus('', '');
    activeTicket = (isPreview ? 'PREVIEW-' : 'MG-') + (ticket || payload.requestId).slice(0, 12).toUpperCase();
    activeParty = partyText(payload.guestCount);
    lastPayload = payload;
    pendingPayload = null;
    requestId = '';
    rsvpForm.reset();
    setDeclined(false);

    var declined = payload.attend.indexOf('cannot') !== -1;
    if (declined) {
      $('thanksName').textContent = payload.name;
      $('viewPass').hidden = true;
      $('thanksPreview').textContent = isPreview ? 'Preview only — this response has not been saved. Please use the Google Form to send your RSVP.' : 'Your response has been saved. Thank you for letting us know.';
      hideModal('rsvpModal');
      showModal('thanksModal');
      Sounds.chime(false);
      return;
    }

    $('viewPass').hidden = false;
    buildBoardingPass(payload.name);
    hideModal('rsvpModal');
    showModal('bpModal');
    var scroll = $('bpScroll');
    if (scroll) scroll.scrollLeft = 0;
    Sounds.chime(true);
    $('boardingPass').classList.remove('reveal');
    window.setTimeout(function () {
      if ($('bpModal').hidden) return;
      var sr = $('stampReveal');
      if (!isPreview && !prefersReduced) sr.classList.add('show');
      Sounds.stamp();
      $('boardingPass').classList.add('reveal');
      window.setTimeout(function () { sr.classList.remove('show'); }, 1900);
    }, 500);

    toast(isPreview ? 'Preview only \u2014 your RSVP has not been saved.' : 'Thank you! RSVP saved.');
  }

  function submitFailed(msg) {
    setSubmitting(false);
    setStatus(msg, 'error');
    /* entered values are intentionally preserved on failure */
  }

  function saveRsvp(payload) {
    if (isPreview) { rsvpSucceeded(payload); return; }
    if (hasAppsScript) {
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 20000);
      fetch(CONFIG.scriptUrl, { method: 'POST', body: JSON.stringify(payload), signal: controller.signal, redirect: 'follow' })
        .then(function (res) { if (!res.ok) throw new Error('Server response'); return res.json(); })
        .then(function (data) {
          if (data && data.success === true && typeof data.ticket === 'string') rsvpSucceeded(payload, data.ticket);
          else submitFailed('We could not save your response. Please check your details and try again.');
        })
        .catch(function () {
          submitFailed('We could not verify that your response was saved. Check your connection and retry; the same request reference will prevent duplicate entries.');
        })
        .finally(function () { clearTimeout(timeout); });
      return;
    }
    postToGoogleForm(payload);
  }

  /* Apps Script-free direct Google Form POST. A hidden named iframe is the submit          */
  /*   target, so the browser POSTs the form cross-origin with zero CORS preflight and we   */
  /*   never need to read the (cross-origin) reply — arrival of the load event = delivered. */
  function postToGoogleForm(payload) {
    var frameName = 'mateoRsvpFrame';
    var existing = document.getElementById(frameName);
    if (existing) existing.parentNode.removeChild(existing);

    var iframe = document.createElement('iframe');
    iframe.id = frameName;
    iframe.name = frameName;
    iframe.style.cssText = 'position:absolute;visibility:hidden;width:0;height:0;border:0;';
    document.body.appendChild(iframe);

    var form = document.createElement('form');
    form.method = 'POST';
    form.action = CONFIG.formResponse;
    form.target = frameName;
    form.style.display = 'none';

    function addField(name, value) {
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = (value === undefined || value === null) ? '' : String(value);
      form.appendChild(input);
    }

    addField('fbzx', CONFIG.fbzx);
    addField('fvv', 1);
    addField('pageHistory', 0);
    addField('draftResponse', '[]');

    var e = CONFIG.formEntries;
    addField(e.name, payload.name);
    addField(e.phone, payload.phone);
    addField(e.attend, payload.attend);
    addField(e.guests, payload.guestCount);
    addField(e.companions, payload.companions);

    var done = false;
    var timer = setTimeout(function () {
      if (done) return; done = true;
      finishFormPost();
    }, 15000);

    function finishFormPost() {
      clearTimeout(timer);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      if (form.parentNode) form.parentNode.removeChild(form);
      rsvpSucceeded(payload);
    }

    iframe.addEventListener('load', function () {
      if (done) return; done = true;
      finishFormPost();
    }, false);

    document.body.appendChild(form);
    form.submit();
  }

  $('viewPass').addEventListener('click', function () {
    if (!lastPayload || lastPayload.attend.indexOf('cannot') !== -1) return;
    buildBoardingPass(lastPayload.name);
    $('boardingPass').classList.add('reveal');
    showModal('bpModal');
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
    activeGuestName = normalizeName(guestName);
    $('bpPassenger').textContent = activeGuestName;
    $('bpMrz').textContent = buildMrz();
    $('bpParty').textContent = activeParty;
    $('bpFootnote').innerHTML = isPreview
      ? 'This is a <span class="preview-tag">PREVIEW</span> pass \u2014 the RSVP service is not connected, so your response has not been saved.'
      : 'Celebrating Mateo Gray D. Delos Santos \u00b7 ' + CONFIG.dateLong;
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

  function justifyMRZ(){
    var strip=document.querySelector('.kidstrip-mrz');
    if(!strip||!('createTreeWalker' in document)){return;}
    var walker=document.createTreeWalker(strip,NodeFilter.SHOW_TEXT);
    var t1=walker.nextNode(),t2=walker.nextNode();
    if(!t1||!t2){return;}
    var cs=getComputedStyle(strip);
    var inner=strip.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
    if(!(inner>0)){return;}
    var prev=strip.style.letterSpacing;
    strip.style.letterSpacing='normal';
    function spread(node){
      var len=(node.textContent||'').length;
      if(len<2){return 0;}
      var r=document.createRange();r.selectNodeContents(node);
      var w=r.getBoundingClientRect().width;
      if(!(w>0)||w>=inner){return 0;}
      return (inner-w)/(len-1);
    }
    var s=Math.max(spread(t1),spread(t2));
    strip.style.letterSpacing=s>0?(Math.round(s*1000)/1000)+'px':prev;
  }
  function _mrzCall(ev){justifyMRZ();}
  window.justifyMRZ=justifyMRZ;
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',_mrzCall);}
  else{_mrzCall();}
  window.addEventListener('load',_mrzCall);
  window.addEventListener('resize',_mrzCall);

  applyConfig();
})();
