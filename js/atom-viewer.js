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

  // Ion mode state
  let ionMode = false;
  let ionCharge = 0; // electrons lost (positive) or gained (negative)
  let ionTransition = 0; // 0 = normal atom, 1 = fully ionised (for animation)
  let ionTarget = 0;

  // Reaction mode state
  let reactionMode = false;
  let reactionData = null; // from Reaction.getReactionData()
  let reactionElA = null;
  let reactionElB = null;
  let reactionPhase = 0;   // 0 → 1 animation progress
  let reactionTarget = 1;

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

    // Reset ion mode
    ionMode = false;
    ionCharge = 0;
    ionTarget = 0;
    ionTransition = 0;

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

  /**
   * Toggle ion mode. When enabled, animates electron loss/gain.
   * charge: positive = electrons lost, negative = electrons gained
   */
  function setIonMode(enabled, charge) {
    ionMode = enabled;
    ionCharge = charge || 0;
    ionTarget = enabled ? 1 : 0;
  }

  function getIonMode() { return ionMode; }
  function getIonTransition() { return ionTransition; }

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

    if (reactionMode && reactionData) {
      reactionPhase = lerp(reactionPhase, reactionTarget, 0.03);
      drawReaction(w, h);
      return;
    }

    if (!currentElement) return;

    // Smooth interpolation
    displayProtons = lerp(displayProtons, targetProtons, 0.08);
    displayNeutrons = lerp(displayNeutrons, targetNeutrons, 0.08);

    // Animate ion transition
    ionTransition = lerp(ionTransition, ionTarget, 0.06);

    while (displayShells.length < targetShells.length) displayShells.push(0);
    while (displayShells.length > targetShells.length) displayShells.pop();
    for (let i = 0; i < targetShells.length; i++) {
      displayShells[i] = lerp(displayShells[i] || 0, targetShells[i], 0.08);
    }

    const numShells = targetShells.length;
    const maxRadius = Math.min(cx, cy) * 0.88 * zoomMult;
    const nucleusRadius = Math.min(24 + Math.pow(targetProtons, 0.4) * 3, maxRadius * 0.18) * zoomMult;

    // Determine which shell is the outer shell
    const outerShellIdx = numShells - 1;

    // Ion mode: compute effective electrons to show per shell
    const ionElectronsRemoved = ionMode ? ionCharge * ionTransition : 0;
    // ionCharge > 0: losing electrons from outer shell
    // ionCharge < 0: gaining electrons to outer shell

    // Draw shells (orbits)
    for (let s = 0; s < numShells; s++) {
      const shellRadius = nucleusRadius + ((s + 1) / numShells) * (maxRadius - nucleusRadius);
      const color = SHELL_COLORS[s % SHELL_COLORS.length];
      const isOuter = s === outerShellIdx;

      // In ion mode, check if this shell should still be visible
      let shellElectronTarget = targetShells[s];
      let ionShellFade = 1;

      if (ionMode && isOuter && ionCharge > 0) {
        // Losing electrons: reduce count, fade shell if empty
        shellElectronTarget = Math.max(0, targetShells[s] - ionCharge * ionTransition);
        if (targetShells[s] - ionCharge <= 0) {
          ionShellFade = 1 - ionTransition;
        }
      } else if (ionMode && isOuter && ionCharge < 0) {
        // Gaining electrons
        shellElectronTarget = targetShells[s] + Math.abs(ionCharge) * ionTransition;
      }

      // Outer shell highlight glow
      if (isOuter && ionShellFade > 0.01) {
        const glowPulse = 0.4 + Math.sin(time * 2) * 0.15;
        ctx.beginPath();
        ctx.arc(cx, cy, shellRadius, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.globalAlpha = glowPulse * ionShellFade;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // "Outer shell" label
        if (showLabels) {
          ctx.fillStyle = color;
          ctx.font = 'bold 10px system-ui';
          ctx.textAlign = 'left';
          ctx.globalAlpha = 0.8 * ionShellFade;
          const labelAngle = -Math.PI / 4;
          const lx = cx + Math.cos(labelAngle) * (shellRadius + 14);
          const ly = cy + Math.sin(labelAngle) * (shellRadius + 14);
          ctx.fillText('outer shell', lx, ly);
          ctx.globalAlpha = 1;
        }
      }

      // Orbit ring
      ctx.beginPath();
      ctx.arc(cx, cy, shellRadius, 0, Math.PI * 2);
      ctx.strokeStyle = color + '30';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = ionShellFade;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Shell label
      if (showLabels) {
        ctx.fillStyle = color + '80';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        const shellNames = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
        ctx.globalAlpha = ionShellFade;
        ctx.fillText(shellNames[s] || `S${s+1}`, cx + shellRadius + 10, cy - 4);
        ctx.globalAlpha = 1;
      }

      // Electron count badge on outer shell
      if (isOuter && showLabels && ionShellFade > 0.01) {
        const info = getOuterShellInfo(currentElement);
        const displayCount = ionMode ? Math.round(shellElectronTarget) : info.outerElectrons;
        const badgeText = `${displayCount} of ${info.maxOuterElectrons}`;
        const badgeAngle = Math.PI / 4;
        const bx = cx + Math.cos(badgeAngle) * (shellRadius + 14);
        const by = cy + Math.sin(badgeAngle) * (shellRadius + 14);

        ctx.globalAlpha = 0.9 * ionShellFade;
        ctx.font = 'bold 11px system-ui';
        ctx.textAlign = 'center';
        const bw = ctx.measureText(badgeText).width + 10;
        // Badge background
        ctx.fillStyle = '#1a2235';
        ctx.strokeStyle = color + '80';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx - bw / 2, by - 8, bw, 16, 4);
        ctx.fill();
        ctx.stroke();
        // Badge text
        ctx.fillStyle = color;
        ctx.fillText(badgeText, bx, by + 4);
        ctx.globalAlpha = 1;
      }

      // Draw electrons on this shell
      const electronCount = isOuter && ionMode
        ? Math.max(0, Math.round(shellElectronTarget))
        : Math.round(displayShells[s]);
      const totalOnShell = Math.round(displayShells[s]); // positions based on original count

      for (let e = 0; e < electronCount; e++) {
        const posCount = Math.max(electronCount, totalOnShell); // space evenly
        const baseSpeed = (0.3 + 0.15 * s) * speedMult;
        const direction = s % 2 === 0 ? 1 : -1;
        const angle = direction * time * baseSpeed + (e / posCount) * Math.PI * 2;

        const wobble = Math.sin(time * 0.5 + s) * 0.04;
        const rx = shellRadius * (1 + wobble);
        const ry = shellRadius * (1 - wobble);

        // In ion mode with fading shell, electrons drift outward
        let drift = 0;
        if (ionMode && isOuter && ionCharge > 0 && e >= (targetShells[s] - ionCharge)) {
          drift = ionTransition * 40;
        }

        const ex = cx + Math.cos(angle) * (rx + drift);
        const ey = cy + Math.sin(angle) * (ry + drift);
        const electronAlpha = drift > 0 ? Math.max(0, 1 - ionTransition) : ionShellFade;

        // Electron trail (motion blur)
        for (let t = 1; t <= 4; t++) {
          const trailAngle = angle - direction * t * 0.06;
          const tx = cx + Math.cos(trailAngle) * (rx + drift);
          const ty = cy + Math.sin(trailAngle) * (ry + drift);
          ctx.beginPath();
          ctx.arc(tx, ty, 3.5 - t * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = color + (20 - t * 4).toString(16).padStart(2, '0');
          ctx.globalAlpha = electronAlpha;
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Electron glow
        const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 10);
        grad.addColorStop(0, color + 'aa');
        grad.addColorStop(1, color + '00');
        ctx.beginPath();
        ctx.arc(ex, ey, 10, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = electronAlpha;
        ctx.fill();

        // Electron dot
        ctx.beginPath();
        ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // Draw nucleus
    drawNucleus(cx, cy, nucleusRadius);

    // Charge display when in ion mode
    if (ionMode && ionTransition > 0.05) {
      const chargeVal = Math.round(ionCharge * ionTransition);
      if (chargeVal !== 0) {
        const chargeText = (chargeVal > 0 ? '+' : '−') + Math.abs(chargeVal);
        ctx.globalAlpha = ionTransition;
        ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = chargeVal > 0 ? '#f87171' : '#60a5fa';
        ctx.fillText(chargeText + ' charge', cx, cy - maxRadius + 20);
        ctx.globalAlpha = 1;
      }
    }

    // Element label
    if (showLabels && currentElement) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      // Show ion symbol when in ion mode
      if (ionMode && ionTransition > 0.5 && ionCharge !== 0) {
        const ionSym = Behaviour.getIonSymbol(currentElement);
        ctx.fillText(ionSym || currentElement.symbol, cx, cy + nucleusRadius + 22);
      } else {
        ctx.fillText(currentElement.symbol, cx, cy + nucleusRadius + 22);
      }
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

  // ---- Reaction mode rendering ----

  function setReaction(elA, elB, data) {
    reactionMode = true;
    reactionElA = elA;
    reactionElB = elB;
    reactionData = data;
    reactionPhase = 0;
    reactionTarget = 1;
  }

  function clearReaction() {
    reactionMode = false;
    reactionData = null;
    reactionElA = null;
    reactionElB = null;
    reactionPhase = 0;
  }

  function getReactionMode() { return reactionMode; }

  /**
   * Draw a simplified atom at a given position.
   * Shows nucleus core + outer 2 shells only.
   */
  function drawAtomAt(el, cx, cy, scale) {
    const shells = el.shells;
    const numShells = shells.length;
    const maxRadius = 90 * scale;
    const coreRadius = 14 * scale;

    // Draw core circle (represents nucleus + inner shells)
    const coreGrad = ctx.createRadialGradient(cx - coreRadius * 0.2, cy - coreRadius * 0.2, 0, cx, cy, coreRadius);
    coreGrad.addColorStop(0, '#fca5a5');
    coreGrad.addColorStop(0.5, '#e85577');
    coreGrad.addColorStop(1, '#4338ca');
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Core label
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(8, 10 * scale)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.symbol, cx, cy);
    ctx.textBaseline = 'alphabetic';

    // Draw only outer 2 shells (or fewer)
    const shellsToShow = Math.min(numShells, 2);
    const startShell = numShells - shellsToShow;

    for (let i = 0; i < shellsToShow; i++) {
      const sIdx = startShell + i;
      const isOuter = sIdx === numShells - 1;
      const shellRadius = coreRadius + ((i + 1) / shellsToShow) * (maxRadius - coreRadius);
      const color = SHELL_COLORS[sIdx % SHELL_COLORS.length];

      // Orbit ring
      ctx.beginPath();
      ctx.arc(cx, cy, shellRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isOuter ? color + '60' : color + '30';
      ctx.lineWidth = isOuter ? 1.5 : 1;
      ctx.stroke();

      // Electrons
      const eCount = shells[sIdx];
      for (let e = 0; e < eCount; e++) {
        const baseSpeed = (0.3 + 0.1 * sIdx) * speedMult;
        const dir = sIdx % 2 === 0 ? 1 : -1;
        const angle = dir * time * baseSpeed + (e / eCount) * Math.PI * 2;
        const ex = cx + Math.cos(angle) * shellRadius;
        const ey = cy + Math.sin(angle) * shellRadius;

        // Glow
        const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 6 * scale);
        grad.addColorStop(0, color + 'aa');
        grad.addColorStop(1, color + '00');
        ctx.beginPath();
        ctx.arc(ex, ey, 6 * scale, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Dot
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // Element label below
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.max(9, 11 * scale)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(el.name, cx, cy + maxRadius + 14 * scale);
  }

  // ---- Multi-atom layout engine ----

  /**
   * Compute positions for all atoms in the reaction.
   * Layout: group A atoms on the left, group B atoms on the right,
   * each group stacked vertically and centred in its half.
   */
  function layoutReactionAtoms(w, h) {
    const data = reactionData;
    const sameElement = data.elB && data.elA.number === data.elB.number;

    // Build two groups
    const groupA = [];
    for (let i = 0; i < data.ratioA; i++) {
      groupA.push({ el: data.elA, role: data.bondType === 'ionic' ? 'metal' : 'a' });
    }
    const groupB = [];
    if (data.ratioB > 0) {
      for (let i = 0; i < data.ratioB; i++) {
        groupB.push({ el: sameElement ? data.elA : data.elB, role: data.bondType === 'ionic' ? 'nonmetal' : 'b' });
      }
    }

    const n = groupA.length + groupB.length;
    const maxPerColumn = Math.max(groupA.length, groupB.length);

    // Scale: fit the tallest column and two side-by-side groups
    const baseScale = Math.min(w, h) / 400;
    // Vertical: each atom needs ~200*scale height (90 radius + label + gap)
    const vFit = maxPerColumn > 1 ? (h * 0.7) / (maxPerColumn * 200) : baseScale;
    // Horizontal: two groups need ~200*scale each with a gap
    const hFit = groupB.length > 0 ? (w * 0.8) / (2 * 200) : (w * 0.8) / (200);
    const atomScale = Math.max(0.25, Math.min(baseScale, vFit, hFit));

    const atomSpacingY = 190 * atomScale;

    // Position group A: centred vertically on the left side
    const leftX = groupB.length > 0 ? w * 0.28 : w * 0.5;
    const rightX = w * 0.72;
    const centreY = h * 0.45;

    function stackPositions(group, cx) {
      const totalH = (group.length - 1) * atomSpacingY;
      return group.map((a, i) => ({
        ...a,
        cx: cx,
        cy: centreY - totalH / 2 + i * atomSpacingY
      }));
    }

    const positions = [
      ...stackPositions(groupA, leftX),
      ...stackPositions(groupB, rightX)
    ];

    return { positions, atomScale, n };
  }

  /**
   * Draw ionic reaction with actual atom counts.
   */
  function drawIonicReaction(w, h, positions, atomScale) {
    const data = reactionData;
    const phase = reactionPhase;
    const transferPerMetal = Math.abs(data.chargeA);
    const gainPerNonmetal = Math.abs(data.chargeB);

    // Separate metal and non-metal positions
    const metals = positions.filter(p => p.role === 'metal');
    const nonmetals = positions.filter(p => p.role === 'nonmetal');

    // Draw all atoms
    positions.forEach(p => {
      const transfer = p.role === 'metal' ? transferPerMetal : gainPerNonmetal;
      drawAtomAtIonic(p.el, p.cx, p.cy, atomScale, phase, p.role, transfer);
    });

    // Transferring electrons (phase 0.3–0.7): each metal sends electrons to nearest non-metal
    if (phase > 0.3 && phase < 0.95) {
      const t = Math.min(1, (phase - 0.3) / 0.4);
      metals.forEach((m, mi) => {
        // Find nearest non-metal
        let nearest = nonmetals[0];
        let bestDist = Infinity;
        nonmetals.forEach(nm => {
          const d = Math.abs(nm.cx - m.cx) + Math.abs(nm.cy - m.cy);
          if (d < bestDist) { bestDist = d; nearest = nm; }
        });

        for (let i = 0; i < transferPerMetal; i++) {
          const delay = i * 0.12;
          const ti = Math.max(0, Math.min(1, (t - delay) / (1 - delay)));
          if (ti <= 0) continue;

          const outerRad = 90 * atomScale;
          // Depart from right side of metal, arrive at left side of non-metal
          const spread = (i - (transferPerMetal - 1) / 2) * 20 * atomScale;
          const sx = m.cx + outerRad;
          const sy = m.cy + spread;
          const ex = nearest.cx - outerRad;
          const ey = nearest.cy + spread;
          const cpx = (m.cx + nearest.cx) / 2;
          const cpy = (m.cy + nearest.cy) / 2 - 30 * atomScale + spread;

          const bx = (1-ti)*(1-ti)*sx + 2*(1-ti)*ti*cpx + ti*ti*ex;
          const by = (1-ti)*(1-ti)*sy + 2*(1-ti)*ti*cpy + ti*ti*ey;

          const color = '#fbbf24';
          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, 8 * atomScale);
          grad.addColorStop(0, color + 'ff');
          grad.addColorStop(1, color + '00');
          ctx.beginPath();
          ctx.arc(bx, by, 8 * atomScale, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bx, by, 3 * atomScale, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      });
    }

    // Phase 0.7+: charges, bonds, formula
    if (phase > 0.7) {
      const fadeIn = Math.min(1, (phase - 0.7) / 0.3);
      ctx.globalAlpha = fadeIn;
      const outerRad = 90 * atomScale;

      // Charge labels on each atom
      positions.forEach(p => {
        const ch = p.role === 'metal' ? data.chargeA : data.chargeB;
        const label = (ch > 0 ? '+' : '−') + Math.abs(ch);
        ctx.font = `bold ${Math.max(9, 12 * atomScale)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillStyle = ch > 0 ? '#f87171' : '#60a5fa';
        ctx.fillText(label, p.cx + outerRad * 0.35, p.cy - outerRad - 4);
      });

      // Attraction indicator: single dashed line between group centres
      if (metals.length > 0 && nonmetals.length > 0) {
        const mCentreX = metals.reduce((s, p) => s + p.cx, 0) / metals.length;
        const mCentreY = metals.reduce((s, p) => s + p.cy, 0) / metals.length;
        const nmCentreX = nonmetals.reduce((s, p) => s + p.cx, 0) / nonmetals.length;
        const nmCentreY = nonmetals.reduce((s, p) => s + p.cy, 0) / nonmetals.length;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#fbbf2460';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mCentreX + outerRad, mCentreY);
        ctx.lineTo(nmCentreX - outerRad, nmCentreY);
        ctx.stroke();
        ctx.setLineDash([]);
        // "+" and "−" labels on the line
        const lineMidX = (mCentreX + nmCentreX) / 2;
        const lineMidY = (mCentreY + nmCentreY) / 2;
        ctx.font = `bold ${Math.max(10, 13 * atomScale)}px system-ui`;
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('attracts', lineMidX, lineMidY - 8);
      }

      // Bond type + formula at bottom
      const midX = w / 2;
      ctx.font = `bold ${Math.max(11, 14 * atomScale)}px system-ui`;
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('ionic bond', midX, h - 38);
      ctx.font = `bold ${Math.max(14, 18 * atomScale)}px system-ui`;
      ctx.fillStyle = '#fff';
      ctx.fillText(data.formula, midX, h - 16);

      ctx.globalAlpha = 1;
    }
  }

  /**
   * Draw an atom in ionic reaction mode with phase-dependent electron count.
   */
  function drawAtomAtIonic(el, cx, cy, scale, phase, role, transferCount) {
    const shells = el.shells;
    const numShells = shells.length;
    const maxRadius = 90 * scale;
    const coreRadius = 14 * scale;

    // Core
    const coreGrad = ctx.createRadialGradient(cx - coreRadius * 0.2, cy - coreRadius * 0.2, 0, cx, cy, coreRadius);
    coreGrad.addColorStop(0, '#fca5a5');
    coreGrad.addColorStop(0.5, '#e85577');
    coreGrad.addColorStop(1, '#4338ca');
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(8, 10 * scale)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.symbol, cx, cy);
    ctx.textBaseline = 'alphabetic';

    const shellsToShow = Math.min(numShells, 2);
    const startShell = numShells - shellsToShow;

    for (let i = 0; i < shellsToShow; i++) {
      const sIdx = startShell + i;
      const isOuter = sIdx === numShells - 1;
      const shellRadius = coreRadius + ((i + 1) / shellsToShow) * (maxRadius - coreRadius);
      const color = SHELL_COLORS[sIdx % SHELL_COLORS.length];

      let eCount = shells[sIdx];

      // Modify outer shell electron count based on phase
      if (isOuter && phase > 0.3) {
        const t = Math.min(1, (phase - 0.3) / 0.4);
        if (role === 'metal') {
          eCount = Math.max(0, Math.round(shells[sIdx] - transferCount * t));
        } else {
          eCount = Math.round(shells[sIdx] + transferCount * t);
        }
      }

      // Fade outer shell if metal lost all electrons
      let shellAlpha = 1;
      if (isOuter && role === 'metal' && eCount === 0 && phase > 0.6) {
        shellAlpha = Math.max(0, 1 - (phase - 0.6) / 0.4);
      }

      ctx.globalAlpha = shellAlpha;
      ctx.beginPath();
      ctx.arc(cx, cy, shellRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isOuter ? color + '60' : color + '30';
      ctx.lineWidth = isOuter ? 1.5 : 1;
      ctx.stroke();

      for (let e = 0; e < eCount; e++) {
        const baseSpeed = (0.3 + 0.1 * sIdx) * speedMult;
        const dir = sIdx % 2 === 0 ? 1 : -1;
        const angle = dir * time * baseSpeed + (e / Math.max(eCount, shells[sIdx])) * Math.PI * 2;
        const ex = cx + Math.cos(angle) * shellRadius;
        const ey = cy + Math.sin(angle) * shellRadius;

        const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 6 * scale);
        grad.addColorStop(0, color + 'aa');
        grad.addColorStop(1, color + '00');
        ctx.beginPath();
        ctx.arc(ex, ey, 6 * scale, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ex, ey, 2.5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Name label
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.max(9, 11 * scale)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(el.name, cx, cy + maxRadius + 14 * scale);
  }

  /**
   * Draw covalent reaction with actual atom counts.
   * Atoms move toward centre and share electrons in overlap zones.
   */
  function drawCovalentReaction(w, h, positions, atomScale) {
    const data = reactionData;
    const phase = reactionPhase;
    const n = positions.length;

    // Centre of all atoms
    const centreX = positions.reduce((s, p) => s + p.cx, 0) / n;
    const centreY = positions.reduce((s, p) => s + p.cy, 0) / n;

    // Phase 0.3–0.7: atoms drift toward centre
    let moveT = 0;
    if (phase > 0.3) moveT = Math.min(1, (phase - 0.3) / 0.4);
    const driftFraction = 0.25 * moveT; // move 25% toward centre

    const drawn = positions.map(p => {
      const dx = centreX - p.cx;
      const dy = centreY - p.cy;
      return {
        ...p,
        drawX: p.cx + dx * driftFraction,
        drawY: p.cy + dy * driftFraction
      };
    });

    // Draw each atom
    drawn.forEach(p => drawAtomAt(p.el, p.drawX, p.drawY, atomScale));

    // Phase 0.3+: overlap glow between bonded pairs only
    // Bonds form between group A and group B atoms, not within the same group
    // For diatomics (same element), both are role 'a' so bond the pair
    if (phase > 0.3) {
      const fadeIn = Math.min(1, (phase - 0.3) / 0.3);
      const sameElement = data.ratioB === 0;

      // Build bond pairs: each A bonds to its nearest B (or the other A for diatomics)
      const bondPairs = [];
      if (sameElement) {
        // Diatomic: bond the two atoms
        if (drawn.length === 2) bondPairs.push([0, 1]);
      } else {
        const groupA = drawn.filter(p => p.role === 'a');
        const groupB = drawn.filter(p => p.role === 'b');
        // Each B bonds to its nearest A
        groupB.forEach(b => {
          let bestIdx = 0, bestDist = Infinity;
          groupA.forEach((a, ai) => {
            const d = Math.hypot(a.drawX - b.drawX, a.drawY - b.drawY);
            if (d < bestDist) { bestDist = d; bestIdx = ai; }
          });
          bondPairs.push([drawn.indexOf(groupA[bestIdx]), drawn.indexOf(b)]);
        });
        // Also each A bonds to its nearest B (catches cases where A has more bonds)
        groupA.forEach(a => {
          let bestIdx = 0, bestDist = Infinity;
          groupB.forEach((b, bi) => {
            const d = Math.hypot(a.drawX - b.drawX, a.drawY - b.drawY);
            if (d < bestDist) { bestDist = d; bestIdx = bi; }
          });
          const pair = [drawn.indexOf(a), drawn.indexOf(groupB[bestIdx])];
          // Avoid duplicate pairs
          const exists = bondPairs.some(bp =>
            (bp[0] === pair[0] && bp[1] === pair[1]) || (bp[0] === pair[1] && bp[1] === pair[0]));
          if (!exists) bondPairs.push(pair);
        });
      }

      bondPairs.forEach(([ai, bi]) => {
        const a = drawn[ai], b = drawn[bi];
        const dx = b.drawX - a.drawX;
        const dy = b.drawY - a.drawY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxRad = 90 * atomScale;

        const midX = (a.drawX + b.drawX) / 2;
        const midY = (a.drawY + b.drawY) / 2;
        const overlapR = Math.max(8, maxRad * 0.6);
        ctx.globalAlpha = 0.12 * fadeIn;
        ctx.beginPath();
        ctx.arc(midX, midY, overlapR, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.globalAlpha = 1;

        // Shared electron pairs
        if (phase > 0.5) {
          const eFade = Math.min(1, (phase - 0.5) / 0.2);
          const pAngle = time * 0.5 + (ai + bi) * 1.3;
          const pr = 10 * atomScale;
          for (let d = -1; d <= 1; d += 2) {
            const ex = midX + Math.cos(pAngle) * pr;
            const ey = midY + Math.sin(pAngle) * pr + d * 3 * atomScale;
            ctx.globalAlpha = eFade;
            const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 5 * atomScale);
            grad.addColorStop(0, '#fbbf24cc');
            grad.addColorStop(1, '#fbbf2400');
            ctx.beginPath();
            ctx.arc(ex, ey, 5 * atomScale, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex, ey, 2 * atomScale, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      });
    }

    // Phase 0.7+: formula label
    if (phase > 0.7) {
      const fadeIn = Math.min(1, (phase - 0.7) / 0.3);
      ctx.globalAlpha = fadeIn;

      ctx.font = `bold ${Math.max(11, 14 * atomScale)}px system-ui`;
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('covalent bond', w / 2, h - 38);
      ctx.font = `bold ${Math.max(14, 18 * atomScale)}px system-ui`;
      ctx.fillStyle = '#fff';
      ctx.fillText(data.formula, w / 2, h - 16);

      ctx.globalAlpha = 1;
    }
  }

  function drawReaction(w, h) {
    const { positions, atomScale } = layoutReactionAtoms(w, h);

    if (reactionData.bondType === 'ionic') {
      drawIonicReaction(w, h, positions, atomScale);
    } else {
      drawCovalentReaction(w, h, positions, atomScale);
    }
  }

  return {
    init, setElement, setIsotope, setSpeed, setZoom,
    toggleLabels, toggleNucleusDetail,
    setIonMode, getIonMode, getIonTransition,
    setReaction, clearReaction, getReactionMode
  };
})();
