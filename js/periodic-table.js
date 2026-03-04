/**
 * Renders the interactive periodic table grid and handles
 * hover tooltips, click selection, search filtering, and category highlighting.
 */

const PeriodicTable = (() => {
  let selectedNumber = 1;
  let activeCategory = null;
  let onSelect = () => {};
  let pickMode = false;
  let pickFilter = null;
  let onPickSelect = null;
  const tooltip = document.createElement('div');
  tooltip.className = 'element-tooltip';
  document.body.appendChild(tooltip);

  function init(selectCallback) {
    onSelect = selectCallback;
    renderTable();
    renderLegend();
    bindSearch();
  }

  function renderTable() {
    const grid = document.getElementById('periodic-table');
    grid.innerHTML = '';

    // Build a sparse grid: rows 1-7 for main, 9-10 for lanthanides/actinides
    // Plus row 8 as spacer, and lanthanide/actinide label markers
    const maxRow = 10;
    const maxCol = 18;

    // Index elements by grid position
    const posMap = {};
    ELEMENTS.forEach(el => {
      posMap[`${el.gridRow}-${el.gridCol}`] = el;
    });

    for (let row = 1; row <= maxRow; row++) {
      // Row 8 = gap row with lanthanide/actinide arrows
      if (row === 8) {
        for (let col = 1; col <= maxCol; col++) {
          const spacer = document.createElement('div');
          spacer.className = 'element-cell spacer';
          spacer.style.gridRow = row;
          spacer.style.gridColumn = col;
          if (col === 3) {
            spacer.className = 'element-cell label-cell';
            spacer.style.visibility = 'visible';
            spacer.textContent = '↓';
          }
          grid.appendChild(spacer);
        }
        continue;
      }

      for (let col = 1; col <= maxCol; col++) {
        const el = posMap[`${row}-${col}`];

        if (!el) {
          // Lanthanide/actinide placeholder markers in main rows
          if ((row === 6 && col === 3)) {
            const marker = document.createElement('div');
            marker.className = 'element-cell label-cell';
            marker.style.gridRow = row;
            marker.style.gridColumn = col;
            marker.innerHTML = '<span style="font-size:0.55rem">57-71</span>';
            marker.style.setProperty('--cat-color', CATEGORIES['lanthanide'].color);
            marker.style.background = CATEGORIES['lanthanide'].color + '22';
            marker.style.borderRadius = '6px';
            grid.appendChild(marker);
            continue;
          }
          if ((row === 7 && col === 3)) {
            const marker = document.createElement('div');
            marker.className = 'element-cell label-cell';
            marker.style.gridRow = row;
            marker.style.gridColumn = col;
            marker.innerHTML = '<span style="font-size:0.55rem">89-103</span>';
            marker.style.setProperty('--cat-color', CATEGORIES['actinide'].color);
            marker.style.background = CATEGORIES['actinide'].color + '22';
            marker.style.borderRadius = '6px';
            grid.appendChild(marker);
            continue;
          }

          // Empty spacers for correct layout
          const spacer = document.createElement('div');
          spacer.className = 'element-cell spacer';
          spacer.style.gridRow = row;
          spacer.style.gridColumn = col;
          grid.appendChild(spacer);
          continue;
        }

        const cell = document.createElement('div');
        cell.className = 'element-cell';
        cell.dataset.number = el.number;
        cell.style.gridRow = row;
        cell.style.gridColumn = col;
        cell.style.setProperty('--cat-color', CATEGORIES[el.category]?.color || '#64748b');

        cell.innerHTML = `
          <span class="number">${el.number}</span>
          <span class="symbol">${el.symbol}</span>
          <span class="name">${el.name}</span>
        `;

        if (el.number === selectedNumber) cell.classList.add('selected');

        cell.addEventListener('click', () => {
          if (pickMode && onPickSelect) {
            const target = getElementById(el.number);
            if (target && pickFilter && pickFilter(target)) {
              onPickSelect(el.number);
            }
            return;
          }
          selectElement(el.number);
        });
        cell.addEventListener('mouseenter', (e) => showTooltip(e, el));
        cell.addEventListener('mousemove', (e) => moveTooltip(e));
        cell.addEventListener('mouseleave', hideTooltip);
        cell.addEventListener('touchstart', hideTooltip, { passive: true });

        grid.appendChild(cell);
      }
    }
  }

  function selectElement(num) {
    const prev = document.querySelector('.element-cell.selected');
    if (prev) prev.classList.remove('selected');

    selectedNumber = num;
    const cell = document.querySelector(`.element-cell[data-number="${num}"]`);
    if (cell) cell.classList.add('selected');

    onSelect(num);
  }

  function showTooltip(e, el) {
    tooltip.innerHTML = `
      <div class="tt-symbol">${el.symbol}</div>
      <div class="tt-name">${el.name} (#${el.number})</div>
      <div class="tt-mass">Mass: ${el.mass}</div>
      <div class="tt-mass">${CATEGORIES[el.category]?.label || 'Unknown'}</div>
    `;
    tooltip.classList.add('visible');
    moveTooltip(e);
  }

  function moveTooltip(e) {
    const pad = 12;
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    if (x + 200 > window.innerWidth) x = e.clientX - 210;
    if (y + 100 > window.innerHeight) y = e.clientY - 110;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function hideTooltip() {
    tooltip.classList.remove('visible');
  }

  function renderLegend() {
    const container = document.getElementById('table-legend');
    container.innerHTML = '';
    Object.entries(CATEGORIES).forEach(([key, val]) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<span class="legend-swatch" style="background:${val.color}"></span>${val.label}`;
      item.addEventListener('click', () => filterCategory(key));
      container.appendChild(item);
    });
  }

  function filterCategory(cat) {
    activeCategory = activeCategory === cat ? null : cat;
    document.querySelectorAll('.element-cell[data-number]').forEach(cell => {
      const el = getElementById(+cell.dataset.number);
      if (!activeCategory || el.category === activeCategory) {
        cell.classList.remove('dimmed');
      } else {
        cell.classList.add('dimmed');
      }
    });
    // Update category filter buttons
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === activeCategory);
      if (activeCategory && btn.dataset.cat === activeCategory) {
        btn.style.background = CATEGORIES[activeCategory].color;
      } else {
        btn.style.background = '';
      }
    });
  }

  function bindSearch() {
    const input = document.getElementById('element-search');
    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (!q) {
        document.querySelectorAll('.element-cell[data-number]').forEach(c => c.classList.remove('dimmed'));
        return;
      }
      const matches = new Set(searchElements(q).map(e => e.number));
      document.querySelectorAll('.element-cell[data-number]').forEach(cell => {
        cell.classList.toggle('dimmed', !matches.has(+cell.dataset.number));
      });
    });

    // Build category filter buttons in header
    const filtersDiv = document.getElementById('category-filters');
    Object.entries(CATEGORIES).forEach(([key, val]) => {
      const btn = document.createElement('button');
      btn.className = 'cat-btn';
      btn.dataset.cat = key;
      btn.textContent = val.label;
      btn.addEventListener('click', () => filterCategory(key));
      filtersDiv.appendChild(btn);
    });
  }

  /**
   * Enter/exit pick mode. In pick mode, clicking an element calls
   * onPickCb instead of the normal select. filterFn(element) → bool
   * determines which elements are clickable (rest are dimmed).
   */
  function setPickMode(enabled, filterFn, onPickCb) {
    pickMode = enabled;
    pickFilter = filterFn || null;
    onPickSelect = onPickCb || null;

    const grid = document.getElementById('periodic-table');
    grid.classList.toggle('pick-mode', enabled);

    document.querySelectorAll('.element-cell[data-number]').forEach(cell => {
      const el = getElementById(+cell.dataset.number);
      if (!el) return;
      if (enabled && filterFn) {
        const valid = filterFn(el);
        cell.classList.toggle('dimmed', !valid);
        cell.classList.toggle('pick-highlight', valid);
      } else {
        cell.classList.remove('pick-highlight');
        // Restore normal dim state
        if (!activeCategory || el.category === activeCategory) {
          cell.classList.remove('dimmed');
        }
      }
    });
  }

  return { init, selectElement, setPickMode };
})();
