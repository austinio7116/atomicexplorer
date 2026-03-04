/**
 * Periodic table element data.
 * Each element has: number, symbol, name, mass, category, electronConfig,
 * shells (electrons per shell), electronegativity, state at STP,
 * gridRow/gridCol for table placement, and isotopes array.
 */

const CATEGORIES = {
  'alkali-metal':       { label: 'Alkali Metal',       color: '#f87171' },
  'alkaline-earth':     { label: 'Alkaline Earth',     color: '#fb923c' },
  'transition-metal':   { label: 'Transition Metal',   color: '#fbbf24' },
  'post-transition':    { label: 'Post-Transition',    color: '#a3e635' },
  'metalloid':          { label: 'Metalloid',          color: '#34d399' },
  'nonmetal':           { label: 'Nonmetal',           color: '#22d3ee' },
  'halogen':            { label: 'Halogen',            color: '#60a5fa' },
  'noble-gas':          { label: 'Noble Gas',          color: '#a78bfa' },
  'lanthanide':         { label: 'Lanthanide',         color: '#f472b6' },
  'actinide':           { label: 'Actinide',           color: '#fb7185' },
  'unknown':            { label: 'Unknown',            color: '#64748b' },
};

// Isotope format: [massNumber, name (optional), stable (bool)]
const ELEMENTS = [
  {
    number: 1, symbol: 'H', name: 'Hydrogen', mass: 1.008,
    category: 'nonmetal', electronConfig: '1s¹', shells: [1],
    electronegativity: 2.20, state: 'Gas', gridRow: 1, gridCol: 1,
    isotopes: [[1, 'Protium', true], [2, 'Deuterium', true], [3, 'Tritium', false]]
  },
  {
    number: 2, symbol: 'He', name: 'Helium', mass: 4.003,
    category: 'noble-gas', electronConfig: '1s²', shells: [2],
    electronegativity: null, state: 'Gas', gridRow: 1, gridCol: 18,
    isotopes: [[3, 'Helium-3', true], [4, 'Helium-4', true]]
  },
  {
    number: 3, symbol: 'Li', name: 'Lithium', mass: 6.941,
    category: 'alkali-metal', electronConfig: '[He] 2s¹', shells: [2, 1],
    electronegativity: 0.98, state: 'Solid', gridRow: 2, gridCol: 1,
    isotopes: [[6, 'Lithium-6', true], [7, 'Lithium-7', true]]
  },
  {
    number: 4, symbol: 'Be', name: 'Beryllium', mass: 9.012,
    category: 'alkaline-earth', electronConfig: '[He] 2s²', shells: [2, 2],
    electronegativity: 1.57, state: 'Solid', gridRow: 2, gridCol: 2,
    isotopes: [[9, 'Beryllium-9', true]]
  },
  {
    number: 5, symbol: 'B', name: 'Boron', mass: 10.81,
    category: 'metalloid', electronConfig: '[He] 2s² 2p¹', shells: [2, 3],
    electronegativity: 2.04, state: 'Solid', gridRow: 2, gridCol: 13,
    isotopes: [[10, 'Boron-10', true], [11, 'Boron-11', true]]
  },
  {
    number: 6, symbol: 'C', name: 'Carbon', mass: 12.011,
    category: 'nonmetal', electronConfig: '[He] 2s² 2p²', shells: [2, 4],
    electronegativity: 2.55, state: 'Solid', gridRow: 2, gridCol: 14,
    isotopes: [[12, 'Carbon-12', true], [13, 'Carbon-13', true], [14, 'Carbon-14', false]]
  },
  {
    number: 7, symbol: 'N', name: 'Nitrogen', mass: 14.007,
    category: 'nonmetal', electronConfig: '[He] 2s² 2p³', shells: [2, 5],
    electronegativity: 3.04, state: 'Gas', gridRow: 2, gridCol: 15,
    isotopes: [[14, 'Nitrogen-14', true], [15, 'Nitrogen-15', true]]
  },
  {
    number: 8, symbol: 'O', name: 'Oxygen', mass: 15.999,
    category: 'nonmetal', electronConfig: '[He] 2s² 2p⁴', shells: [2, 6],
    electronegativity: 3.44, state: 'Gas', gridRow: 2, gridCol: 16,
    isotopes: [[16, 'Oxygen-16', true], [17, 'Oxygen-17', true], [18, 'Oxygen-18', true]]
  },
  {
    number: 9, symbol: 'F', name: 'Fluorine', mass: 18.998,
    category: 'halogen', electronConfig: '[He] 2s² 2p⁵', shells: [2, 7],
    electronegativity: 3.98, state: 'Gas', gridRow: 2, gridCol: 17,
    isotopes: [[19, 'Fluorine-19', true]]
  },
  {
    number: 10, symbol: 'Ne', name: 'Neon', mass: 20.180,
    category: 'noble-gas', electronConfig: '[He] 2s² 2p⁶', shells: [2, 8],
    electronegativity: null, state: 'Gas', gridRow: 2, gridCol: 18,
    isotopes: [[20, 'Neon-20', true], [21, 'Neon-21', true], [22, 'Neon-22', true]]
  },
  {
    number: 11, symbol: 'Na', name: 'Sodium', mass: 22.990,
    category: 'alkali-metal', electronConfig: '[Ne] 3s¹', shells: [2, 8, 1],
    electronegativity: 0.93, state: 'Solid', gridRow: 3, gridCol: 1,
    isotopes: [[23, 'Sodium-23', true]]
  },
  {
    number: 12, symbol: 'Mg', name: 'Magnesium', mass: 24.305,
    category: 'alkaline-earth', electronConfig: '[Ne] 3s²', shells: [2, 8, 2],
    electronegativity: 1.31, state: 'Solid', gridRow: 3, gridCol: 2,
    isotopes: [[24, 'Mg-24', true], [25, 'Mg-25', true], [26, 'Mg-26', true]]
  },
  {
    number: 13, symbol: 'Al', name: 'Aluminium', mass: 26.982,
    category: 'post-transition', electronConfig: '[Ne] 3s² 3p¹', shells: [2, 8, 3],
    electronegativity: 1.61, state: 'Solid', gridRow: 3, gridCol: 13,
    isotopes: [[27, 'Al-27', true]]
  },
  {
    number: 14, symbol: 'Si', name: 'Silicon', mass: 28.086,
    category: 'metalloid', electronConfig: '[Ne] 3s² 3p²', shells: [2, 8, 4],
    electronegativity: 1.90, state: 'Solid', gridRow: 3, gridCol: 14,
    isotopes: [[28, 'Si-28', true], [29, 'Si-29', true], [30, 'Si-30', true]]
  },
  {
    number: 15, symbol: 'P', name: 'Phosphorus', mass: 30.974,
    category: 'nonmetal', electronConfig: '[Ne] 3s² 3p³', shells: [2, 8, 5],
    electronegativity: 2.19, state: 'Solid', gridRow: 3, gridCol: 15,
    isotopes: [[31, 'P-31', true]]
  },
  {
    number: 16, symbol: 'S', name: 'Sulfur', mass: 32.06,
    category: 'nonmetal', electronConfig: '[Ne] 3s² 3p⁴', shells: [2, 8, 6],
    electronegativity: 2.58, state: 'Solid', gridRow: 3, gridCol: 16,
    isotopes: [[32, 'S-32', true], [33, 'S-33', true], [34, 'S-34', true], [36, 'S-36', true]]
  },
  {
    number: 17, symbol: 'Cl', name: 'Chlorine', mass: 35.45,
    category: 'halogen', electronConfig: '[Ne] 3s² 3p⁵', shells: [2, 8, 7],
    electronegativity: 3.16, state: 'Gas', gridRow: 3, gridCol: 17,
    isotopes: [[35, 'Cl-35', true], [37, 'Cl-37', true]]
  },
  {
    number: 18, symbol: 'Ar', name: 'Argon', mass: 39.948,
    category: 'noble-gas', electronConfig: '[Ne] 3s² 3p⁶', shells: [2, 8, 8],
    electronegativity: null, state: 'Gas', gridRow: 3, gridCol: 18,
    isotopes: [[36, 'Ar-36', true], [38, 'Ar-38', true], [40, 'Ar-40', true]]
  },
  // Period 4
  {
    number: 19, symbol: 'K', name: 'Potassium', mass: 39.098,
    category: 'alkali-metal', electronConfig: '[Ar] 4s¹', shells: [2, 8, 8, 1],
    electronegativity: 0.82, state: 'Solid', gridRow: 4, gridCol: 1,
    isotopes: [[39, 'K-39', true], [40, 'K-40', false], [41, 'K-41', true]]
  },
  {
    number: 20, symbol: 'Ca', name: 'Calcium', mass: 40.078,
    category: 'alkaline-earth', electronConfig: '[Ar] 4s²', shells: [2, 8, 8, 2],
    electronegativity: 1.00, state: 'Solid', gridRow: 4, gridCol: 2,
    isotopes: [[40, 'Ca-40', true], [42, 'Ca-42', true], [44, 'Ca-44', true]]
  },
  {
    number: 21, symbol: 'Sc', name: 'Scandium', mass: 44.956,
    category: 'transition-metal', electronConfig: '[Ar] 3d¹ 4s²', shells: [2, 8, 9, 2],
    electronegativity: 1.36, state: 'Solid', gridRow: 4, gridCol: 3,
    isotopes: [[45, 'Sc-45', true]]
  },
  {
    number: 22, symbol: 'Ti', name: 'Titanium', mass: 47.867,
    category: 'transition-metal', electronConfig: '[Ar] 3d² 4s²', shells: [2, 8, 10, 2],
    electronegativity: 1.54, state: 'Solid', gridRow: 4, gridCol: 4,
    isotopes: [[46, 'Ti-46', true], [47, 'Ti-47', true], [48, 'Ti-48', true], [49, 'Ti-49', true]]
  },
  {
    number: 23, symbol: 'V', name: 'Vanadium', mass: 50.942,
    category: 'transition-metal', electronConfig: '[Ar] 3d³ 4s²', shells: [2, 8, 11, 2],
    electronegativity: 1.63, state: 'Solid', gridRow: 4, gridCol: 5,
    isotopes: [[50, 'V-50', false], [51, 'V-51', true]]
  },
  {
    number: 24, symbol: 'Cr', name: 'Chromium', mass: 51.996,
    category: 'transition-metal', electronConfig: '[Ar] 3d⁵ 4s¹', shells: [2, 8, 13, 1],
    electronegativity: 1.66, state: 'Solid', gridRow: 4, gridCol: 6,
    isotopes: [[50, 'Cr-50', true], [52, 'Cr-52', true], [53, 'Cr-53', true], [54, 'Cr-54', true]]
  },
  {
    number: 25, symbol: 'Mn', name: 'Manganese', mass: 54.938,
    category: 'transition-metal', electronConfig: '[Ar] 3d⁵ 4s²', shells: [2, 8, 13, 2],
    electronegativity: 1.55, state: 'Solid', gridRow: 4, gridCol: 7,
    isotopes: [[55, 'Mn-55', true]]
  },
  {
    number: 26, symbol: 'Fe', name: 'Iron', mass: 55.845,
    category: 'transition-metal', electronConfig: '[Ar] 3d⁶ 4s²', shells: [2, 8, 14, 2],
    electronegativity: 1.83, state: 'Solid', gridRow: 4, gridCol: 8,
    isotopes: [[54, 'Fe-54', true], [56, 'Fe-56', true], [57, 'Fe-57', true], [58, 'Fe-58', true]]
  },
  {
    number: 27, symbol: 'Co', name: 'Cobalt', mass: 58.933,
    category: 'transition-metal', electronConfig: '[Ar] 3d⁷ 4s²', shells: [2, 8, 15, 2],
    electronegativity: 1.88, state: 'Solid', gridRow: 4, gridCol: 9,
    isotopes: [[59, 'Co-59', true]]
  },
  {
    number: 28, symbol: 'Ni', name: 'Nickel', mass: 58.693,
    category: 'transition-metal', electronConfig: '[Ar] 3d⁸ 4s²', shells: [2, 8, 16, 2],
    electronegativity: 1.91, state: 'Solid', gridRow: 4, gridCol: 10,
    isotopes: [[58, 'Ni-58', true], [60, 'Ni-60', true], [61, 'Ni-61', true], [62, 'Ni-62', true]]
  },
  {
    number: 29, symbol: 'Cu', name: 'Copper', mass: 63.546,
    category: 'transition-metal', electronConfig: '[Ar] 3d¹⁰ 4s¹', shells: [2, 8, 18, 1],
    electronegativity: 1.90, state: 'Solid', gridRow: 4, gridCol: 11,
    isotopes: [[63, 'Cu-63', true], [65, 'Cu-65', true]]
  },
  {
    number: 30, symbol: 'Zn', name: 'Zinc', mass: 65.38,
    category: 'transition-metal', electronConfig: '[Ar] 3d¹⁰ 4s²', shells: [2, 8, 18, 2],
    electronegativity: 1.65, state: 'Solid', gridRow: 4, gridCol: 12,
    isotopes: [[64, 'Zn-64', true], [66, 'Zn-66', true], [68, 'Zn-68', true]]
  },
  {
    number: 31, symbol: 'Ga', name: 'Gallium', mass: 69.723,
    category: 'post-transition', electronConfig: '[Ar] 3d¹⁰ 4s² 4p¹', shells: [2, 8, 18, 3],
    electronegativity: 1.81, state: 'Solid', gridRow: 4, gridCol: 13,
    isotopes: [[69, 'Ga-69', true], [71, 'Ga-71', true]]
  },
  {
    number: 32, symbol: 'Ge', name: 'Germanium', mass: 72.63,
    category: 'metalloid', electronConfig: '[Ar] 3d¹⁰ 4s² 4p²', shells: [2, 8, 18, 4],
    electronegativity: 2.01, state: 'Solid', gridRow: 4, gridCol: 14,
    isotopes: [[70, 'Ge-70', true], [72, 'Ge-72', true], [74, 'Ge-74', true]]
  },
  {
    number: 33, symbol: 'As', name: 'Arsenic', mass: 74.922,
    category: 'metalloid', electronConfig: '[Ar] 3d¹⁰ 4s² 4p³', shells: [2, 8, 18, 5],
    electronegativity: 2.18, state: 'Solid', gridRow: 4, gridCol: 15,
    isotopes: [[75, 'As-75', true]]
  },
  {
    number: 34, symbol: 'Se', name: 'Selenium', mass: 78.971,
    category: 'nonmetal', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁴', shells: [2, 8, 18, 6],
    electronegativity: 2.55, state: 'Solid', gridRow: 4, gridCol: 16,
    isotopes: [[74, 'Se-74', true], [76, 'Se-76', true], [78, 'Se-78', true], [80, 'Se-80', true]]
  },
  {
    number: 35, symbol: 'Br', name: 'Bromine', mass: 79.904,
    category: 'halogen', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁵', shells: [2, 8, 18, 7],
    electronegativity: 2.96, state: 'Liquid', gridRow: 4, gridCol: 17,
    isotopes: [[79, 'Br-79', true], [81, 'Br-81', true]]
  },
  {
    number: 36, symbol: 'Kr', name: 'Krypton', mass: 83.798,
    category: 'noble-gas', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁶', shells: [2, 8, 18, 8],
    electronegativity: 3.00, state: 'Gas', gridRow: 4, gridCol: 18,
    isotopes: [[78, 'Kr-78', true], [80, 'Kr-80', true], [82, 'Kr-82', true], [84, 'Kr-84', true]]
  },
  // Period 5
  {
    number: 37, symbol: 'Rb', name: 'Rubidium', mass: 85.468,
    category: 'alkali-metal', electronConfig: '[Kr] 5s¹', shells: [2, 8, 18, 8, 1],
    electronegativity: 0.82, state: 'Solid', gridRow: 5, gridCol: 1,
    isotopes: [[85, 'Rb-85', true], [87, 'Rb-87', false]]
  },
  {
    number: 38, symbol: 'Sr', name: 'Strontium', mass: 87.62,
    category: 'alkaline-earth', electronConfig: '[Kr] 5s²', shells: [2, 8, 18, 8, 2],
    electronegativity: 0.95, state: 'Solid', gridRow: 5, gridCol: 2,
    isotopes: [[84, 'Sr-84', true], [86, 'Sr-86', true], [87, 'Sr-87', true], [88, 'Sr-88', true]]
  },
  {
    number: 39, symbol: 'Y', name: 'Yttrium', mass: 88.906,
    category: 'transition-metal', electronConfig: '[Kr] 4d¹ 5s²', shells: [2, 8, 18, 9, 2],
    electronegativity: 1.22, state: 'Solid', gridRow: 5, gridCol: 3,
    isotopes: [[89, 'Y-89', true]]
  },
  {
    number: 40, symbol: 'Zr', name: 'Zirconium', mass: 91.224,
    category: 'transition-metal', electronConfig: '[Kr] 4d² 5s²', shells: [2, 8, 18, 10, 2],
    electronegativity: 1.33, state: 'Solid', gridRow: 5, gridCol: 4,
    isotopes: [[90, 'Zr-90', true], [91, 'Zr-91', true], [92, 'Zr-92', true], [94, 'Zr-94', true]]
  },
  {
    number: 41, symbol: 'Nb', name: 'Niobium', mass: 92.906,
    category: 'transition-metal', electronConfig: '[Kr] 4d⁴ 5s¹', shells: [2, 8, 18, 12, 1],
    electronegativity: 1.6, state: 'Solid', gridRow: 5, gridCol: 5,
    isotopes: [[93, 'Nb-93', true]]
  },
  {
    number: 42, symbol: 'Mo', name: 'Molybdenum', mass: 95.95,
    category: 'transition-metal', electronConfig: '[Kr] 4d⁵ 5s¹', shells: [2, 8, 18, 13, 1],
    electronegativity: 2.16, state: 'Solid', gridRow: 5, gridCol: 6,
    isotopes: [[92, 'Mo-92', true], [95, 'Mo-95', true], [98, 'Mo-98', true]]
  },
  {
    number: 43, symbol: 'Tc', name: 'Technetium', mass: 98,
    category: 'transition-metal', electronConfig: '[Kr] 4d⁵ 5s²', shells: [2, 8, 18, 13, 2],
    electronegativity: 1.9, state: 'Solid', gridRow: 5, gridCol: 7,
    isotopes: [[97, 'Tc-97', false], [98, 'Tc-98', false], [99, 'Tc-99', false]]
  },
  {
    number: 44, symbol: 'Ru', name: 'Ruthenium', mass: 101.07,
    category: 'transition-metal', electronConfig: '[Kr] 4d⁷ 5s¹', shells: [2, 8, 18, 15, 1],
    electronegativity: 2.2, state: 'Solid', gridRow: 5, gridCol: 8,
    isotopes: [[96, 'Ru-96', true], [101, 'Ru-101', true], [102, 'Ru-102', true]]
  },
  {
    number: 45, symbol: 'Rh', name: 'Rhodium', mass: 102.906,
    category: 'transition-metal', electronConfig: '[Kr] 4d⁸ 5s¹', shells: [2, 8, 18, 16, 1],
    electronegativity: 2.28, state: 'Solid', gridRow: 5, gridCol: 9,
    isotopes: [[103, 'Rh-103', true]]
  },
  {
    number: 46, symbol: 'Pd', name: 'Palladium', mass: 106.42,
    category: 'transition-metal', electronConfig: '[Kr] 4d¹⁰', shells: [2, 8, 18, 18],
    electronegativity: 2.20, state: 'Solid', gridRow: 5, gridCol: 10,
    isotopes: [[102, 'Pd-102', true], [105, 'Pd-105', true], [106, 'Pd-106', true], [108, 'Pd-108', true]]
  },
  {
    number: 47, symbol: 'Ag', name: 'Silver', mass: 107.868,
    category: 'transition-metal', electronConfig: '[Kr] 4d¹⁰ 5s¹', shells: [2, 8, 18, 18, 1],
    electronegativity: 1.93, state: 'Solid', gridRow: 5, gridCol: 11,
    isotopes: [[107, 'Ag-107', true], [109, 'Ag-109', true]]
  },
  {
    number: 48, symbol: 'Cd', name: 'Cadmium', mass: 112.414,
    category: 'transition-metal', electronConfig: '[Kr] 4d¹⁰ 5s²', shells: [2, 8, 18, 18, 2],
    electronegativity: 1.69, state: 'Solid', gridRow: 5, gridCol: 12,
    isotopes: [[110, 'Cd-110', true], [112, 'Cd-112', true], [114, 'Cd-114', true]]
  },
  {
    number: 49, symbol: 'In', name: 'Indium', mass: 114.818,
    category: 'post-transition', electronConfig: '[Kr] 4d¹⁰ 5s² 5p¹', shells: [2, 8, 18, 18, 3],
    electronegativity: 1.78, state: 'Solid', gridRow: 5, gridCol: 13,
    isotopes: [[113, 'In-113', true], [115, 'In-115', false]]
  },
  {
    number: 50, symbol: 'Sn', name: 'Tin', mass: 118.710,
    category: 'post-transition', electronConfig: '[Kr] 4d¹⁰ 5s² 5p²', shells: [2, 8, 18, 18, 4],
    electronegativity: 1.96, state: 'Solid', gridRow: 5, gridCol: 14,
    isotopes: [[116, 'Sn-116', true], [118, 'Sn-118', true], [120, 'Sn-120', true]]
  },
  {
    number: 51, symbol: 'Sb', name: 'Antimony', mass: 121.760,
    category: 'metalloid', electronConfig: '[Kr] 4d¹⁰ 5s² 5p³', shells: [2, 8, 18, 18, 5],
    electronegativity: 2.05, state: 'Solid', gridRow: 5, gridCol: 15,
    isotopes: [[121, 'Sb-121', true], [123, 'Sb-123', true]]
  },
  {
    number: 52, symbol: 'Te', name: 'Tellurium', mass: 127.60,
    category: 'metalloid', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁴', shells: [2, 8, 18, 18, 6],
    electronegativity: 2.1, state: 'Solid', gridRow: 5, gridCol: 16,
    isotopes: [[126, 'Te-126', true], [128, 'Te-128', true], [130, 'Te-130', true]]
  },
  {
    number: 53, symbol: 'I', name: 'Iodine', mass: 126.904,
    category: 'halogen', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁵', shells: [2, 8, 18, 18, 7],
    electronegativity: 2.66, state: 'Solid', gridRow: 5, gridCol: 17,
    isotopes: [[127, 'I-127', true]]
  },
  {
    number: 54, symbol: 'Xe', name: 'Xenon', mass: 131.293,
    category: 'noble-gas', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁶', shells: [2, 8, 18, 18, 8],
    electronegativity: 2.60, state: 'Gas', gridRow: 5, gridCol: 18,
    isotopes: [[129, 'Xe-129', true], [131, 'Xe-131', true], [132, 'Xe-132', true], [134, 'Xe-134', true]]
  },
  // Period 6
  {
    number: 55, symbol: 'Cs', name: 'Caesium', mass: 132.905,
    category: 'alkali-metal', electronConfig: '[Xe] 6s¹', shells: [2, 8, 18, 18, 8, 1],
    electronegativity: 0.79, state: 'Solid', gridRow: 6, gridCol: 1,
    isotopes: [[133, 'Cs-133', true]]
  },
  {
    number: 56, symbol: 'Ba', name: 'Barium', mass: 137.327,
    category: 'alkaline-earth', electronConfig: '[Xe] 6s²', shells: [2, 8, 18, 18, 8, 2],
    electronegativity: 0.89, state: 'Solid', gridRow: 6, gridCol: 2,
    isotopes: [[134, 'Ba-134', true], [137, 'Ba-137', true], [138, 'Ba-138', true]]
  },
  // Lanthanides (row 9 visually, gridRow 9)
  { number: 57, symbol: 'La', name: 'Lanthanum', mass: 138.905, category: 'lanthanide', electronConfig: '[Xe] 5d¹ 6s²', shells: [2,8,18,18,9,2], electronegativity: 1.10, state: 'Solid', gridRow: 9, gridCol: 3, isotopes: [[138,'La-138',false],[139,'La-139',true]] },
  { number: 58, symbol: 'Ce', name: 'Cerium', mass: 140.116, category: 'lanthanide', electronConfig: '[Xe] 4f¹ 5d¹ 6s²', shells: [2,8,18,19,9,2], electronegativity: 1.12, state: 'Solid', gridRow: 9, gridCol: 4, isotopes: [[140,'Ce-140',true],[142,'Ce-142',true]] },
  { number: 59, symbol: 'Pr', name: 'Praseodymium', mass: 140.908, category: 'lanthanide', electronConfig: '[Xe] 4f³ 6s²', shells: [2,8,18,21,8,2], electronegativity: 1.13, state: 'Solid', gridRow: 9, gridCol: 5, isotopes: [[141,'Pr-141',true]] },
  { number: 60, symbol: 'Nd', name: 'Neodymium', mass: 144.242, category: 'lanthanide', electronConfig: '[Xe] 4f⁴ 6s²', shells: [2,8,18,22,8,2], electronegativity: 1.14, state: 'Solid', gridRow: 9, gridCol: 6, isotopes: [[142,'Nd-142',true],[144,'Nd-144',true],[146,'Nd-146',true]] },
  { number: 61, symbol: 'Pm', name: 'Promethium', mass: 145, category: 'lanthanide', electronConfig: '[Xe] 4f⁵ 6s²', shells: [2,8,18,23,8,2], electronegativity: 1.13, state: 'Solid', gridRow: 9, gridCol: 7, isotopes: [[145,'Pm-145',false],[147,'Pm-147',false]] },
  { number: 62, symbol: 'Sm', name: 'Samarium', mass: 150.36, category: 'lanthanide', electronConfig: '[Xe] 4f⁶ 6s²', shells: [2,8,18,24,8,2], electronegativity: 1.17, state: 'Solid', gridRow: 9, gridCol: 8, isotopes: [[147,'Sm-147',false],[149,'Sm-149',true],[152,'Sm-152',true]] },
  { number: 63, symbol: 'Eu', name: 'Europium', mass: 151.964, category: 'lanthanide', electronConfig: '[Xe] 4f⁷ 6s²', shells: [2,8,18,25,8,2], electronegativity: 1.2, state: 'Solid', gridRow: 9, gridCol: 9, isotopes: [[151,'Eu-151',true],[153,'Eu-153',true]] },
  { number: 64, symbol: 'Gd', name: 'Gadolinium', mass: 157.25, category: 'lanthanide', electronConfig: '[Xe] 4f⁷ 5d¹ 6s²', shells: [2,8,18,25,9,2], electronegativity: 1.20, state: 'Solid', gridRow: 9, gridCol: 10, isotopes: [[155,'Gd-155',true],[156,'Gd-156',true],[158,'Gd-158',true]] },
  { number: 65, symbol: 'Tb', name: 'Terbium', mass: 158.925, category: 'lanthanide', electronConfig: '[Xe] 4f⁹ 6s²', shells: [2,8,18,27,8,2], electronegativity: 1.2, state: 'Solid', gridRow: 9, gridCol: 11, isotopes: [[159,'Tb-159',true]] },
  { number: 66, symbol: 'Dy', name: 'Dysprosium', mass: 162.500, category: 'lanthanide', electronConfig: '[Xe] 4f¹⁰ 6s²', shells: [2,8,18,28,8,2], electronegativity: 1.22, state: 'Solid', gridRow: 9, gridCol: 12, isotopes: [[162,'Dy-162',true],[163,'Dy-163',true],[164,'Dy-164',true]] },
  { number: 67, symbol: 'Ho', name: 'Holmium', mass: 164.930, category: 'lanthanide', electronConfig: '[Xe] 4f¹¹ 6s²', shells: [2,8,18,29,8,2], electronegativity: 1.23, state: 'Solid', gridRow: 9, gridCol: 13, isotopes: [[165,'Ho-165',true]] },
  { number: 68, symbol: 'Er', name: 'Erbium', mass: 167.259, category: 'lanthanide', electronConfig: '[Xe] 4f¹² 6s²', shells: [2,8,18,30,8,2], electronegativity: 1.24, state: 'Solid', gridRow: 9, gridCol: 14, isotopes: [[166,'Er-166',true],[167,'Er-167',true],[168,'Er-168',true]] },
  { number: 69, symbol: 'Tm', name: 'Thulium', mass: 168.934, category: 'lanthanide', electronConfig: '[Xe] 4f¹³ 6s²', shells: [2,8,18,31,8,2], electronegativity: 1.25, state: 'Solid', gridRow: 9, gridCol: 15, isotopes: [[169,'Tm-169',true]] },
  { number: 70, symbol: 'Yb', name: 'Ytterbium', mass: 173.045, category: 'lanthanide', electronConfig: '[Xe] 4f¹⁴ 6s²', shells: [2,8,18,32,8,2], electronegativity: 1.1, state: 'Solid', gridRow: 9, gridCol: 16, isotopes: [[171,'Yb-171',true],[173,'Yb-173',true],[174,'Yb-174',true]] },
  { number: 71, symbol: 'Lu', name: 'Lutetium', mass: 174.967, category: 'lanthanide', electronConfig: '[Xe] 4f¹⁴ 5d¹ 6s²', shells: [2,8,18,32,9,2], electronegativity: 1.27, state: 'Solid', gridRow: 9, gridCol: 17, isotopes: [[175,'Lu-175',true],[176,'Lu-176',false]] },
  // Back to period 6 main
  { number: 72, symbol: 'Hf', name: 'Hafnium', mass: 178.49, category: 'transition-metal', electronConfig: '[Xe] 4f¹⁴ 5d² 6s²', shells: [2,8,18,32,10,2], electronegativity: 1.3, state: 'Solid', gridRow: 6, gridCol: 4, isotopes: [[177,'Hf-177',true],[178,'Hf-178',true],[180,'Hf-180',true]] },
  { number: 73, symbol: 'Ta', name: 'Tantalum', mass: 180.948, category: 'transition-metal', electronConfig: '[Xe] 4f¹⁴ 5d³ 6s²', shells: [2,8,18,32,11,2], electronegativity: 1.5, state: 'Solid', gridRow: 6, gridCol: 5, isotopes: [[180,'Ta-180',false],[181,'Ta-181',true]] },
  { number: 74, symbol: 'W', name: 'Tungsten', mass: 183.84, category: 'transition-metal', electronConfig: '[Xe] 4f¹⁴ 5d⁴ 6s²', shells: [2,8,18,32,12,2], electronegativity: 2.36, state: 'Solid', gridRow: 6, gridCol: 6, isotopes: [[182,'W-182',true],[184,'W-184',true],[186,'W-186',true]] },
  { number: 75, symbol: 'Re', name: 'Rhenium', mass: 186.207, category: 'transition-metal', electronConfig: '[Xe] 4f¹⁴ 5d⁵ 6s²', shells: [2,8,18,32,13,2], electronegativity: 1.9, state: 'Solid', gridRow: 6, gridCol: 7, isotopes: [[185,'Re-185',true],[187,'Re-187',false]] },
  { number: 76, symbol: 'Os', name: 'Osmium', mass: 190.23, category: 'transition-metal', electronConfig: '[Xe] 4f¹⁴ 5d⁶ 6s²', shells: [2,8,18,32,14,2], electronegativity: 2.2, state: 'Solid', gridRow: 6, gridCol: 8, isotopes: [[190,'Os-190',true],[192,'Os-192',true]] },
  { number: 77, symbol: 'Ir', name: 'Iridium', mass: 192.217, category: 'transition-metal', electronConfig: '[Xe] 4f¹⁴ 5d⁷ 6s²', shells: [2,8,18,32,15,2], electronegativity: 2.20, state: 'Solid', gridRow: 6, gridCol: 9, isotopes: [[191,'Ir-191',true],[193,'Ir-193',true]] },
  { number: 78, symbol: 'Pt', name: 'Platinum', mass: 195.084, category: 'transition-metal', electronConfig: '[Xe] 4f¹⁴ 5d⁹ 6s¹', shells: [2,8,18,32,17,1], electronegativity: 2.28, state: 'Solid', gridRow: 6, gridCol: 10, isotopes: [[194,'Pt-194',true],[195,'Pt-195',true],[196,'Pt-196',true]] },
  { number: 79, symbol: 'Au', name: 'Gold', mass: 196.967, category: 'transition-metal', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', shells: [2,8,18,32,18,1], electronegativity: 2.54, state: 'Solid', gridRow: 6, gridCol: 11, isotopes: [[197,'Au-197',true]] },
  { number: 80, symbol: 'Hg', name: 'Mercury', mass: 200.592, category: 'transition-metal', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', shells: [2,8,18,32,18,2], electronegativity: 2.00, state: 'Liquid', gridRow: 6, gridCol: 12, isotopes: [[199,'Hg-199',true],[200,'Hg-200',true],[202,'Hg-202',true]] },
  { number: 81, symbol: 'Tl', name: 'Thallium', mass: 204.38, category: 'post-transition', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', shells: [2,8,18,32,18,3], electronegativity: 1.62, state: 'Solid', gridRow: 6, gridCol: 13, isotopes: [[203,'Tl-203',true],[205,'Tl-205',true]] },
  { number: 82, symbol: 'Pb', name: 'Lead', mass: 207.2, category: 'post-transition', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', shells: [2,8,18,32,18,4], electronegativity: 1.87, state: 'Solid', gridRow: 6, gridCol: 14, isotopes: [[206,'Pb-206',true],[207,'Pb-207',true],[208,'Pb-208',true]] },
  { number: 83, symbol: 'Bi', name: 'Bismuth', mass: 208.980, category: 'post-transition', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', shells: [2,8,18,32,18,5], electronegativity: 2.02, state: 'Solid', gridRow: 6, gridCol: 15, isotopes: [[209,'Bi-209',false]] },
  { number: 84, symbol: 'Po', name: 'Polonium', mass: 209, category: 'post-transition', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', shells: [2,8,18,32,18,6], electronegativity: 2.0, state: 'Solid', gridRow: 6, gridCol: 16, isotopes: [[208,'Po-208',false],[209,'Po-209',false],[210,'Po-210',false]] },
  { number: 85, symbol: 'At', name: 'Astatine', mass: 210, category: 'halogen', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', shells: [2,8,18,32,18,7], electronegativity: 2.2, state: 'Solid', gridRow: 6, gridCol: 17, isotopes: [[210,'At-210',false],[211,'At-211',false]] },
  { number: 86, symbol: 'Rn', name: 'Radon', mass: 222, category: 'noble-gas', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', shells: [2,8,18,32,18,8], electronegativity: null, state: 'Gas', gridRow: 6, gridCol: 18, isotopes: [[220,'Rn-220',false],[222,'Rn-222',false]] },
  // Period 7
  { number: 87, symbol: 'Fr', name: 'Francium', mass: 223, category: 'alkali-metal', electronConfig: '[Rn] 7s¹', shells: [2,8,18,32,18,8,1], electronegativity: 0.7, state: 'Solid', gridRow: 7, gridCol: 1, isotopes: [[223,'Fr-223',false]] },
  { number: 88, symbol: 'Ra', name: 'Radium', mass: 226, category: 'alkaline-earth', electronConfig: '[Rn] 7s²', shells: [2,8,18,32,18,8,2], electronegativity: 0.9, state: 'Solid', gridRow: 7, gridCol: 2, isotopes: [[226,'Ra-226',false],[228,'Ra-228',false]] },
  // Actinides (row 10)
  { number: 89, symbol: 'Ac', name: 'Actinium', mass: 227, category: 'actinide', electronConfig: '[Rn] 6d¹ 7s²', shells: [2,8,18,32,18,9,2], electronegativity: 1.1, state: 'Solid', gridRow: 10, gridCol: 3, isotopes: [[227,'Ac-227',false]] },
  { number: 90, symbol: 'Th', name: 'Thorium', mass: 232.038, category: 'actinide', electronConfig: '[Rn] 6d² 7s²', shells: [2,8,18,32,18,10,2], electronegativity: 1.3, state: 'Solid', gridRow: 10, gridCol: 4, isotopes: [[230,'Th-230',false],[232,'Th-232',false]] },
  { number: 91, symbol: 'Pa', name: 'Protactinium', mass: 231.036, category: 'actinide', electronConfig: '[Rn] 5f² 6d¹ 7s²', shells: [2,8,18,32,20,9,2], electronegativity: 1.5, state: 'Solid', gridRow: 10, gridCol: 5, isotopes: [[231,'Pa-231',false]] },
  { number: 92, symbol: 'U', name: 'Uranium', mass: 238.029, category: 'actinide', electronConfig: '[Rn] 5f³ 6d¹ 7s²', shells: [2,8,18,32,21,9,2], electronegativity: 1.38, state: 'Solid', gridRow: 10, gridCol: 6, isotopes: [[234,'U-234',false],[235,'U-235',false],[238,'U-238',false]] },
  { number: 93, symbol: 'Np', name: 'Neptunium', mass: 237, category: 'actinide', electronConfig: '[Rn] 5f⁴ 6d¹ 7s²', shells: [2,8,18,32,22,9,2], electronegativity: 1.36, state: 'Solid', gridRow: 10, gridCol: 7, isotopes: [[237,'Np-237',false]] },
  { number: 94, symbol: 'Pu', name: 'Plutonium', mass: 244, category: 'actinide', electronConfig: '[Rn] 5f⁶ 7s²', shells: [2,8,18,32,24,8,2], electronegativity: 1.28, state: 'Solid', gridRow: 10, gridCol: 8, isotopes: [[239,'Pu-239',false],[244,'Pu-244',false]] },
  { number: 95, symbol: 'Am', name: 'Americium', mass: 243, category: 'actinide', electronConfig: '[Rn] 5f⁷ 7s²', shells: [2,8,18,32,25,8,2], electronegativity: 1.3, state: 'Solid', gridRow: 10, gridCol: 9, isotopes: [[241,'Am-241',false],[243,'Am-243',false]] },
  { number: 96, symbol: 'Cm', name: 'Curium', mass: 247, category: 'actinide', electronConfig: '[Rn] 5f⁷ 6d¹ 7s²', shells: [2,8,18,32,25,9,2], electronegativity: 1.3, state: 'Solid', gridRow: 10, gridCol: 10, isotopes: [[247,'Cm-247',false],[248,'Cm-248',false]] },
  { number: 97, symbol: 'Bk', name: 'Berkelium', mass: 247, category: 'actinide', electronConfig: '[Rn] 5f⁹ 7s²', shells: [2,8,18,32,27,8,2], electronegativity: 1.3, state: 'Solid', gridRow: 10, gridCol: 11, isotopes: [[247,'Bk-247',false]] },
  { number: 98, symbol: 'Cf', name: 'Californium', mass: 251, category: 'actinide', electronConfig: '[Rn] 5f¹⁰ 7s²', shells: [2,8,18,32,28,8,2], electronegativity: 1.3, state: 'Solid', gridRow: 10, gridCol: 12, isotopes: [[251,'Cf-251',false],[252,'Cf-252',false]] },
  { number: 99, symbol: 'Es', name: 'Einsteinium', mass: 252, category: 'actinide', electronConfig: '[Rn] 5f¹¹ 7s²', shells: [2,8,18,32,29,8,2], electronegativity: 1.3, state: 'Solid', gridRow: 10, gridCol: 13, isotopes: [[252,'Es-252',false]] },
  { number: 100, symbol: 'Fm', name: 'Fermium', mass: 257, category: 'actinide', electronConfig: '[Rn] 5f¹² 7s²', shells: [2,8,18,32,30,8,2], electronegativity: 1.3, state: 'Solid', gridRow: 10, gridCol: 14, isotopes: [[257,'Fm-257',false]] },
  { number: 101, symbol: 'Md', name: 'Mendelevium', mass: 258, category: 'actinide', electronConfig: '[Rn] 5f¹³ 7s²', shells: [2,8,18,32,31,8,2], electronegativity: 1.3, state: 'Solid', gridRow: 10, gridCol: 15, isotopes: [[258,'Md-258',false]] },
  { number: 102, symbol: 'No', name: 'Nobelium', mass: 259, category: 'actinide', electronConfig: '[Rn] 5f¹⁴ 7s²', shells: [2,8,18,32,32,8,2], electronegativity: 1.3, state: 'Solid', gridRow: 10, gridCol: 16, isotopes: [[259,'No-259',false]] },
  { number: 103, symbol: 'Lr', name: 'Lawrencium', mass: 266, category: 'actinide', electronConfig: '[Rn] 5f¹⁴ 7s² 7p¹', shells: [2,8,18,32,32,8,3], electronegativity: 1.3, state: 'Solid', gridRow: 10, gridCol: 17, isotopes: [[266,'Lr-266',false]] },
  // Period 7 continued
  { number: 104, symbol: 'Rf', name: 'Rutherfordium', mass: 267, category: 'transition-metal', electronConfig: '[Rn] 5f¹⁴ 6d² 7s²', shells: [2,8,18,32,32,10,2], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 4, isotopes: [[267,'Rf-267',false]] },
  { number: 105, symbol: 'Db', name: 'Dubnium', mass: 268, category: 'transition-metal', electronConfig: '[Rn] 5f¹⁴ 6d³ 7s²', shells: [2,8,18,32,32,11,2], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 5, isotopes: [[268,'Db-268',false]] },
  { number: 106, symbol: 'Sg', name: 'Seaborgium', mass: 269, category: 'transition-metal', electronConfig: '[Rn] 5f¹⁴ 6d⁴ 7s²', shells: [2,8,18,32,32,12,2], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 6, isotopes: [[269,'Sg-269',false]] },
  { number: 107, symbol: 'Bh', name: 'Bohrium', mass: 270, category: 'transition-metal', electronConfig: '[Rn] 5f¹⁴ 6d⁵ 7s²', shells: [2,8,18,32,32,13,2], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 7, isotopes: [[270,'Bh-270',false]] },
  { number: 108, symbol: 'Hs', name: 'Hassium', mass: 277, category: 'transition-metal', electronConfig: '[Rn] 5f¹⁴ 6d⁶ 7s²', shells: [2,8,18,32,32,14,2], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 8, isotopes: [[277,'Hs-277',false]] },
  { number: 109, symbol: 'Mt', name: 'Meitnerium', mass: 278, category: 'unknown', electronConfig: '[Rn] 5f¹⁴ 6d⁷ 7s²', shells: [2,8,18,32,32,15,2], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 9, isotopes: [[278,'Mt-278',false]] },
  { number: 110, symbol: 'Ds', name: 'Darmstadtium', mass: 281, category: 'unknown', electronConfig: '[Rn] 5f¹⁴ 6d⁸ 7s²', shells: [2,8,18,32,32,16,2], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 10, isotopes: [[281,'Ds-281',false]] },
  { number: 111, symbol: 'Rg', name: 'Roentgenium', mass: 282, category: 'unknown', electronConfig: '[Rn] 5f¹⁴ 6d⁹ 7s²', shells: [2,8,18,32,32,17,2], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 11, isotopes: [[282,'Rg-282',false]] },
  { number: 112, symbol: 'Cn', name: 'Copernicium', mass: 285, category: 'unknown', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s²', shells: [2,8,18,32,32,18,2], electronegativity: null, state: 'Liquid', gridRow: 7, gridCol: 12, isotopes: [[285,'Cn-285',false]] },
  { number: 113, symbol: 'Nh', name: 'Nihonium', mass: 286, category: 'unknown', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', shells: [2,8,18,32,32,18,3], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 13, isotopes: [[286,'Nh-286',false]] },
  { number: 114, symbol: 'Fl', name: 'Flerovium', mass: 289, category: 'unknown', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', shells: [2,8,18,32,32,18,4], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 14, isotopes: [[289,'Fl-289',false]] },
  { number: 115, symbol: 'Mc', name: 'Moscovium', mass: 290, category: 'unknown', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', shells: [2,8,18,32,32,18,5], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 15, isotopes: [[290,'Mc-290',false]] },
  { number: 116, symbol: 'Lv', name: 'Livermorium', mass: 293, category: 'unknown', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', shells: [2,8,18,32,32,18,6], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 16, isotopes: [[293,'Lv-293',false]] },
  { number: 117, symbol: 'Ts', name: 'Tennessine', mass: 294, category: 'unknown', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', shells: [2,8,18,32,32,18,7], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 17, isotopes: [[294,'Ts-294',false]] },
  { number: 118, symbol: 'Og', name: 'Oganesson', mass: 294, category: 'unknown', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', shells: [2,8,18,32,32,18,8], electronegativity: null, state: 'Solid', gridRow: 7, gridCol: 18, isotopes: [[294,'Og-294',false]] },
];

function getElementById(num) {
  return ELEMENTS.find(e => e.number === num);
}

function getElementsByCategory(cat) {
  return ELEMENTS.filter(e => e.category === cat);
}

function searchElements(query) {
  const q = query.toLowerCase();
  return ELEMENTS.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.symbol.toLowerCase().includes(q) ||
    String(e.number).includes(q)
  );
}
