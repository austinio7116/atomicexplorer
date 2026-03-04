/**
 * Canvas-based animated Bohr model atom viewer.
 * Draws orbiting electrons, electron shells, and a nucleus
 * with individual protons and neutrons.
 */

const AtomViewer = (() => {
  let canvas, ctx;
  let animId;
  let time = 0;
  let currentElement = null;
  let currentIsotopeIdx = 0;
  let speedMult = 1;
  let zoomMult = 1;
  let showLabels = true;
  let showNucleusDetail = true;

  // Smooth transition state
  let targetShells = [];
  let displayShells = [];
  let targetProtons = 0;
  let targetNeutrons = 0;
  let displayProtons = 0;
  let displayNeutrons = 0;

  // Nucleus particle positions (for detailed view)
  let nucleusParticles = [];

  const SHELL_COLORS = [
    '#38bdf8', '#818cf8', '#f472b6', '#fbbf24', '#34d399', '#fb923c', '#a78bfa'
  ];

  const ELECTRON_GLOW = 'rgba(56, 189, 248, 0.6)';
  const PROTON_COLOR = '#f87171';
  const NEUTRON_COLOR = '#60a5fa';

  function init() {
    canvas = document.getElementById('atom-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setElement(element, isotopeIdx = 0) {
    currentElement = element;
    currentIsotopeIdx = isotopeIdx;

    targetShells = [...element.shells];
    targetProtons = element.number;

    const isotope = element.isotopes[isotopeIdx];
    targetNeutrons = isotope ? isotope[0] - element.number : Math.round(element.mass) - element.number;

    // Generate nucleus particle layout
    generateNucleusParticles(targetProtons, targetNeutrons);
  }

  function setIsotope(idx) {
    if (!currentElement) return;
    currentIsotopeIdx = idx;
    const isotope = currentElement.isotopes[idx];
    if (isotope) {
      targetNeutrons = isotope[0] - currentElement.number;
      generateNucleusParticles(targetProtons, targetNeutrons);
    }
  }

  function generateNucleusParticles(protons, neutrons) {
    nucleusParticles = [];
    const total = protons + neutrons;
    if (total === 0) return;

    // Pack particles in a roughly spherical arrangement
    // Use fibonacci sphere for even distribution
    for (let i = 0; i < total; i++) {
      const golden = Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (i / (total - 1 || 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = golden * i;

      nucleusParticles.push({
        x: Math.cos(theta) * radiusAtY,
        y: y,
        z: Math.sin(theta) * radiusAtY,
        isProton: i < protons,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.5 + Math.random() * 1.5
      });
    }
  }

  function setSpeed(s) { speedMult = s; }
  function setZoom(z) { zoomMult = z; }
  function toggleLabels() { showLabels = !showLabels; return showLabels; }
  function toggleNucleusDetail() { showNucleusDetail = !showNucleusDetail; return showNucleusDetail; }

  function animate() {
    time += 0.016 * speedMult;
    draw();
    animId = requestAnimationFrame(animate);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function draw() {
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    if (!currentElement) return;

    // Smooth interpolation
    displayProtons = lerp(displayProtons, targetProtons, 0.08);
    displayNeutrons = lerp(displayNeutrons, targetNeutrons, 0.08);

    while (displayShells.length < targetShells.length) displayShells.push(0);
    while (displayShells.length > targetShells.length) displayShells.pop();
    for (let i = 0; i < targetShells.length; i++) {
      displayShells[i] = lerp(displayShells[i] || 0, targetShells[i], 0.08);
    }

    const numShells = targetShells.length;
    const maxRadius = Math.min(cx, cy) * 0.88 * zoomMult;
    const nucleusRadius = Math.min(24 + Math.pow(targetProtons, 0.4) * 3, maxRadius * 0.18) * zoomMult;

    // Draw shells (orbits)
    for (let s = 0; s < numShells; s++) {
      const shellRadius = nucleusRadius + ((s + 1) / numShells) * (maxRadius - nucleusRadius);
      const color = SHELL_COLORS[s % SHELL_COLORS.length];

      // Orbit ring
      ctx.beginPath();
      ctx.arc(cx, cy, shellRadius, 0, Math.PI * 2);
      ctx.strokeStyle = color + '30';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Shell label
      if (showLabels) {
        ctx.fillStyle = color + '80';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        const shellNames = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
        ctx.fillText(shellNames[s] || `S${s+1}`, cx + shellRadius + 10, cy - 4);
      }

      // Draw electrons on this shell
      const electronCount = Math.round(displayShells[s]);
      for (let e = 0; e < electronCount; e++) {
        const baseSpeed = (0.3 + 0.15 * s) * speedMult;
        // Alternate directions for adjacent shells
        const direction = s % 2 === 0 ? 1 : -1;
        const angle = direction * time * baseSpeed + (e / electronCount) * Math.PI * 2;

        // Slight elliptical wobble for visual interest
        const wobble = Math.sin(time * 0.5 + s) * 0.04;
        const rx = shellRadius * (1 + wobble);
        const ry = shellRadius * (1 - wobble);

        const ex = cx + Math.cos(angle) * rx;
        const ey = cy + Math.sin(angle) * ry;

        // Electron trail (motion blur)
        for (let t = 1; t <= 4; t++) {
          const trailAngle = angle - direction * t * 0.06;
          const tx = cx + Math.cos(trailAngle) * rx;
          const ty = cy + Math.sin(trailAngle) * ry;
          ctx.beginPath();
          ctx.arc(tx, ty, 3.5 - t * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = color + (20 - t * 4).toString(16).padStart(2, '0');
          ctx.fill();
        }

        // Electron glow
        const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 10);
        grad.addColorStop(0, color + 'aa');
        grad.addColorStop(1, color + '00');
        ctx.beginPath();
        ctx.arc(ex, ey, 10, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Electron dot
        ctx.beginPath();
        ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // Draw nucleus
    drawNucleus(cx, cy, nucleusRadius);

    // Element label
    if (showLabels && currentElement) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(currentElement.symbol, cx, cy + nucleusRadius + 22);
      ctx.font = '11px system-ui';
      ctx.fillStyle = '#94a3b8';
      const isotope = currentElement.isotopes[currentIsotopeIdx];
      if (isotope) {
        ctx.fillText(`A=${isotope[0]}  Z=${currentElement.number}  N=${isotope[0] - currentElement.number}`, cx, cy + nucleusRadius + 38);
      }
    }
  }

  function drawNucleus(cx, cy, radius) {
    // Background glow
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.5);
    bgGrad.addColorStop(0, 'rgba(251, 113, 133, 0.25)');
    bgGrad.addColorStop(0.5, 'rgba(96, 165, 250, 0.1)');
    bgGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    if (showNucleusDetail && nucleusParticles.length > 0 && nucleusParticles.length <= 200) {
      // Draw individual protons and neutrons
      const particleRadius = Math.min(5, radius / (Math.pow(nucleusParticles.length, 0.33) * 1.2));

      // Sort by z for depth effect
      const sorted = [...nucleusParticles].sort((a, b) => a.z - b.z);

      sorted.forEach(p => {
        const wobble = Math.sin(time * p.wobbleSpeed + p.wobblePhase) * 0.06;
        const px = cx + (p.x + wobble) * radius * 0.75;
        const py = cy + (p.y + wobble * 0.7) * radius * 0.75;
        const depth = (p.z + 1) / 2; // 0 to 1

        const r = particleRadius * (0.7 + depth * 0.3);
        const alpha = 0.5 + depth * 0.5;

        const color = p.isProton ? PROTON_COLOR : NEUTRON_COLOR;

        // Particle shadow/depth
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.arc(px - r * 0.3, py - r * 0.3, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fill();

        ctx.globalAlpha = 1;
      });

      // Legend for nucleus
      if (showLabels) {
        ctx.font = '9px system-ui';
        ctx.textAlign = 'left';
        ctx.fillStyle = PROTON_COLOR;
        ctx.fillText(`● p: ${targetProtons}`, cx - radius - 8, cy + radius + 14);
        ctx.fillStyle = NEUTRON_COLOR;
        ctx.fillText(`● n: ${Math.round(targetNeutrons)}`, cx + 8, cy + radius + 14);
      }
    } else {
      // Simple nucleus sphere for large atoms
      const grad = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, 0, cx, cy, radius);
      grad.addColorStop(0, '#fca5a5');
      grad.addColorStop(0.4, '#e85577');
      grad.addColorStop(0.8, '#7c3aed');
      grad.addColorStop(1, '#4338ca');
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Specular highlight
      const spec = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
      spec.addColorStop(0, 'rgba(255,255,255,0.35)');
      spec.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      spec.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();

      if (showLabels) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.min(12, radius * 0.5)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${targetProtons}p ${Math.round(targetNeutrons)}n`, cx, cy);
        ctx.textBaseline = 'alphabetic';
      }
    }
  }

  return { init, setElement, setIsotope, setSpeed, setZoom, toggleLabels, toggleNucleusDetail };
})();
