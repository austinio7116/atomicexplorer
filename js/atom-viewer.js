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

  /**
   * Draw ionic reaction: electrons arc from metal to non-metal.
   */
  function drawIonicReaction(w, h, cxA, cyA, cxB, cyB, scale) {
    const data = reactionData;
    const elA = data.elA; // metal
    const elB = data.elB; // non-metal
    const phase = reactionPhase;

    const shellsA = elA.shells;
    const shellsB = elB.shells;
    const outerA = shellsA[shellsA.length - 1];
    const maxRadA = 90 * scale;
    const coreRadA = 14 * scale;
    const outerRadA = coreRadA + maxRadA - coreRadA; // = maxRadA
    const maxRadB = 90 * scale;
    const coreRadB = 14 * scale;
    const outerRadB = maxRadB;

    const transferCount = Math.abs(data.chargeA);

    // Phase 0–0.3: both atoms neutral
    // Phase 0.3–0.7: electrons transfer
    // Phase 0.7–1.0: ions shown

    // Draw atom A (metal)
    drawAtomAtIonic(elA, cxA, cyA, scale, phase, 'metal', transferCount);
    // Draw atom B (non-metal)
    drawAtomAtIonic(elB, cxB, cyB, scale, phase, 'nonmetal', Math.abs(data.chargeB));

    // Transferring electrons (phase 0.3–0.7)
    if (phase > 0.3 && phase < 0.95) {
      const t = Math.min(1, (phase - 0.3) / 0.4); // 0→1 during transfer phase
      for (let i = 0; i < transferCount; i++) {
        const delay = i * 0.15;
        const ti = Math.max(0, Math.min(1, (t - delay) / (1 - delay * transferCount)));
        if (ti <= 0) continue;

        // Quadratic bezier from A outer shell to B outer shell
        const startAngle = (i / transferCount) * Math.PI * 2 + time * 0.3;
        const sx = cxA + Math.cos(startAngle) * outerRadA;
        const sy = cyA + Math.sin(startAngle) * outerRadA;
        const ex = cxB + Math.cos(Math.PI + startAngle) * outerRadB;
        const ey = cyB + Math.sin(Math.PI + startAngle) * outerRadB;
        const cpx = (cxA + cxB) / 2;
        const cpy = cyA - 50 * scale - i * 15 * scale;

        // Position along bezier
        const bx = (1-ti)*(1-ti)*sx + 2*(1-ti)*ti*cpx + ti*ti*ex;
        const by = (1-ti)*(1-ti)*sy + 2*(1-ti)*ti*cpy + ti*ti*ey;

        // Electron dot
        const color = '#fbbf24';
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, 8 * scale);
        grad.addColorStop(0, color + 'ff');
        grad.addColorStop(1, color + '00');
        ctx.beginPath();
        ctx.arc(bx, by, 8 * scale, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx, by, 3 * scale, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // Phase 0.7–1: show charges and formula
    if (phase > 0.7) {
      const fadeIn = Math.min(1, (phase - 0.7) / 0.3);
      ctx.globalAlpha = fadeIn;

      // Charge labels
      const chargeA = data.chargeA > 0 ? '+' + data.chargeA : '−' + Math.abs(data.chargeA);
      const chargeB = data.chargeB > 0 ? '+' + data.chargeB : '−' + Math.abs(data.chargeB);
      ctx.font = `bold ${14 * scale}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f87171';
      ctx.fillText(chargeA, cxA + 30 * scale, cyA - 90 * scale);
      ctx.fillStyle = '#60a5fa';
      ctx.fillText(chargeB, cxB + 30 * scale, cyB - 90 * scale);

      // Attraction indicator
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cxA + outerRadA + 5, cyA);
      ctx.lineTo(cxB - outerRadB - 5, cyB);
      ctx.strokeStyle = '#fbbf2480';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow
      const midX = (cxA + cxB) / 2;
      ctx.font = `bold ${14 * scale}px system-ui`;
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('⟶ ionic bond', midX, cyA + 110 * scale);

      // Formula
      ctx.font = `bold ${18 * scale}px system-ui`;
      ctx.fillStyle = '#fff';
      ctx.fillText(data.formula, midX, h - 20 * scale);

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
   * Draw covalent reaction: atoms move together and share electrons.
   */
  function drawCovalentReaction(w, h, cxA, cyA, cxB, cyB, scale) {
    const data = reactionData;
    const elA = data.elA;
    const elB = data.elB;
    const phase = reactionPhase;
    const sameElement = elA.number === elB.number;

    const maxRad = 90 * scale;

    // Phase 0.3–0.7: atoms move closer
    let moveT = 0;
    if (phase > 0.3) moveT = Math.min(1, (phase - 0.3) / 0.4);
    const overlap = 35 * scale * moveT;
    const axDraw = cxA + overlap;
    const bxDraw = cxB - overlap;

    // Draw atoms at adjusted positions
    drawAtomAt(elA, axDraw, cyA, scale);
    drawAtomAt(sameElement ? elA : elB, bxDraw, cyB, scale);

    // Phase 0.3+: overlap zone
    if (phase > 0.3) {
      const fadeIn = Math.min(1, (phase - 0.3) / 0.3);
      const midX = (axDraw + bxDraw) / 2;
      const midY = (cyA + cyB) / 2;
      const overlapW = Math.max(10, (axDraw + maxRad) - (bxDraw - maxRad));

      ctx.globalAlpha = 0.15 * fadeIn;
      ctx.beginPath();
      ctx.ellipse(midX, midY, overlapW / 2 + 10 * scale, maxRad * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.globalAlpha = 1;

      // Shared electrons in overlap
      if (phase > 0.5) {
        const eFade = Math.min(1, (phase - 0.5) / 0.2);
        const pairsToShow = data.electronsPaired || 1;
        for (let p = 0; p < pairsToShow; p++) {
          const pAngle = time * 0.5 + (p / pairsToShow) * Math.PI * 2;
          const pr = 15 * scale;
          // Two electrons per pair
          for (let d = -1; d <= 1; d += 2) {
            const ex = midX + Math.cos(pAngle) * pr;
            const ey = midY + Math.sin(pAngle) * pr + d * 4 * scale;
            ctx.globalAlpha = eFade;
            const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 6 * scale);
            grad.addColorStop(0, '#fbbf24cc');
            grad.addColorStop(1, '#fbbf2400');
            ctx.beginPath();
            ctx.arc(ex, ey, 6 * scale, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex, ey, 2.5 * scale, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // Phase 0.7+: formula label
    if (phase > 0.7) {
      const fadeIn = Math.min(1, (phase - 0.7) / 0.3);
      ctx.globalAlpha = fadeIn;
      const midX = (axDraw + bxDraw) / 2;

      ctx.font = `bold ${14 * scale}px system-ui`;
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('⟶ covalent bond', midX, cyA + 110 * scale);

      ctx.font = `bold ${18 * scale}px system-ui`;
      ctx.fillStyle = '#fff';
      ctx.fillText(data.formula, midX, h - 20 * scale);

      ctx.globalAlpha = 1;
    }
  }

  function drawReaction(w, h) {
    const scale = Math.min(w, h) / 400;
    const cxA = w * 0.28;
    const cxB = w * 0.72;
    const cy = h / 2;

    if (reactionData.bondType === 'ionic') {
      drawIonicReaction(w, h, cxA, cy, cxB, cy, scale);
    } else {
      drawCovalentReaction(w, h, cxA, cy, cxB, cy, scale);
    }
  }

  return {
    init, setElement, setIsotope, setSpeed, setZoom,
    toggleLabels, toggleNucleusDetail,
    setIonMode, getIonMode, getIonTransition,
    setReaction, clearReaction, getReactionMode
  };
})();
