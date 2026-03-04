/**
 * GCSE Reaction Mode — analyses how two elements combine.
 * Determines bond type (ionic / covalent), atom ratio, formula,
 * and generates plain-English insight cards.
 */

const Reaction = (() => {

  const SUBSCRIPT = { 0:'₀',1:'₁',2:'₂',3:'₃',4:'₄',5:'₅',6:'₆',7:'₇',8:'₈',9:'₉' };
  function toSubscript(n) {
    return n <= 1 ? '' : String(n).split('').map(d => SUBSCRIPT[d] || d).join('');
  }

  // Elements supported at GCSE level for reactions
  function isMetal(el) {
    return el.category === 'alkali-metal' ||
           el.category === 'alkaline-earth' ||
           (el.number === 13); // Al
  }

  function isNonmetal(el) {
    return el.category === 'nonmetal' ||
           el.category === 'halogen' ||
           (el.number === 1); // H can act as non-metal in covalent
  }

  /**
   * Can these two elements react at GCSE level?
   * Returns { ok: true } or { ok: false, reason: '...' }
   */
  function canReact(a, b) {
    if (a.number === b.number) {
      // Same element — only allow non-metals (H₂, O₂, N₂, Cl₂ etc)
      if (!isNonmetal(a)) return { ok: false, reason: `${a.name} doesn't bond with itself at GCSE level.` };
      return { ok: true };
    }
    if (a.category === 'noble-gas' || b.category === 'noble-gas') {
      return { ok: false, reason: 'Noble gases have full outer shells — they don\'t react.' };
    }
    if (a.category === 'transition-metal' || b.category === 'transition-metal') {
      return { ok: false, reason: 'Transition metals have variable charges — covered at A-level.' };
    }
    if (a.category === 'lanthanide' || b.category === 'lanthanide' ||
        a.category === 'actinide'   || b.category === 'actinide') {
      return { ok: false, reason: 'Lanthanides and actinides are beyond GCSE scope.' };
    }
    if (a.category === 'unknown' || b.category === 'unknown') {
      return { ok: false, reason: 'Not enough is known about this element to model the reaction.' };
    }

    // Need at least one metal + one non-metal (ionic) or two non-metals (covalent)
    const aM = isMetal(a), bM = isMetal(b);
    const aN = isNonmetal(a), bN = isNonmetal(b);

    if (aM && bM) return { ok: false, reason: 'Two metals form alloys, not simple compounds at GCSE level.' };
    if (!(aM || aN) || !(bM || bN)) {
      return { ok: false, reason: `${!aM && !aN ? a.name : b.name} doesn't form simple GCSE-level compounds.` };
    }
    return { ok: true };
  }

  /**
   * Check if an element can participate in ANY GCSE reaction.
   * Used to decide if the "React With…" button is enabled.
   */
  function canReactAtAll(el) {
    if (el.category === 'noble-gas') return { ok: false, reason: 'Full outer shell — no reaction.' };
    if (el.category === 'transition-metal') return { ok: false, reason: 'Transition metals have variable charges — covered at A-level.' };
    if (el.category === 'lanthanide' || el.category === 'actinide') return { ok: false, reason: 'Beyond GCSE scope.' };
    if (el.category === 'unknown') return { ok: false, reason: 'Not enough is known about this element.' };
    // metalloids other than Al: limited
    if (el.category === 'metalloid') return { ok: false, reason: `${el.name} has complex bonding — covered at A-level.` };
    // post-transition metals other than Al
    if (el.category === 'post-transition' && el.number !== 13) return { ok: false, reason: `${el.name} has complex bonding — covered at A-level.` };
    return { ok: true };
  }

  /**
   * Compute reaction data for two elements.
   * Returns { bondType, formula, ratioA, ratioB, chargeA, chargeB, electronsTransferred, electronsPaired }
   */
  function getReactionData(a, b) {
    const aM = isMetal(a), bM = isMetal(b);

    // Ensure metal is first for ionic bonds
    let elA = a, elB = b;
    if (bM && !aM) { elA = b; elB = a; }

    const infoA = getOuterShellInfo(elA);
    const infoB = getOuterShellInfo(elB);

    const chargeA = Behaviour.getLikelyIonCharge(elA);
    const chargeB = Behaviour.getLikelyIonCharge(elB);

    const bondType = (isMetal(elA) && isNonmetal(elB)) ? 'ionic' : 'covalent';

    let ratioA, ratioB, formula, electronsTransferred, electronsPaired;

    if (bondType === 'ionic') {
      // Cross-multiply charges to get ratio
      const absA = Math.abs(chargeA);
      const absB = Math.abs(chargeB);
      ratioA = absB;
      ratioB = absA;
      // Simplify
      const g = gcd(ratioA, ratioB);
      ratioA /= g;
      ratioB /= g;
      electronsTransferred = absA * ratioA; // total electrons moved
      formula = elA.symbol + toSubscript(ratioA) + elB.symbol + toSubscript(ratioB);
    } else {
      // Covalent: same element pairing or non-metal + non-metal
      if (elA.number === elB.number) {
        // Diatomic: H₂, O₂, N₂, Cl₂, etc.
        ratioA = 2;
        ratioB = 0; // no second element
        electronsPaired = getOuterNeed(elA);
        formula = elA.symbol + '₂';
      } else {
        // Two different non-metals: cross-multiply needs
        const needA = getOuterNeed(elA);
        const needB = getOuterNeed(elB);
        ratioA = needB;
        ratioB = needA;
        const g = gcd(ratioA, ratioB);
        ratioA /= g;
        ratioB /= g;
        electronsPaired = needA * ratioA;
        formula = elA.symbol + toSubscript(ratioA) + elB.symbol + toSubscript(ratioB);
      }
    }

    return { bondType, formula, ratioA, ratioB, chargeA, chargeB, electronsTransferred, electronsPaired, elA, elB };
  }

  function getOuterNeed(el) {
    const info = getOuterShellInfo(el);
    // For H: needs 1 to fill shell of 2
    const gap = info.maxOuterElectrons - info.outerElectrons;
    // For metals with few outer electrons, they "need" to share those
    if (gap > 4) return info.outerElectrons; // shares its electrons
    return gap;
  }

  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

  /**
   * Generate insight cards for a reaction.
   */
  function getReactionInsights(data) {
    const { bondType, formula, ratioA, ratioB, chargeA, chargeB, elA, elB } = data;
    const insights = [];

    if (bondType === 'ionic') {
      insights.push({
        icon: '⚡',
        title: 'Ionic bond — electron transfer',
        text: `${elA.name} is a metal and ${elB.name} is a non-metal. ` +
              `${elA.name} transfers its outer electron${Math.abs(chargeA) !== 1 ? 's' : ''} to ${elB.name}. ` +
              `This is called ionic bonding.`,
        topic: 'reactivity'
      });

      insights.push({
        icon: '🔋',
        title: 'Why transfer?',
        text: `${elA.name} has ${getOuterShellInfo(elA).outerElectrons} outer electron${getOuterShellInfo(elA).outerElectrons !== 1 ? 's' : ''} — ` +
              `it's easier to lose ${Math.abs(chargeA) === 1 ? 'it' : 'them'} than gain ${getOuterShellInfo(elA).maxOuterElectrons - getOuterShellInfo(elA).outerElectrons}. ` +
              `${elB.name} needs ${Math.abs(chargeB)} more for a full shell — so it takes ${elA.name}'s electron${Math.abs(chargeA) !== 1 ? 's' : ''}.`,
        topic: 'ions'
      });

      if (ratioA !== 1 || ratioB !== 1) {
        insights.push({
          icon: '⚖',
          title: `Ratio: ${ratioA} ${elA.name} : ${ratioB} ${elB.name}`,
          text: `${elA.name} loses ${Math.abs(chargeA)} electron${Math.abs(chargeA) !== 1 ? 's' : ''} but ${elB.name} only needs ${Math.abs(chargeB)}. ` +
                `You need ${ratioA} ${elA.symbol} for every ${ratioB} ${elB.symbol} so the charges balance out.`,
          topic: 'neutrons'
        });
      } else {
        insights.push({
          icon: '⚖',
          title: 'Ratio: 1 : 1',
          text: `${elA.name} loses ${Math.abs(chargeA)} electron${Math.abs(chargeA) !== 1 ? 's' : ''} and ` +
                `${elB.name} gains ${Math.abs(chargeB)} — a perfect 1 : 1 match.`,
          topic: 'neutrons'
        });
      }

      const ionSymA = Behaviour.getIonSymbol(elA);
      const ionSymB = Behaviour.getIonSymbol(elB);
      insights.push({
        icon: '🧪',
        title: `Product: ${formula}`,
        text: `The result is ${formula} — made of ${ionSymA || elA.symbol} and ${ionSymB || elB.symbol} ions ` +
              `held together by the attraction between their opposite charges.`,
        topic: 'trends'
      });

    } else {
      // Covalent
      const sameElement = elA.number === elB.number;

      insights.push({
        icon: '⚡',
        title: 'Covalent bond — electron sharing',
        text: sameElement
          ? `Both atoms are ${elA.name} (a non-metal). Neither can take electrons from the other, so they share electrons instead.`
          : `${elA.name} and ${elB.name} are both non-metals. Neither is strong enough to completely take electrons from the other, so they share.`,
        topic: 'reactivity'
      });

      const needA = getOuterNeed(elA);
      const needB = sameElement ? needA : getOuterNeed(elB);
      insights.push({
        icon: '🔋',
        title: 'Why sharing?',
        text: sameElement
          ? `Each ${elA.name} atom needs ${needA} more electron${needA !== 1 ? 's' : ''} for a full outer shell. ` +
            `By sharing ${needA} pair${needA !== 1 ? 's' : ''}, both atoms achieve a full shell.`
          : `${elA.name} needs ${needA} more and ${elB.name} needs ${needB} more for full outer shells. ` +
            `Sharing lets both fill their shells without any atom completely losing electrons.`,
        topic: 'ions'
      });

      if (!sameElement && (ratioA !== 1 || ratioB !== 1)) {
        insights.push({
          icon: '⚖',
          title: `Ratio: ${ratioA} ${elA.name} : ${ratioB} ${elB.name}`,
          text: `${elA.name} needs ${needA} electron${needA !== 1 ? 's' : ''} and ${elB.name} needs ${needB}. ` +
                `You need ${ratioA} ${elA.symbol} for every ${ratioB} ${elB.symbol} for all atoms to have full shells.`,
          topic: 'neutrons'
        });
      }

      insights.push({
        icon: '🧪',
        title: `Product: ${formula}`,
        text: sameElement
          ? `${formula} is a molecule of two ${elA.name} atoms sharing electrons. ` +
            `Many non-metals exist as diatomic molecules like this.`
          : `${formula} is a covalent molecule where the atoms are held together by shared pairs of electrons.`,
        topic: 'trends'
      });
    }

    return insights;
  }

  /**
   * Filter function for pick mode — returns true if element b can react with element a.
   */
  function makePickFilter(a) {
    return (b) => canReact(a, b).ok;
  }

  return { canReact, canReactAtAll, getReactionData, getReactionInsights, makePickFilter };
})();
