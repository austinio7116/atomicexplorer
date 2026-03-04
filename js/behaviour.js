/**
 * GCSE-level educational insight engine.
 * Generates plain-English explanations of element behaviour
 * derived from atomic structure data.
 */

const Behaviour = (() => {

  /**
   * Generate all insight cards for a given element.
   * Returns an array of { icon, title, text, topic } objects.
   */
  function getInsights(element) {
    const insights = [];
    const group = getGroup(element);
    const info = getOuterShellInfo(element);
    const totalElectrons = element.shells.reduce((a, b) => a + b, 0);

    // 1. What makes this element?
    insights.push({
      icon: '⚛',
      title: 'What makes it ' + element.name + '?',
      text: `It has ${element.number} proton${element.number !== 1 ? 's' : ''} in the nucleus. ` +
            `The number of protons defines the element — change the protons, and it becomes a completely different element.`,
      topic: 'identity'
    });

    // 2. Reactivity / outer shell behaviour
    const reactivityInsight = getReactivityInsight(element, info, group);
    if (reactivityInsight) {
      insights.push(reactivityInsight);
    }

    // 3. Ion formation
    const ionInsight = getIonInsight(element, info, group);
    if (ionInsight) {
      insights.push(ionInsight);
    }

    // 4. What about the neutrons?
    insights.push({
      icon: '⚖',
      title: 'What about the neutrons?',
      text: `${element.name} has ${element.isotopes.length} isotope${element.isotopes.length !== 1 ? 's' : ''}. ` +
            `Different isotopes have different numbers of neutrons, but the same electrons — so they react in exactly the same way. ` +
            `Neutrons only affect the mass and nuclear stability.`,
      topic: 'neutrons'
    });

    // 5. Group trend hint
    const groupInsight = getGroupInsight(element, info, group);
    if (groupInsight) {
      insights.push(groupInsight);
    }

    return insights;
  }

  function getReactivityInsight(element, info, group) {
    const { outerElectrons, maxOuterElectrons } = info;
    const gap = maxOuterElectrons - outerElectrons;

    // Noble gases — full outer shell
    if (element.category === 'noble-gas') {
      return {
        icon: '🛡',
        title: 'Why is it unreactive?',
        text: `${element.name} has a full outer shell (${outerElectrons} electron${outerElectrons !== 1 ? 's' : ''}). ` +
              `It doesn't need to gain or lose any electrons, so it's very stable and unreactive.`,
        topic: 'reactivity'
      };
    }

    // Hydrogen special case
    if (element.number === 1) {
      return {
        icon: '⚡',
        title: 'Why does it react like that?',
        text: `Hydrogen has just 1 electron in its outer shell, which can hold 2. ` +
              `It can either share or lose this electron — which is why hydrogen is so versatile in reactions.`,
        topic: 'reactivity'
      };
    }

    // Transition metals / lanthanides / actinides — complex behaviour
    if (element.category === 'transition-metal' || element.category === 'lanthanide' || element.category === 'actinide') {
      return {
        icon: '⚡',
        title: 'Why does it react like that?',
        text: `${element.name} has ${outerElectrons} outer electron${outerElectrons !== 1 ? 's' : ''} but also uses inner shell electrons in reactions. ` +
              `This is why transition metals can form ions with different charges (e.g. Fe²⁺ and Fe³⁺).`,
        topic: 'reactivity'
      };
    }

    // Metals (groups 1-3) tend to lose electrons
    if (outerElectrons <= 3 && outerElectrons > 0) {
      return {
        icon: '⚡',
        title: 'Why does it react like that?',
        text: `${element.name} has ${outerElectrons} outer electron${outerElectrons !== 1 ? 's' : ''} out of ${maxOuterElectrons}. ` +
              `It's much easier to lose ${outerElectrons} than to gain ${gap}, ` +
              `so it loses ${outerElectrons === 1 ? 'it' : 'them'} to get a full outer shell.`,
        topic: 'reactivity'
      };
    }

    // Non-metals (groups 15-17) tend to gain electrons
    if (gap > 0 && gap <= 3) {
      return {
        icon: '⚡',
        title: 'Why does it react like that?',
        text: `${element.name} has ${outerElectrons} outer electrons — it only needs ${gap} more for a full shell of ${maxOuterElectrons}. ` +
              `It's easier to gain ${gap} than to lose ${outerElectrons}, so it gains electron${gap !== 1 ? 's' : ''} in reactions.`,
        topic: 'reactivity'
      };
    }

    // Middle ground (group 14 / metalloids)
    if (outerElectrons === 4) {
      return {
        icon: '⚡',
        title: 'Why does it react like that?',
        text: `${element.name} has ${outerElectrons} outer electrons — exactly half a full shell. ` +
              `It's equally hard to gain or lose 4 electrons, so it tends to share electrons instead (covalent bonding).`,
        topic: 'reactivity'
      };
    }

    return null;
  }

  function getIonInsight(element, info, group) {
    const { outerElectrons, maxOuterElectrons } = info;
    const gap = maxOuterElectrons - outerElectrons;

    // Noble gases don't form ions
    if (element.category === 'noble-gas') return null;

    // Transition metals — variable ions
    if (element.category === 'transition-metal') {
      return {
        icon: '🔋',
        title: 'Ion formation',
        text: `Transition metals like ${element.name} can form ions with different charges because they can lose different numbers of electrons from both their outer and inner shells.`,
        topic: 'ions'
      };
    }

    // Lanthanides/actinides
    if (element.category === 'lanthanide' || element.category === 'actinide') {
      return {
        icon: '🔋',
        title: 'Ion formation',
        text: `${element.name} typically forms a 3+ ion by losing electrons from its outer shells. The chemistry of these elements is complex.`,
        topic: 'ions'
      };
    }

    // Metals losing electrons
    if (outerElectrons <= 3 && outerElectrons > 0) {
      const charge = outerElectrons;
      const chargeStr = charge === 1 ? '⁺' : `${toSuperscript(charge)}⁺`;
      return {
        icon: '🔋',
        title: 'Ion formation',
        text: `${element.name} loses ${outerElectrons} electron${outerElectrons !== 1 ? 's' : ''} → ${element.symbol}${chargeStr} ion. ` +
              `It now has more protons (+) than electrons (−), giving it a ${charge}+ charge.`,
        topic: 'ions'
      };
    }

    // Non-metals gaining electrons
    if (gap > 0 && gap <= 3) {
      const charge = gap;
      const chargeStr = charge === 1 ? '⁻' : `${toSuperscript(charge)}⁻`;
      return {
        icon: '🔋',
        title: 'Ion formation',
        text: `${element.name} gains ${gap} electron${gap !== 1 ? 's' : ''} → ${element.symbol}${chargeStr} ion. ` +
              `It now has more electrons (−) than protons (+), giving it a ${charge}− charge.`,
        topic: 'ions'
      };
    }

    // 4 outer electrons — covalent, no typical ion
    if (outerElectrons === 4) {
      return {
        icon: '🔋',
        title: 'Bonding',
        text: `${element.name} usually shares electrons (covalent bonding) rather than forming ions, because losing or gaining 4 electrons would take too much energy.`,
        topic: 'ions'
      };
    }

    return null;
  }

  function getGroupInsight(element, info, group) {
    if (group === null) return null;

    const groupNames = {
      1: 'Group 1 (alkali metals)',
      2: 'Group 2 (alkaline earth metals)',
      17: 'Group 7 (halogens)',
      18: 'Group 0 (noble gases)'
    };

    // Only show group trend for main groups with clear patterns
    if (group === 1 && element.number > 1) {
      return {
        icon: '📊',
        title: 'Group trend',
        text: `${element.name} is in ${groupNames[1]}. All alkali metals have 1 outer electron, so they react similarly — but reactivity increases going down the group because the outer electron is further from the nucleus and easier to lose.`,
        topic: 'trends'
      };
    }

    if (group === 2) {
      return {
        icon: '📊',
        title: 'Group trend',
        text: `${element.name} is in ${groupNames[2]}. All have 2 outer electrons and react by losing both. Reactivity increases down the group — the electrons are further from the nucleus and easier to remove.`,
        topic: 'trends'
      };
    }

    if (group === 17) {
      return {
        icon: '📊',
        title: 'Group trend',
        text: `${element.name} is in ${groupNames[17]}. All halogens have 7 outer electrons and need 1 more for a full shell. Reactivity decreases down the group — the outer shell is further from the nucleus, making it harder to attract an extra electron.`,
        topic: 'trends'
      };
    }

    if (group === 18) {
      return {
        icon: '📊',
        title: 'Group trend',
        text: `${element.name} is in ${groupNames[18]}. All noble gases have full outer shells, making them very stable and unreactive.`,
        topic: 'trends'
      };
    }

    return null;
  }

  /**
   * Get the likely ion charge for an element (for the charge bar).
   * Returns the number of electrons gained (negative) or lost (positive), or 0 if no typical ion.
   */
  function getLikelyIonCharge(element) {
    if (element.category === 'noble-gas') return 0;
    if (element.category === 'transition-metal' || element.category === 'lanthanide' || element.category === 'actinide') return 0;

    const info = getOuterShellInfo(element);
    const { outerElectrons, maxOuterElectrons } = info;
    const gap = maxOuterElectrons - outerElectrons;

    if (outerElectrons <= 3 && outerElectrons > 0) return outerElectrons;    // loses electrons → positive
    if (gap <= 3 && gap > 0) return -gap;                                     // gains electrons → negative
    return 0;
  }

  /**
   * Format ion charge for display: +1, +2, -1, -2, etc.
   */
  function formatCharge(charge) {
    if (charge === 0) return '0';
    if (charge === 1) return '+1';
    if (charge === -1) return '−1';
    if (charge > 0) return '+' + charge;
    return '−' + Math.abs(charge);
  }

  /**
   * Get ion symbol with charge, e.g. Na⁺, Cl⁻, Mg²⁺
   */
  function getIonSymbol(element) {
    const charge = getLikelyIonCharge(element);
    if (charge === 0) return null;
    const absCharge = Math.abs(charge);
    const sign = charge > 0 ? '⁺' : '⁻';
    const num = absCharge === 1 ? '' : toSuperscript(absCharge);
    return element.symbol + num + sign;
  }

  function toSuperscript(n) {
    const map = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
    return String(n).split('').map(d => map[d] || d).join('');
  }

  return { getInsights, getLikelyIonCharge, formatCharge, getIonSymbol };
})();
