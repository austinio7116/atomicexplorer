/**
 * Main application controller.
 * Wires the periodic table, atom viewer, behaviour panel,
 * info panel, and isotope controls together.
 */

(function () {
  let currentElement = null;
  let currentIsotopeIdx = 0;
  let behaviourOpen = true;

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
      if (!currentElement) return;
      const charge = Behaviour.getLikelyIonCharge(currentElement);
      const isOn = AtomViewer.getIonMode();

      if (charge === 0) return; // No typical ion for this element

      AtomViewer.setIonMode(!isOn, charge);
      e.target.classList.toggle('active', !isOn);
      updateChargeBar();
      updateIonModeHint();
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

  function onElementSelected(atomicNumber) {
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
