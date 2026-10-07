// Button mapping data for all 4 tunings.
// Each tuning has 3 rows: row 0 = outer (10 buttons), row 1 = middle (11 buttons), row 2 = inner (10 buttons).
// Button 0 is the top button (lowest notes), last button is the bottom (highest notes).
// Notes use sharp notation internally: C C# D D# E F F# G G# A A# B
// All data derived from the standard G/C/F layout; F tuning = dev-plan verified;
// E tuning = G down 3 semitones (dev plan, button R1-B0 corrected from typo: C/A not A#/A#);
// Bb/Sib tuning = G up 3 semitones, verified against Diego Romero diagram (Sib-Mib-Lab).

const TUNINGS = {
  G: {
    id: 'G',
    label: 'Sol',
    sublabel: 'Sol / Do / Fa',
    sublabelEn: 'G / C / F',
    flatKeys: false,
    rows: [
      // Row 0 — outer / Sib row  (10 buttons)
      [
        { push:'C#', pull:'D#' },
        { push:'G',  pull:'A'  },
        { push:'B',  pull:'C'  },
        { push:'D',  pull:'E'  },
        { push:'G',  pull:'F#' },
        { push:'B',  pull:'A'  },
        { push:'D',  pull:'C'  },
        { push:'G',  pull:'E'  },
        { push:'B',  pull:'F#' },
        { push:'D',  pull:'A'  },
      ],
      // Row 1 — middle / Do row  (11 buttons)
      [
        { push:'F#', pull:'G#' },
        { push:'G',  pull:'B'  },
        { push:'C',  pull:'D'  },
        { push:'E',  pull:'F'  },
        { push:'G',  pull:'A'  },
        { push:'C',  pull:'B'  },
        { push:'E',  pull:'D'  },
        { push:'G',  pull:'F'  },
        { push:'C',  pull:'A'  },
        { push:'E',  pull:'B'  },
        { push:'G',  pull:'D'  },
      ],
      // Row 2 — inner / Fa row  (10 buttons)
      [
        { push:'D#', pull:'C#' },
        { push:'C',  pull:'E'  },
        { push:'F',  pull:'G'  },
        { push:'A',  pull:'A#' },
        { push:'C',  pull:'D'  },
        { push:'F',  pull:'E'  },
        { push:'A',  pull:'G'  },
        { push:'C',  pull:'A#' },
        { push:'F',  pull:'D'  },
        { push:'A',  pull:'E'  },
      ],
    ],
  },

  F: {
    id: 'F',
    label: 'Fa',
    sublabel: 'Fa / Sib / Mib',
    sublabelEn: 'F / Bb / Eb',
    flatKeys: true,
    rows: [
      // Row 0 — outer (10 buttons)
      [
        { push:'B',  pull:'C#' },
        { push:'F',  pull:'G'  },
        { push:'A',  pull:'A#' },
        { push:'C',  pull:'D'  },
        { push:'F',  pull:'E'  },
        { push:'A',  pull:'G'  },
        { push:'C',  pull:'A#' },
        { push:'F',  pull:'D'  },
        { push:'A',  pull:'E'  },
        { push:'C',  pull:'G'  },
      ],
      // Row 1 — middle (11 buttons)
      [
        { push:'E',  pull:'F#' },
        { push:'F',  pull:'A'  },
        { push:'A#', pull:'C'  },
        { push:'D',  pull:'D#' },
        { push:'F',  pull:'G'  },
        { push:'A#', pull:'A'  },
        { push:'D',  pull:'C'  },
        { push:'F',  pull:'D#' },
        { push:'A#', pull:'G'  },
        { push:'D',  pull:'A'  },
        { push:'F',  pull:'C'  },
      ],
      // Row 2 — inner (10 buttons)
      [
        { push:'C#', pull:'B'  },
        { push:'A#', pull:'D'  },
        { push:'D#', pull:'F'  },
        { push:'G',  pull:'G#' },
        { push:'A#', pull:'C'  },
        { push:'D#', pull:'D'  },
        { push:'G',  pull:'F'  },
        { push:'A#', pull:'G#' },
        { push:'D#', pull:'C'  },
        { push:'G',  pull:'D'  },
      ],
    ],
  },

  E: {
    id: 'E',
    label: 'Mi',
    sublabel: 'Mi / La / Re',
    sublabelEn: 'E / A / D',
    flatKeys: false,
    rows: [
      // Row 0 — outer (10 buttons)
      // Note: button 0 corrected from dev-plan typo (A#/A# → C/A via transposition)
      [
        { push:'A',  pull:'C'  },
        { push:'E',  pull:'F#' },
        { push:'G#', pull:'A'  },
        { push:'B',  pull:'C#' },
        { push:'E',  pull:'D#' },
        { push:'G#', pull:'F#' },
        { push:'B',  pull:'A'  },
        { push:'E',  pull:'C#' },
        { push:'G#', pull:'D#' },
        { push:'B',  pull:'F#' },
      ],
      // Row 1 — middle (11 buttons)
      [
        { push:'D#', pull:'F'  },
        { push:'E',  pull:'G#' },
        { push:'A',  pull:'B'  },
        { push:'C#', pull:'D'  },
        { push:'E',  pull:'F#' },
        { push:'A',  pull:'G#' },
        { push:'C#', pull:'B'  },
        { push:'E',  pull:'D'  },
        { push:'A',  pull:'F#' },
        { push:'C#', pull:'G#' },
        { push:'E',  pull:'B'  },
      ],
      // Row 2 — inner (10 buttons)
      [
        { push:'C',  pull:'A#' },
        { push:'A',  pull:'C#' },
        { push:'D',  pull:'E'  },
        { push:'F#', pull:'G'  },
        { push:'A',  pull:'B'  },
        { push:'D',  pull:'C#' },
        { push:'F#', pull:'E'  },
        { push:'A',  pull:'G'  },
        { push:'D',  pull:'B'  },
        { push:'F#', pull:'C#' },
      ],
    ],
  },

  Bb: {
    id: 'Bb',
    label: 'Sib',
    sublabel: 'Sib / Mib / Lab  •  5 Letras / BEsAs',
    sublabelEn: 'Bb / Eb / Ab',
    flatKeys: true,
    rows: [
      // Row 0 — outer / Sib row (10 buttons)
      // Verified against Diego Romero diagram (Cerrando/Abriendo).
      // B0 push = Mi (E natural, confirmed in diagram).
      [
        { push:'E',  pull:'F#' },
        { push:'A#', pull:'C'  },
        { push:'D',  pull:'D#' },
        { push:'F',  pull:'G'  },
        { push:'A#', pull:'A'  },
        { push:'D',  pull:'C'  },
        { push:'F',  pull:'D#' },
        { push:'A#', pull:'G'  },
        { push:'D',  pull:'A'  },
        { push:'F',  pull:'C'  },
      ],
      // Row 1 — middle / Mib row (11 buttons)
      [
        { push:'A',  pull:'B'  },
        { push:'A#', pull:'D'  },
        { push:'D#', pull:'F'  },
        { push:'G',  pull:'G#' },
        { push:'A#', pull:'C'  },
        { push:'D#', pull:'D'  },
        { push:'G',  pull:'F'  },
        { push:'A#', pull:'G#' },
        { push:'D#', pull:'C'  },
        { push:'G',  pull:'D'  },
        { push:'A#', pull:'F'  },
      ],
      // Row 2 — inner / Lab row (10 buttons)
      [
        { push:'F#', pull:'E'  },
        { push:'D#', pull:'G'  },
        { push:'G#', pull:'A#' },
        { push:'C',  pull:'C#' },
        { push:'D#', pull:'F'  },
        { push:'G#', pull:'G'  },
        { push:'C',  pull:'A#' },
        { push:'D#', pull:'C#' },
        { push:'G#', pull:'F'  },
        { push:'C',  pull:'G'  },
      ],
    ],
  },
};
