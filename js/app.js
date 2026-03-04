/**
 * Main application controller.
 * Wires the periodic table, atom viewer, behaviour panel,
 * info panel, isotope controls, and reaction mode together.
 *
 * States: 'normal' → 'picking' → 'reacting'
 */

(function () {
  let currentElement = null;
  let currentIsotopeIdx = 0;
  let behaviourOpen = true;
  let appState = 'normal'; // 'normal' | 'picking' | 'reacting'

  function start() {
    PeriodicTable.init(onElementSelected);
    AtomViewer.init();

    // Select hydrogen by default
    onElementSelected(1);

    // Viewer controls
    document.getElementById('speed-slider').addEventListener('input', e => {
      AtomViewer.setSpeed(parseFloat(e.target.value));
    });
    document.getElementById('zoom-slider').addEventListener('input', e => {
      AtomViewer.setZoom(parseFloat(e.target.value));
    });
    document.getElementById('toggle-labels').addEventListener('click', e => {
      const on = AtomViewer.toggleLabels();
      e.target.classList.toggle('active', on);
    });
    document.getElementById('toggle-nucleus-detail').addEventListener('click', e => {
      const on = AtomViewer.toggleNucleusDetail();
      e.target.classList.toggle('active', on);
    });

    // Isotope slider
    document.getElementById('isotope-slider').addEventListener('input', e => {
      currentIsotopeIdx = parseInt(e.target.value);
      AtomViewer.setIsotope(currentIsotopeIdx);
      updateIsotopeInfo();
      updateChargeBar();
    });

    // Ion mode toggle
    document.getElementById('ion-mode-btn').addEventListener('click', e => {
      if (!currentElement || appState !== 'normal') return;
      const charge = Behaviour.getLikelyIonCharge(currentElement);
      const isOn = AtomViewer.getIonMode();

      if (charge === 0) return;

      AtomViewer.setIonMode(!isOn, charge);
      e.target.classList.toggle('active', !isOn);
      updateChargeBar();
      updateIonModeHint();
    });

    // React With... button
    document.getElementById('react-btn').addEventListener('click', () => {
      if (!currentElement || appState !== 'normal') return;
      enterPickMode();
    });

    // Pick cancel
    document.getElementById('pick-cancel-btn').addEventListener('click', () => {
      exitPickMode();
    });

    // Exit reaction
    document.getElementById('exit-reaction-btn').addEventListener('click', () => {
      exitReactionMode();
    });

    // Behaviour panel toggle
    document.getElementById('behaviour-toggle').addEventListener('click', () => {
      behaviourOpen = !behaviourOpen;
      document.getElementById('behaviour-cards').classList.toggle('open', behaviourOpen);
      document.getElementById('behaviour-arrow').classList.toggle('open', behaviourOpen);
    });

    // Keyboard navigation
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'Escape') {
        if (appState === 'picking') { exitPickMode(); return; }
        if (appState === 'reacting') { exitReactionMode(); return; }
      }
      if (appState !== 'normal') return;
      if (!currentElement) return;

      let nextNum = currentElement.number;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextNum = Math.min(118, nextNum + 1);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextNum = Math.max(1, nextNum - 1);
        e.preventDefault();
      }
      if (nextNum !== currentElement.number) {
        PeriodicTable.selectElement(nextNum);
      }
    });

    // Start behaviour panel open
    document.getElementById('behaviour-cards').classList.add('open');
    document.getElementById('behaviour-arrow').classList.add('open');
  }

  // ---- State transitions ----

  function enterPickMode() {
    if (!currentElement) return;
    const check = Reaction.canReactAtAll(currentElement);
    if (!check.ok) return;

    appState = 'picking';

    // Disable ion mode
    AtomViewer.setIonMode(false, 0);
    document.getElementById('ion-mode-btn').classList.remove('active');
    document.getElementById('ion-mode-btn').disabled = true;
    document.getElementById('react-btn').classList.add('active');

    // Show pick banner
    const banner = document.getElementById('pick-banner');
    banner.hidden = false;
    document.getElementById('pick-banner-text').textContent =
      `Click an element to react with ${currentElement.symbol}`;

    // Set pick mode on table
    const filter = Reaction.makePickFilter(currentElement);
    PeriodicTable.setPickMode(true, filter, onPartnerPicked);
  }

  function exitPickMode() {
    appState = 'normal';

    document.getElementById('pick-banner').hidden = true;
    document.getElementById('react-btn').classList.remove('active');

    PeriodicTable.setPickMode(false);
    updateIonModeHint(); // re-enable ion button if applicable
    updateReactHint();
  }

  function onPartnerPicked(atomicNumber) {
    const partner = getElementById(atomicNumber);
    if (!partner || !currentElement) return;

    const check = Reaction.canReact(currentElement, partner);
    if (!check.ok) return;

    // Exit pick mode visuals
    document.getElementById('pick-banner').hidden = true;
    PeriodicTable.setPickMode(false);

    // Enter reaction mode
    appState = 'reacting';
    const data = Reaction.getReactionData(currentElement, partner);

    // Show reaction on canvas
    AtomViewer.setReaction(data.elA, data.elB, data);

    // Show reaction panel, hide behaviour panel
    document.getElementById('behaviour-panel').hidden = true;
    document.getElementById('reaction-panel').hidden = false;
    document.getElementById('react-btn').classList.add('active');

    // Fill equation
    document.getElementById('reaction-equation').innerHTML =
      `<span class="eq-el">${data.elA.symbol}</span> + ` +
      `<span class="eq-el">${data.elB.symbol}</span> → ` +
      `<span class="eq-formula">${data.formula}</span>` +
      `<span class="eq-type">${data.bondType} bond</span>`;

    // Fill insight cards
    const insights = Reaction.getReactionInsights(data);
    const container = document.getElementById('reaction-cards');
    container.innerHTML = '';
    insights.forEach(insight => {
      const card = document.createElement('div');
      card.className = 'insight-card';
      card.setAttribute('data-topic', insight.topic);
      card.innerHTML = `
        <div class="insight-icon">${insight.icon}</div>
        <div class="insight-content">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-text">${insight.text}</div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function exitReactionMode() {
    appState = 'normal';

    AtomViewer.clearReaction();
    document.getElementById('reaction-panel').hidden = true;
    document.getElementById('behaviour-panel').hidden = false;
    document.getElementById('react-btn').classList.remove('active');

    // Restore single atom view
    if (currentElement) {
      AtomViewer.setElement(currentElement, currentIsotopeIdx);
    }
    updateIonModeHint();
    updateReactHint();
  }

  // ---- Normal mode handlers ----

  function onElementSelected(atomicNumber) {
    // If in reaction mode, exit first
    if (appState === 'reacting') {
      exitReactionMode();
    }
    if (appState === 'picking') {
      exitPickMode();
    }

    currentElement = getElementById(atomicNumber);
    if (!currentElement) return;

    currentIsotopeIdx = 0;
    AtomViewer.setElement(currentElement, 0);
    updateInfoPanel();
    updateIsotopeControls();
    updateIsotopeInfo();
    updateChargeBar();
    updateBehaviourPanel();
    updateIonModeHint();
    updateReactHint();

    // Reset ion mode button
    document.getElementById('ion-mode-btn').classList.remove('active');
  }

  function updateInfoPanel() {
    const el = currentElement;
    document.getElementById('info-number').textContent = el.number;
    document.getElementById('info-symbol').textContent = el.symbol;
    document.getElementById('info-name').textContent = el.name;
    document.getElementById('info-category').textContent = CATEGORIES[el.category]?.label || 'Unknown';
    document.getElementById('info-mass').textContent = el.mass;
    document.getElementById('info-config').textContent = el.electronConfig;
    document.getElementById('info-shells').textContent = el.shells.join(', ');
    document.getElementById('info-eneg').textContent = el.electronegativity ?? '—';
    document.getElementById('info-state').textContent = el.state;
  }

  function updateIsotopeControls() {
    const slider = document.getElementById('isotope-slider');
    const maxIdx = currentElement.isotopes.length - 1;
    slider.max = maxIdx;
    slider.value = 0;
  }

  function updateIsotopeInfo() {
    const el = currentElement;
    const isotope = el.isotopes[currentIsotopeIdx];
    if (!isotope) return;

    const [massNum, name, stable] = isotope;
    const neutrons = massNum - el.number;

    document.getElementById('isotope-label').textContent = `${name}`;
    document.getElementById('isotope-protons').textContent = `${el.number}p`;
    document.getElementById('isotope-neutrons').textContent = `${neutrons}n`;
    document.getElementById('isotope-mass-number').textContent = `A=${massNum}`;

    const stabilityEl = document.getElementById('isotope-stability');
    stabilityEl.textContent = stable ? 'Stable' : 'Radioactive';
    stabilityEl.className = stable ? 'stable' : 'unstable';
  }

  function updateChargeBar() {
    const el = currentElement;
    if (!el) return;

    const protons = el.number;
    const isIonMode = AtomViewer.getIonMode();
    const ionCharge = Behaviour.getLikelyIonCharge(el);

    let electrons = el.shells.reduce((a, b) => a + b, 0);
    let netCharge = 0;

    if (isIonMode && ionCharge !== 0) {
      electrons = electrons - ionCharge; // ionCharge > 0 means lost electrons
      netCharge = ionCharge;
    }

    document.getElementById('charge-protons').textContent = protons;
    document.getElementById('charge-electrons').textContent = electrons;

    const resultEl = document.getElementById('charge-result');
    if (netCharge === 0) {
      resultEl.textContent = '= 0';
      resultEl.classList.remove('charged');
    } else {
      const sign = netCharge > 0 ? '+' : '−';
      resultEl.textContent = `= ${sign}${Math.abs(netCharge)}`;
      resultEl.classList.add('charged');
    }
  }

  function updateBehaviourPanel() {
    const el = currentElement;
    if (!el) return;

    const insights = Behaviour.getInsights(el);
    const container = document.getElementById('behaviour-cards');
    container.innerHTML = '';

    insights.forEach(insight => {
      const card = document.createElement('div');
      card.className = 'insight-card';
      card.setAttribute('data-topic', insight.topic);
      card.innerHTML = `
        <div class="insight-icon">${insight.icon}</div>
        <div class="insight-content">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-text">${insight.text}</div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function updateIonModeHint() {
    const el = currentElement;
    const hint = document.getElementById('ion-mode-hint');
    const btn = document.getElementById('ion-mode-btn');

    if (!el) return;

    const ionCharge = Behaviour.getLikelyIonCharge(el);
    const ionSymbol = Behaviour.getIonSymbol(el);

    if (ionCharge === 0) {
      btn.disabled = true;
      btn.style.opacity = '0.4';
      if (el.category === 'noble-gas') {
        hint.textContent = 'Full outer shell — no ion formed';
      } else if (el.category === 'transition-metal') {
        hint.textContent = 'Variable ion charges';
      } else {
        hint.textContent = 'No simple ion';
      }
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      const action = ionCharge > 0 ? `loses ${ionCharge}e⁻` : `gains ${Math.abs(ionCharge)}e⁻`;
      hint.textContent = `${action} → ${ionSymbol}`;
    }
  }

  function updateReactHint() {
    const el = currentElement;
    const hint = document.getElementById('react-hint');
    const btn = document.getElementById('react-btn');

    if (!el) return;

    const check = Reaction.canReactAtAll(el);
    if (!check.ok) {
      btn.disabled = true;
      btn.style.opacity = '0.4';
      hint.textContent = check.reason;
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      hint.textContent = '';
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
