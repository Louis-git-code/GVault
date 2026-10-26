// GVault — homepage interactions
// This file runs after the HTML has been parsed (see the defer attribute).

(function () {
  var WHATSAPP_NUMBER = '2347069758371';
  var storageKey = 'gvaultRequest';

  var vault = document.getElementById('vault');
  var form = document.getElementById('source-enquiry');
  var modelInput = document.getElementById('enquiry-model');
  var statusEl = document.getElementById('enquiry-status');
  var fallback = document.getElementById('enquiry-fallback');
  var fallbackLink = document.getElementById('enquiry-fallback-link');
  var fallbackCopy = document.getElementById('enquiry-fallback-copy');

  function elementFromEvent(event) {
    var origin = event.target;
    // Some browsers report a text node as the click target.
    if (origin && origin.nodeType !== 1) {
      origin = origin.parentElement;
    }
    return origin;
  }

  function remember(name) {
    try {
      sessionStorage.setItem(storageKey, name);
    } catch (err) {
      // Private mode may block sessionStorage.
    }
  }

  function forget() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (err) {
      // Ignore storage errors.
    }
  }

  function rememberedName() {
    try {
      return sessionStorage.getItem(storageKey) || '';
    } catch (err) {
      return '';
    }
  }

  function nameFromLink(link) {
    if (!link || !vault || !vault.contains(link)) {
      return '';
    }
    var card = link.closest('.exhibit');
    var heading = card ? card.querySelector('h3') : null;
    return heading ? heading.textContent.trim() : '';
  }

  function showPrefillNote(visible) {
    var note = document.getElementById('enquiry-prefill');
    if (!note) {
      return;
    }
    if (visible) {
      note.removeAttribute('hidden');
    } else {
      note.setAttribute('hidden', '');
    }
  }

  function fillModel(name) {
    if (!modelInput || !name) {
      return;
    }
    modelInput.value = name;
    modelInput.setAttribute('aria-invalid', 'false');
    showPrefillNote(true);
  }

  function fieldValue(id) {
    var field = document.getElementById(id);
    return field ? field.value.trim() : '';
  }

  function setInvalid(id, isInvalid) {
    var field = document.getElementById(id);
    if (!field) {
      return;
    }
    field.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');
  }

  function showStatus(message) {
    if (!statusEl) {
      return;
    }
    statusEl.hidden = false;
    statusEl.textContent = message;
  }

  function hideStatus() {
    if (!statusEl) {
      return;
    }
    statusEl.hidden = true;
    statusEl.textContent = '';
  }

  function showFallback(url, message) {
    if (!fallback || !fallbackLink || !fallbackCopy) {
      return;
    }
    fallback.hidden = false;
    fallbackLink.setAttribute('href', url);
    fallbackCopy.value = message;
  }

  function hideFallback() {
    if (!fallback) {
      return;
    }
    fallback.hidden = true;
  }

  // Build the WhatsApp draft from filled fields only — skip empty optionals.
  function buildEnquiryMessage() {
    var name = fieldValue('enquiry-name');
    var model = fieldValue('enquiry-model');
    var size = fieldValue('enquiry-size');
    var sizeSystem = fieldValue('enquiry-size-system') || 'UK';
    var colourway = fieldValue('enquiry-colourway');
    var budget = fieldValue('enquiry-budget');
    var notes = fieldValue('enquiry-notes');
    var lines = [];

    lines.push("Hello GVault, I'd like to enquire about sourcing a sneaker.");
    lines.push('');

    if (name) {
      lines.push('Name: ' + name);
    }

    lines.push('Model: ' + model);
    lines.push('Size: ' + size + ' (' + sizeSystem + ')');

    if (colourway) {
      lines.push('Preferred colourway: ' + colourway);
    }

    if (budget) {
      lines.push('Budget: NGN ' + budget);
    }

    if (notes) {
      lines.push('Additional requirements: ' + notes);
    }

    lines.push('');
    lines.push('Please research sourcing options and confirm the total price, expected delivery window, and available payment terms before I commit.');
    lines.push('');
    lines.push('Submitting this message is an enquiry only, not a confirmed order.');

    return lines.join('\n');
  }

  function firstInvalidRequired() {
    var requiredIds = ['enquiry-model', 'enquiry-size', 'enquiry-size-system'];
    var i;
    var id;
    var value;

    for (i = 0; i < requiredIds.length; i += 1) {
      id = requiredIds[i];
      value = fieldValue(id);
      setInvalid(id, !value);
      if (!value) {
        return document.getElementById(id);
      }
    }

    return null;
  }

  function whatsappUrl(message) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  }

  // ----- Vault cards: fill the model, then follow #source-a-pair -----
  if (vault) {
    vault.addEventListener('click', function (event) {
      var origin = elementFromEvent(event);
      if (!origin || typeof origin.closest !== 'function') {
        return;
      }

      var link = origin.closest('.exhibit-action');
      var name = nameFromLink(link);

      if (!name) {
        return;
      }

      remember(name);
      fillModel(name);
    });
  }

  // Restore a model after a Vault card request (homepage or vault.html).
  if (modelInput) {
    var landingHash = window.location.hash;
    if (landingHash === '#source-enquiry' || landingHash === '#source-a-pair') {
      fillModel(rememberedName());
    }

    modelInput.addEventListener('input', function () {
      if (!modelInput.value.trim()) {
        showPrefillNote(false);
      }
    });
  }

  // Start a sourcing enquiry is an in-page jump to the form.
  // A Vault-selected model is kept unless the visitor edits or clears it.

  // ----- Form: validate, then open a WhatsApp draft -----
  if (form) {
    form.addEventListener('submit', function (event) {
      var invalid;
      var message;
      var url;
      var opened;

      event.preventDefault();
      hideFallback();
      hideStatus();

      invalid = firstInvalidRequired();
      if (invalid) {
        showStatus('Please add the sneaker model and shoe size before sending your enquiry. No payment is required.');
        invalid.focus();
        return;
      }

      message = buildEnquiryMessage();
      url = whatsappUrl(message);

      try {
        opened = window.open(url, '_blank', 'noopener');
      } catch (err) {
        opened = null;
      }

      if (!opened) {
        showFallback(url, message);
        showStatus('WhatsApp did not open automatically. Use the fallback link or copy the message below. Nothing has been sent yet.');
        if (fallbackLink) {
          fallbackLink.focus();
        }
        return;
      }

      showStatus('WhatsApp should open with your enquiry. Review the draft and send it when you are ready. This is an enquiry only — not a confirmed order, and no payment has been taken.');
    });
  }

  // Mobile menu only: close after a nav destination is chosen, or on Escape.
  // Does not touch sourcing, sessionStorage, or the enquiry form.
  var navToggle = document.getElementById('nav-toggle');
  var headerNav = document.querySelector('header nav');
  var navToggleBtn = document.querySelector('.nav-toggle-btn');

  function setNavOpen(open) {
    if (!navToggle) {
      return;
    }
    navToggle.checked = open;
    if (navToggleBtn) {
      navToggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  }

  if (navToggle && headerNav) {
    navToggle.addEventListener('change', function () {
      setNavOpen(navToggle.checked);
    });
    headerNav.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        setNavOpen(false);
      }
    });
    window.addEventListener('hashchange', function () {
      setNavOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        setNavOpen(false);
      }
    });
  }
})();
