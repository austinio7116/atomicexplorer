/**
 * Main application controller.
 * Wires the periodic table, atom viewer, info panel, and isotope controls together.
 */

(function () {
  let currentElement = null;
  let currentIsotopeIdx = 0;

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
  }

  function onElementSelected(atomicNumber) {
    currentElement = getElementById(atomicNumber);
    if (!currentElement) return;

    currentIsotopeIdx = 0;
    AtomViewer.setElement(currentElement, 0);
    updateInfoPanel();
    updateIsotopeControls();
    updateIsotopeInfo();
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
