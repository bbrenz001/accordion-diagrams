// ── Note utilities ──────────────────────────────────────────────────────────

const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// Spanish display names per notation style ('sharp', 'flat', 'en')
const NOTE_DISPLAY = {
  sharp: ['Do','Do#','Re','Re#','Mi','Fa','Fa#','Sol','Sol#','La','La#','Si'],
  flat:  ['Do','Reb','Re','Mib','Mi','Fa','Solb','Sol','Lab','La','Sib','Si'],
  en:    ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
};

// Normalize any note name to its index in CHROMATIC (sharps canonical)
function noteNum(n) {
  const map = { 'Bb':'A#','Eb':'D#','Ab':'G#','Db':'C#','Gb':'F#' };
  const norm = map[n] || n;
  const idx = CHROMATIC.indexOf(norm);
  if (idx === -1) { console.warn('Unknown note:', n); return 0; }
  return idx;
}

function numNote(n) { return CHROMATIC[((n % 12) + 12) % 12]; }

// Display a note in the current notation style
function dispNote(note, style) {
  return NOTE_DISPLAY[style][noteNum(note)];
}

// Interval names for tooltips
const INTERVAL_NAMES = {
  3: 'Tercera menor / Minor 3rd',
  4: 'Tercera mayor / Major 3rd',
  8: 'Sexta menor / Minor 6th',
  9: 'Sexta mayor / Major 6th',
};

// ── Chord definitions ───────────────────────────────────────────────────────

const CHORD_TYPES = [
  { id:'major',  label:'Mayor (M)',          labelEn:'Major',       intervals:[0,4,7]    },
  { id:'minor',  label:'Menor (m)',          labelEn:'Minor',       intervals:[0,3,7]    },
  { id:'dim',    label:'Disminuido (°)',     labelEn:'Diminished',  intervals:[0,3,6]    },
  { id:'dom7',   label:'Dominante 7 (7)',    labelEn:'Dom 7th',     intervals:[0,4,7,10] },
  { id:'maj7',   label:'Mayor 7ma (Maj7)',   labelEn:'Major 7th',   intervals:[0,4,7,11] },
  { id:'min7',   label:'Menor 7ma (m7)',     labelEn:'Minor 7th',   intervals:[0,3,7,10] },
  { id:'sixth',  label:'Sexta (6)',          labelEn:'Sixth',       intervals:[0,4,7,9]  },
];

// ── Harmonized scale definitions ─────────────────────────────────────────────
// Each entry: semitone offset from root, chord type, Roman numeral label.

const HARMONIZED_SCALES = {
  major: [
    {s:0,  t:'major', l:'I'   }, {s:2,  t:'minor', l:'II'  }, {s:4,  t:'minor', l:'III' },
    {s:5,  t:'major', l:'IV'  }, {s:7,  t:'major', l:'V'   }, {s:9,  t:'minor', l:'VI'  },
    {s:11, t:'dim',   l:'VII°'},
  ],
  nat_minor: [
    {s:0,  t:'minor', l:'I'   }, {s:2,  t:'dim',   l:'II°' }, {s:3,  t:'major', l:'III' },
    {s:5,  t:'minor', l:'IV'  }, {s:7,  t:'minor', l:'V'   }, {s:8,  t:'major', l:'VI'  },
    {s:10, t:'major', l:'VII' },
  ],
  harm_minor: [
    {s:0,  t:'minor', l:'I'   }, {s:2,  t:'dim',   l:'II°' }, {s:3,  t:'major', l:'III' },
    {s:5,  t:'minor', l:'IV'  }, {s:7,  t:'major', l:'V'   }, {s:8,  t:'major', l:'VI'  },
    {s:11, t:'dim',   l:'VII°'},
  ],
};

// ── Scale definitions ───────────────────────────────────────────────────────

const SCALE_TYPES = [
  { id:'major',       label:'Mayor',              labelEn:'Major',              intervals:[0,2,4,5,7,9,11]        },
  { id:'nat_minor',   label:'Menor Natural',       labelEn:'Natural Minor',      intervals:[0,2,3,5,7,8,10]        },
  { id:'harm_minor',  label:'Menor Armónica',      labelEn:'Harmonic Minor',     intervals:[0,2,3,5,7,8,11]        },
  { id:'melodic_min', label:'Menor Melódica (↑)',  labelEn:'Melodic Minor (asc)',intervals:[0,2,3,5,7,9,11]        },
  { id:'pentatonic',  label:'Pentatónica Mayor',   labelEn:'Major Pentatonic',   intervals:[0,2,4,7,9]             },
  { id:'min_penta',   label:'Pentatónica Menor',   labelEn:'Minor Pentatonic',   intervals:[0,3,5,7,10]            },
  { id:'chromatic',   label:'Cromática',           labelEn:'Chromatic',          intervals:[0,1,2,3,4,5,6,7,8,9,10,11] },
];

// ── Chord finder ─────────────────────────────────────────────────────────────
// Returns all single-direction (push or pull) button combinations that cover
// every note of the chord. Each voicing is {dir, buttons:[{row,btn,note}]}.
// Strategy: iterate note-0's positions → for each, try pull, then push;
// recursively fill remaining notes in same direction only.

function findChordVoicings(tuningKey, root, chordId) {
  const tuning = TUNINGS[tuningKey];
  const chordDef = CHORD_TYPES.find(c => c.id === chordId);
  if (!chordDef) return [];

  const rootN = noteNum(root);
  const targets = chordDef.intervals.map(i => (rootN + i) % 12);

  const voicings = [];

  ['push','pull'].forEach(dir => {
    // For each target note, collect all button positions in this direction
    const notePositions = targets.map(tgt => {
      const pos = [];
      tuning.rows.forEach((row, rIdx) => {
        row.forEach((btn, bIdx) => {
          if (noteNum(btn[dir]) === tgt) {
            pos.push({ row: rIdx, btn: bIdx, note: btn[dir] });
          }
        });
      });
      return pos;
    });

    // Bail early if any note is completely missing in this direction
    if (notePositions.some(p => p.length === 0)) return;

    // Build all combinations via cartesian product
    const combos = cartesian(notePositions);
    combos.forEach(combo => {
      // Deduplicate: no two entries can use the same button
      const keys = combo.map(p => `${p.row}-${p.btn}`);
      if (new Set(keys).size !== keys.length) return;
      voicings.push({ dir, buttons: combo });
    });
  });

  // Keep only compact voicings: per-row button span ≤ 4, at most 2 rows
  const practical = voicings.filter(v => {
    const rowBtns = {};
    v.buttons.forEach(b => {
      if (!rowBtns[b.row]) rowBtns[b.row] = [];
      rowBtns[b.row].push(b.btn);
    });
    const rows = Object.keys(rowBtns);
    if (rows.length > 2) return false;
    for (const r of rows) {
      const btns = rowBtns[r];
      if (Math.max(...btns) - Math.min(...btns) > 4) return false;
    }
    return true;
  });

  // Sort: pull (abriendo) first, then fewest rows, then smallest span
  practical.sort((a, b) => {
    if (a.dir !== b.dir) return a.dir === 'pull' ? -1 : 1;
    const rowsA = new Set(a.buttons.map(b => b.row)).size;
    const rowsB = new Set(b.buttons.map(b => b.row)).size;
    if (rowsA !== rowsB) return rowsA - rowsB;
    const spanA = Math.max(...a.buttons.map(b => b.btn)) - Math.min(...a.buttons.map(b => b.btn));
    const spanB = Math.max(...b.buttons.map(b => b.btn)) - Math.min(...b.buttons.map(b => b.btn));
    return spanA - spanB;
  });

  // Cap: up to 6 pull + 6 push so the most common push voicings surface
  const pull = practical.filter(v => v.dir === 'pull').slice(0, 6);
  const push = practical.filter(v => v.dir === 'push').slice(0, 6);
  const base = [...pull, ...push];

  // Prepend saved custom chords with ★ marker
  const customKey = chordStorageKey(root, chordId);
  const d0 = _storageGet();
  const customs = (d0.chords && d0.chords[customKey]) || [];
  const customVoicings = customs.map(c => ({ ...c, custom: true }));
  return [...customVoicings, ...base];
}

function cartesian(arrays) {
  return arrays.reduce((acc, arr) => {
    const result = [];
    acc.forEach(a => arr.forEach(b => result.push([...a, b])));
    return result;
  }, [[]]);
}

// ── Scale path finder ────────────────────────────────────────────────────────
// Finds ONE recommended fingering path through the scale: a single (row,btn,dir)
// per degree. Standard = pull-preferred (norteño). Vallenato = alternating direction.
// Greedily picks the closest button to the previous one.

function findScalePath(tuningKey, root, scaleId, style) {
  const tuning = TUNINGS[tuningKey];
  const scaleDef = SCALE_TYPES.find(s => s.id === scaleId);
  if (!scaleDef) return [];

  const rootN = noteNum(root);
  const degrees = scaleDef.intervals.map(i => ({
    semitone: i,
    noteN: (rootN + i) % 12,
    note: numNote((rootN + i) % 12),
  }));

  const path = [];
  let prevRow = 1, prevBtn = 2;

  degrees.forEach(deg => {
    const allPos = [];
    tuning.rows.forEach((row, rIdx) => {
      row.forEach((btn, bIdx) => {
        if (noteNum(btn.push) === deg.noteN)
          allPos.push({ row: rIdx, btn: bIdx, dir: 'push', note: btn.push });
        if (noteNum(btn.pull) === deg.noteN)
          allPos.push({ row: rIdx, btn: bIdx, dir: 'pull', note: btn.pull });
      });
    });

    if (allPos.length === 0) {
      path.push({ ...deg, missing: true });
      return;
    }

    let candidates = [...allPos];

    if (style === 'standard') {
      const pullOnly = candidates.filter(p => p.dir === 'pull');
      if (pullOnly.length > 0) candidates = pullOnly;
    } else {
      // Vallenato: alternate direction from previous chosen note
      const lastChosen = path.slice().reverse().find(s => !s.missing);
      if (lastChosen) {
        const altDir = candidates.filter(p => p.dir !== lastChosen.dir);
        if (altDir.length > 0) candidates = altDir;
      }
    }

    // Pick closest to previous button (row distance weighted more than btn distance)
    candidates.sort((a, b) => {
      const dA = Math.abs(a.btn - prevBtn) + Math.abs(a.row - prevRow) * 3;
      const dB = Math.abs(b.btn - prevBtn) + Math.abs(b.row - prevRow) * 3;
      return dA - dB;
    });

    const chosen = candidates[0];
    prevRow = chosen.row;
    prevBtn = chosen.btn;
    path.push({ ...deg, ...chosen, missing: false });
  });

  return path;
}

// ── Interval pair finder (terceras & sextas) ─────────────────────────────────
// Returns pairs {root:{row,btn,dir,note}, harmony:{row,btn,dir,note}, interval}
// where both buttons use the SAME bellows direction.

function findIntervalPairs(tuningKey, rootNote, intervalSemitones) {
  const tuning = TUNINGS[tuningKey];
  const rootN = noteNum(rootNote);
  const targets = intervalSemitones.map(i => (rootN + i) % 12);
  const pairs = [];

  tuning.rows.forEach((row, rIdx) => {
    row.forEach((btn, bIdx) => {
      ['push','pull'].forEach(dir => {
        if (noteNum(btn[dir]) !== rootN) return;
        targets.forEach(tgt => {
          tuning.rows.forEach((row2, rIdx2) => {
            row2.forEach((btn2, bIdx2) => {
              if (rIdx === rIdx2 && bIdx === bIdx2) return;
              if (noteNum(btn2[dir]) === tgt) {
                const semitones = ((tgt - rootN) + 12) % 12;
                pairs.push({
                  root:    { row: rIdx,  btn: bIdx,  dir, note: btn[dir]  },
                  harmony: { row: rIdx2, btn: bIdx2, dir, note: btn2[dir] },
                  interval: semitones,
                  intervalName: INTERVAL_NAMES[semitones] || `${semitones} semitonos`,
                });
              }
            });
          });
        });
      });
    });
  });

  // Deduplicate: (r1,b1,r2,b2,dir) but not (r2,b2,r1,b1) — root is always the lower note
  const seen = new Set();
  return pairs.filter(p => {
    const key = `${p.dir}-${p.root.row}-${p.root.btn}-${p.harmony.row}-${p.harmony.btn}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Audio removed — no sound playback in this version.

// ── Multi-diagram highlight storage ──────────────────────────────────────────

const _hl = { 0: [], 1: [], 2: [], 3: [], 4: [] };
function setHL(id, hl)     { _hl[id] = hl; }
function getHL(id)         { return _hl[id] || []; }
// Always write to the first diagram of the current tab
function setHighlights(hl) { const d = currentDiagrams(); if (d.length) setHL(d[0].id, hl); }
function applyHighlights() {
  const active = new Set(currentDiagrams().map(d => d.id));
  Object.keys(_hl).forEach(id => { if (active.has(parseInt(id))) applyHL(parseInt(id)); });
}

// ── Per-tab diagram helpers ───────────────────────────────────────────────────
function currentDiagrams() { return state.tabDiagrams ? (state.tabDiagrams[state.tab] || []) : []; }
function setCurrentDiagrams(arr) { state.tabDiagrams[state.tab] = arr; }

function applyHL(id) {
  const highlights = getHL(id);
  document.querySelectorAll(`.acc-btn[data-diagram="${id}"]`).forEach(el => {
    const rIdx = parseInt(el.dataset.row);
    const bIdx = parseInt(el.dataset.btn);
    const pullEl = el.querySelector('.btn-pull');
    const pushEl = el.querySelector('.btn-push');
    if (!pullEl || !pushEl) return;
    const pullH = highlights.find(h => h.row===rIdx && h.btn===bIdx && h.dir==='pull');
    const pushH = highlights.find(h => h.row===rIdx && h.btn===bIdx && h.dir==='push');
    const pullColor = (pullH && pullH.color) ? ` color-${pullH.color}` : '';
    const pushColor = (pushH && pushH.color) ? ` color-${pushH.color}` : '';
    pullEl.className = 'btn-half btn-pull' + (pullH ? (pullH.style==='highlight' ? ' highlight-pull' + pullColor : ' active-pull') : '');
    pushEl.className = 'btn-half btn-push' + (pushH ? (pushH.style==='highlight' ? ' highlight-push' + pushColor : ' active-push') : '');
    if (pullH && pullH.label) {
      pullEl.innerHTML = `<span class="hl-label">${pullH.label}</span><span class="hl-note">(${pullEl.dataset.note || ''})</span>`;
    } else {
      pullEl.textContent = pullEl.dataset.note || pullEl.textContent;
    }
    if (pushH && pushH.label) {
      pushEl.innerHTML = `<span class="hl-label">${pushH.label}</span><span class="hl-note">(${pushEl.dataset.note || ''})</span>`;
    } else {
      pushEl.textContent = pushEl.dataset.note || pushEl.textContent;
    }
  });
}

// ── Multi-diagram renderer ────────────────────────────────────────────────────

function renderAllDiagrams() {
  const wrapper = document.getElementById('diagrams-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = '';
  currentDiagrams().forEach((diag, i) => wrapper.appendChild(_createDiagramPanel(diag, i + 1)));
  const footer = document.createElement('div');
  footer.className = 'diagrams-footer';
  const showAdd = state.tab !== 'armonica';
  footer.innerHTML = `${showAdd ? '<button class="add-diagram-btn" id="add-diagram">+ Diagrama</button>' : ''}
    <button class="print-btn" id="btn-print">🖨 PDF</button>`;
  wrapper.appendChild(footer);
  if (showAdd) document.getElementById('add-diagram').addEventListener('click', addDiagram);
  document.getElementById('btn-print').addEventListener('click', () => window.print());
}

function _createDiagramPanel(diag, panelNum) {
  const diagramId = diag.id;
  const tuning    = TUNINGS[state.tuning];
  const hl        = getHL(diagramId);
  const inEdit    = state.editMode || state.chordEditMode || state.tercEditMode || state.sextEditMode;
  const canRemove = currentDiagrams().length > 1;

  const panel = document.createElement('div');
  panel.className = `accordion-panel${inEdit ? ' edit-mode' : ''}`;
  panel.dataset.panelId = diagramId;

  // Slot selector for scales tab (shows which saved fingering this diagram displays)
  const isScales = state.tab === 'scales';
  const slot = diag.slot || 'auto';
  const slotHtml = isScales ? `
    <select class="diagram-slot-sel" data-slot-for="${diagramId}" title="Variación mostrada">
      <option value="auto" ${slot==='auto'?'selected':''}>Auto</option>
      <option value="1"    ${slot==='1'   ?'selected':''}>Opción 1</option>
      <option value="2"    ${slot==='2'   ?'selected':''}>Opción 2</option>
      <option value="3"    ${slot==='3'   ?'selected':''}>Opción 3</option>
    </select>` : '';

  // Chord diagram voicing nav (independent per diagram)
  const isChords = state.tab === 'chords';
  let chordNavHtml = '';
  if (isChords && state.voicings.length > 0) {
    const vIdx = diag.vIdx || 0;
    const v = state.voicings[vIdx];
    const lbl = v ? `${v.custom ? '★ ' : ''}${v.dir === 'push' ? '↓' : '↑'} ${vIdx+1}/${state.voicings.length}` : '—';
    chordNavHtml = `<div class="diagram-chord-nav">
      <button class="chord-nav-btn" data-cv-prev="${diagramId}">‹</button>
      <span class="chord-nav-lbl">${lbl}</span>
      <button class="chord-nav-btn" data-cv-next="${diagramId}">›</button>
    </div>`;
  }

  // Armónica degree nav (one chord per degree, independent voicing nav)
  const isArmonica = state.tab === 'armonica';
  let armonicaNavHtml = '';
  if (isArmonica) {
    const degrees = HARMONIZED_SCALES[state.armonicaType];
    const degIdx  = diag.degree !== undefined ? diag.degree : (panelNum - 1);
    const deg     = degrees && degrees[degIdx];
    if (deg) {
      const chordRootN = (noteNum(state.armonicaRoot) + deg.s) % 12;
      const chordRoot  = numNote(chordRootN);
      const voicings   = findChordVoicings(state.tuning, chordRoot, deg.t);
      const vIdx = voicings.length > 0 ? Math.min(diag.vIdx || 0, voicings.length - 1) : 0;
      const v = voicings[vIdx];
      const dirLbl = v ? (v.dir === 'push' ? '↓' : '↑') : '';
      const star   = v && v.custom ? '★ ' : '';
      const navLbl = voicings.length > 0 ? `${star}${dirLbl} ${vIdx+1}/${voicings.length}` : '—';
      armonicaNavHtml = `<div class="diagram-chord-nav">
        <button class="chord-nav-btn" data-arm-prev="${diagramId}">‹</button>
        <span class="chord-nav-lbl">${deg.l} ${dispNote(chordRoot, state.notation)} ${navLbl}</span>
        <button class="chord-nav-btn" data-arm-next="${diagramId}">›</button>
      </div>`;
    }
  }

  const hdr = document.createElement('div');
  hdr.className = 'accordion-panel-hdr';
  const legendHtml = `
    <div class="bellows-legend">
      <div class="bellows-half bellows-cerrar">Cerrar</div>
      <div class="bellows-half bellows-abrir">Abrir</div>
    </div>`;
  hdr.innerHTML = `
    ${legendHtml}
    ${slotHtml}${chordNavHtml}${armonicaNavHtml}
    <span class="panel-num">D${panelNum} · ${tuning.sublabel}</span>
    ${canRemove ? `<button class="panel-remove-btn" data-remove="${diagramId}">×</button>` : ''}
  `;
  panel.appendChild(hdr);

  // Wire slot selector
  const slotSel = hdr.querySelector('[data-slot-for]');
  if (slotSel) {
    slotSel.addEventListener('change', () => {
      diag.slot = slotSel.value;
      saveDiagramLayout();
      updateScales();
    });
  }

  // Wire chord voicing nav
  const cvPrev = hdr.querySelector('[data-cv-prev]');
  const cvNext = hdr.querySelector('[data-cv-next]');
  if (cvPrev) cvPrev.addEventListener('click', () => stepChordDiagram(diagramId, -1));
  if (cvNext) cvNext.addEventListener('click', () => stepChordDiagram(diagramId, +1));

  // Armónica voicing nav
  const armPrev = hdr.querySelector('[data-arm-prev]');
  const armNext = hdr.querySelector('[data-arm-next]');
  if (armPrev) armPrev.addEventListener('click', () => stepArmonicaDiagram(diagramId, -1));
  if (armNext) armNext.addEventListener('click', () => stepArmonicaDiagram(diagramId, +1));

  const rowsDiv = document.createElement('div');
  rowsDiv.className = 'accordion-rows';
  rowsDiv.id = `diagram-${diagramId}`;

  [2, 1, 0].forEach(rIdx => {
    const row = tuning.rows[rIdx];
    const rowWrapper = document.createElement('div');
    rowWrapper.className = 'row-wrapper';
    const lbl = document.createElement('div');
    lbl.className = 'row-label';
    lbl.textContent = `F${rIdx + 1}`;
    rowWrapper.appendChild(lbl);
    const rowEl = document.createElement('div');
    rowEl.className = `button-row${rIdx === 1 ? ' row-middle' : ' row-outer'}`;
    row.forEach((btn, bIdx) => {
      const el = document.createElement('div');
      el.className = 'acc-btn';
      el.dataset.row = rIdx;
      el.dataset.btn = bIdx;
      el.dataset.diagram = diagramId;
      el.title = `F${rIdx+1}-B${bIdx+1} | ↓${dispNote(btn.push, state.notation)} | ↑${dispNote(btn.pull, state.notation)}`;
      const pullH = hl.find(h => h.row===rIdx && h.btn===bIdx && h.dir==='pull');
      const pushH = hl.find(h => h.row===rIdx && h.btn===bIdx && h.dir==='push');
      const pullCls = pullH ? (pullH.style==='highlight' ? 'highlight-pull' : 'active-pull') : '';
      const pushCls = pushH ? (pushH.style==='highlight' ? 'highlight-push' : 'active-push') : '';
      const pn = dispNote(btn.push, state.notation);
      const an = dispNote(btn.pull, state.notation);
      el.innerHTML = `
        <div class="btn-half btn-push ${pushCls}" data-note="${pn}">${pushH&&pushH.label?pushH.label:pn}</div>
        <div class="btn-half btn-pull ${pullCls}" data-note="${an}">${pullH&&pullH.label?pullH.label:an}</div>`;
      rowEl.appendChild(el);
    });
    rowWrapper.appendChild(rowEl);
    rowsDiv.appendChild(rowWrapper);
  });
  if (state.tab === 'libre') {
    const noteWrap = document.createElement('div');
    noteWrap.className = 'libre-note-wrap';
    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.className = 'libre-note-input';
    noteInput.placeholder = 'Nota / Label...';
    noteInput.value = diag.note || '';
    noteInput.addEventListener('input', () => { diag.note = noteInput.value; saveLibreSlot(); });
    noteInput.addEventListener('click', e => e.stopPropagation());
    noteWrap.appendChild(noteInput);
    panel.appendChild(noteWrap);
  }
  panel.appendChild(rowsDiv);

  const removeBtn = hdr.querySelector('[data-remove]');
  if (removeBtn) removeBtn.addEventListener('click', () => removeDiagram(parseInt(removeBtn.dataset.remove)));
  return panel;
}

function saveDiagramLayout() {
  const d = _storageGet();
  d.tabDiagrams   = state.tabDiagrams;
  d.nextDiagramId = state.nextDiagramId;
  _storageSet(d);
}

function addDiagram() {
  const id   = state.nextDiagramId++;
  const diag = state.tab === 'scales'
    ? { id, slot: String(currentDiagrams().length + 1) }
    : state.tab === 'libre'
    ? { id, note: '' }
    : { id };
  currentDiagrams().push(diag);
  _hl[id] = [];
  saveDiagramLayout();
  renderAllDiagrams();
  if (state.tab === 'scales') updateScales();
  else if (state.tab === 'libre') { saveLibreSlot(); applyHighlights(); }
  else applyHighlights();
}

function removeDiagram(id) {
  if (currentDiagrams().length <= 1) return;
  setCurrentDiagrams(currentDiagrams().filter(d => d.id !== id));
  delete _hl[id];
  saveDiagramLayout();
  renderAllDiagrams();
  applyHighlights();
}

// ── App state ────────────────────────────────────────────────────────────────

const state = {
  tuning:   'G',
  notation: 'flat',
  tab:      'chords',
  // per-tab diagram lists — each tab is independent
  tabDiagrams: {
    chords:   [{ id: 0 }],
    scales:   [{ id: 1, slot: '1' }],
    terceras: [{ id: 2 }],
    sextas:   [{ id: 3 }],
    armonica: [],
    libre:    [{ id: 4, note: '' }],
  },
  nextDiagramId: 5,
  // chords
  chordRoot: 'G',
  chordType: 'major',
  voicingIdx: 0,
  voicings:  [],
  chordEditMode:  false,
  chordEditSteps: [],
  chordEditDir:   null,
  // scales
  scaleRoot:  'G',
  scaleType:  'major',
  scaleStyle: 'standard',
  scaleResult: [],
  scaleSlot:  0,    // 0=auto, 1/2/3=saved slots
  // scale edit mode
  editMode:    false,
  editHistory: [], // [{diagramId, row, btn, dir, label}] ordered undo log
  editColor:   'yellow', // current color for edit-mode clicks
  // terceras
  tercRoot:     'G',
  tercSlot:     '1',
  tercPairIdx:  0,
  tercPairs:    [],
  tercEditMode: false,
  tercEditSteps:[],
  // sextas
  sextRoot:     'G',
  sextSlot:     '1',
  sextPairIdx:  0,
  sextPairs:    [],
  sextEditMode: false,
  sextEditSteps:[],
  // armónica
  armonicaRoot: 'G',
  armonicaType: 'major',
  // libre
  libreSlot:   '1',
  libreNumber: '1',
};

const ALL_ROOTS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// ── Native-root detection ─────────────────────────────────────────────────────
// Native major keys for G accordion: G, F, C, D, Bb
// Expressed as semitone offsets from the home key: 0, 10, 5, 7, 3
// This pattern transposes automatically to any tuning.
// Native minor keys = relative minors of each native major (-3 semitones each).

const NATIVE_MAJOR_OFFSETS = [0, 10, 5, 7, 3]; // G, F, C, D, Bb relative to home

function nativeRootsForScale(tuningKey, scaleId) {
  if (scaleId === 'chromatic') return ALL_ROOTS; // no key distinction for chromatic
  const T = noteNum(tuningKey);
  const majorRoots = NATIVE_MAJOR_OFFSETS.map(o => (T + o) % 12);
  const isMinorType = ['nat_minor','harm_minor','melodic_min','min_penta'].includes(scaleId);
  const roots = isMinorType
    ? majorRoots.map(r => (r + 9) % 12)  // relative minor = 3 semitones below
    : majorRoots;
  return roots.map(n => numNote(n));
}

function nativeRootsForInterval(tuningKey) {
  // Thirds and sixths follow the same native keys as major scales
  const T = noteNum(tuningKey);
  return NATIVE_MAJOR_OFFSETS.map(o => numNote((T + o) % 12));
}

// Builds (or rebuilds) a root <select> with native roots in a starred optgroup.
// When all roots are native (e.g. chromatic scale), shows a flat list instead.
function buildNativeRootSelector(selEl, currentVal, nativeRoots) {
  const native = ALL_ROOTS.filter(r => nativeRoots.includes(r));
  const other  = ALL_ROOTS.filter(r => !nativeRoots.includes(r));
  selEl.innerHTML = '';
  if (other.length === 0) {
    // All roots equivalent — flat list, no grouping
    ALL_ROOTS.forEach(r => {
      const opt = new Option(dispNote(r, state.notation), r);
      if (r === currentVal) opt.selected = true;
      selEl.appendChild(opt);
    });
    return;
  }
  if (native.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = '★ Nativas / Easiest';
    native.forEach(r => {
      const opt = new Option(dispNote(r, state.notation), r);
      if (r === currentVal) opt.selected = true;
      grp.appendChild(opt);
    });
    selEl.appendChild(grp);
  }
  if (other.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = 'Otras / Others';
    other.forEach(r => {
      const opt = new Option(dispNote(r, state.notation), r);
      if (r === currentVal) opt.selected = true;
      grp.appendChild(opt);
    });
    selEl.appendChild(grp);
  }
}

// ── Chord multi-diagram support ───────────────────────────────────────────────

function updateChordDiagrams() {
  currentDiagrams().forEach(diag => {
    const idx = diag.vIdx || 0;
    const v = state.voicings[idx];
    if (!v) { setHL(diag.id, []); applyHL(diag.id); return; }
    const hl = v.buttons.map(p => ({ row: p.row, btn: p.btn, dir: v.dir, style: 'active' }));
    setHL(diag.id, hl);
    applyHL(diag.id);
  });
}

function stepChordDiagram(diagramId, delta) {
  const diag = currentDiagrams().find(d => d.id === diagramId);
  if (!diag || state.voicings.length === 0) return;
  const n = state.voicings.length;
  diag.vIdx = (((diag.vIdx || 0) + delta) % n + n) % n;
  saveDiagramLayout();
  updateChordDiagrams();
  renderAllDiagrams();
}

// ── Tab: Chords ──────────────────────────────────────────────────────────────

function buildChordsUI() {
  const panel = document.getElementById('tab-content');
  panel.innerHTML = `
    <div class="control-group">
      <div class="control-label">Nota raíz / Root</div>
      <select id="chord-root"></select>
    </div>
    <div class="control-group">
      <div class="control-label">Tipo de acorde / Chord type</div>
      <select id="chord-type"></select>
    </div>
    <div id="voicing-area"></div>
    <div id="chord-edit-area"></div>
    <div class="results-info" id="chord-info">Selecciona raíz y tipo.</div>
  `;

  const rootSel = document.getElementById('chord-root');
  ALL_ROOTS.forEach(r => {
    const opt = new Option(dispNote(r, state.notation), r);
    if (r === state.chordRoot) opt.selected = true;
    rootSel.appendChild(opt);
  });
  rootSel.addEventListener('change', e => { state.chordRoot = e.target.value; updateChords(); });

  const typeSel = document.getElementById('chord-type');
  CHORD_TYPES.forEach(c => {
    const opt = new Option(c.label, c.id);
    if (c.id === state.chordType) opt.selected = true;
    typeSel.appendChild(opt);
  });
  typeSel.addEventListener('change', e => { state.chordType = e.target.value; updateChords(); });

  updateChords();
}

function updateChords() {
  state.voicings = findChordVoicings(state.tuning, state.chordRoot, state.chordType);
  state.voicingIdx = 0;

  const area = document.getElementById('voicing-area');
  const info = document.getElementById('chord-info');

  if (state.voicings.length === 0) {
    area.innerHTML = '';
    info.innerHTML = '<span class="no-results">No se encontraron posiciones para este acorde en esta afinación.</span>';
    setHighlights([]);
    applyHighlights();
    return;
  }

  const chordDef = CHORD_TYPES.find(c => c.id === state.chordType);
  const rootN = noteNum(state.chordRoot);
  const noteNames = chordDef.intervals.map(i => dispNote(numNote((rootN+i)%12), state.notation)).join(' – ');

  // Build voicing navigation
  area.innerHTML = `
    <div class="control-group">
      <div class="control-label">Posición / Voicing <span class="voicing-count">(${state.voicings.length} encontradas)</span></div>
      <div class="voicing-nav" id="voicing-nav"></div>
    </div>
  `;

  const nav = document.getElementById('voicing-nav');
  state.voicings.forEach((v, i) => {
    const btn = document.createElement('button');
    const star = v.custom ? '★ ' : '';
    btn.textContent = `${star}${i+1} ${v.dir === 'push' ? '↓' : '↑'}`;
    btn.title = `${v.custom ? 'Guardado · ' : ''}${v.dir === 'push' ? 'Cerrando (Push)' : 'Abriendo (Pull)'}`;
    if (i === 0) btn.className = 'active';
    btn.addEventListener('click', () => {
      state.voicingIdx = i;
      nav.querySelectorAll('button').forEach((b,j) => b.className = j===i ? 'active' : '');
      showVoicing(i);
    });
    nav.appendChild(btn);
  });

  info.innerHTML = `<strong>${dispNote(state.chordRoot, state.notation)} ${chordDef.label}</strong><br>Notas: ${noteNames}`;

  // Chord edit launch (outside edit mode)
  const editArea = document.getElementById('chord-edit-area');
  if (editArea && !state.chordEditMode) {
    const customKey = chordStorageKey(state.chordRoot, state.chordType);
    const hasCustom = loadCustomChords(customKey).length > 0;
    editArea.innerHTML = `<div class="scale-edit-actions">
      <button class="edit-launch-btn" id="btn-chord-edit">✏️ Guardar acorde propio</button>
      ${hasCustom ? '<button class="edit-reset-btn" id="btn-chord-delete">↩ Borrar guardados</button>' : ''}
    </div>`;
    document.getElementById('btn-chord-edit').addEventListener('click', enterChordEditMode);
    document.getElementById('btn-chord-delete')?.addEventListener('click', () => {
      deleteCustomChords(customKey);
      updateChords();
    });
  }

  showVoicing(0);
}

function showVoicing(idx) {
  const v = state.voicings[idx];
  if (!v) return;
  state.voicingIdx = idx;
  const d = currentDiagrams();
  if (d.length) d[0].vIdx = idx;
  updateChordDiagrams();
  renderAllDiagrams();

  const chordDef = CHORD_TYPES.find(c => c.id === state.chordType);
  const rootN = noteNum(state.chordRoot);
  const noteNames = chordDef.intervals.map(i => dispNote(numNote((rootN+i)%12), state.notation)).join(' – ');
  const dirLabel = v.dir === 'push' ? '↓ Cerrando' : '↑ Abriendo';
  const posStr = v.buttons
    .slice().sort((a,b) => a.row - b.row || a.btn - b.btn)
    .map(b => `F${b.row+1}-B${b.btn+1}`)
    .join(' · ');

  const info = document.getElementById('chord-info');
  if (info) {
    info.innerHTML = `<strong>${dispNote(state.chordRoot, state.notation)} ${chordDef.label}</strong><br>
      Notas: ${noteNames}<br>
      <span style="color:var(--text)">${dirLabel}</span> &nbsp;·&nbsp; ${posStr}`;
  }
}

// ── Tab: Scales ──────────────────────────────────────────────────────────────

function buildScalesUI() {
  const panel = document.getElementById('tab-content');
  panel.innerHTML = `
    <div class="control-group">
      <div class="control-label">Nota raíz / Root</div>
      <select id="scale-root"></select>
    </div>
    <div class="control-group">
      <div class="control-label">Escala / Scale</div>
      <select id="scale-type"></select>
    </div>
    <div id="scale-controls-area"></div>
    <div id="scale-path-display"></div>
    <div class="results-info" id="scale-info"></div>
  `;

  const rootSel = document.getElementById('scale-root');
  buildNativeRootSelector(rootSel, state.scaleRoot,
    nativeRootsForScale(state.tuning, state.scaleType));
  rootSel.addEventListener('change', e => {
    state.scaleRoot = e.target.value;
    refreshScaleControls();
    updateScales();
  });

  const typeSel = document.getElementById('scale-type');
  SCALE_TYPES.forEach(s => {
    const opt = new Option(s.label, s.id);
    if (s.id === state.scaleType) opt.selected = true;
    typeSel.appendChild(opt);
  });
  typeSel.addEventListener('change', e => {
    state.scaleType = e.target.value;
    // Rebuild root selector so native highlights reflect the new scale type
    buildNativeRootSelector(rootSel, state.scaleRoot,
      nativeRootsForScale(state.tuning, state.scaleType));
    refreshScaleControls();
    updateScales();
  });

  refreshScaleControls();
  updateScales();
}

function updateScales() {
  const scaleDef = SCALE_TYPES.find(s => s.id === state.scaleType);
  const styleNote = state.scaleStyle === 'standard' ? '↑ Pull preferido' : '↑↓ Alternando (vallenato)';
  const diagrams  = currentDiagrams();

  // Each diagram uses its own slot selector value (diag.slot)
  diagrams.forEach((diag, i) => {
    const slot  = diag.slot || String(i + 1);
    const saved = slot !== 'auto' ? loadScaleFingering(scaleStorageKey(parseInt(slot))) : null;
    let path;
    if (saved) {
      path = buildPathFromSaved(saved, state.tuning, state.scaleRoot, state.scaleType);
    } else {
      // auto or no save — always show the algorithm path
      path = findScalePath(state.tuning, state.scaleRoot, state.scaleType, state.scaleStyle);
    }
    const hl = path.filter(s => !s.missing).map((s, j) => ({
      row: s.row, btn: s.btn, dir: s.dir, style: 'highlight',
      label: s.label || String(j + 1),
    }));
    setHL(diag.id, hl);
    applyHL(diag.id);
    if (i === 0) state.scaleResult = path;
  });

  // Side-panel: numbered step list based on first diagram's path
  const path = state.scaleResult || [];
  const display = document.getElementById('scale-path-display');
  const info    = document.getElementById('scale-info');
  if (!display || !info) return;

  const rows = path.map((step, i) => {
    const note = dispNote(step.note || numNote(step.noteN), state.notation);
    if (step.missing) {
      return `<div class="scale-step scale-step-missing">
        <span class="step-num">${i+1}</span>
        <span class="step-note">${note}</span>
        <span class="step-pos">—</span>
      </div>`;
    }
    const arrow   = step.dir === 'push' ? '↓' : '↑';
    const dirWord = step.dir === 'push' ? 'cerrar' : 'abrir';
    return `<div class="scale-step" data-idx="${i}">
      <span class="step-num">${step.label||i+1}</span>
      <span class="step-note">${note}</span>
      <span class="step-pos">F${step.row+1}-B${step.btn+1} <span class="step-dir ${step.dir}">${arrow}${dirWord}</span></span>
    </div>`;
  }).join('');
  display.innerHTML = `<div class="scale-steps">${rows}</div>`;

  // Click step to focus it on diagram 1
  const firstId = diagrams[0].id;
  display.querySelectorAll('.scale-step[data-idx]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      const hl = path.map((s, j) => s.missing ? null : {
        row: s.row, btn: s.btn, dir: s.dir,
        style: j === idx ? 'highlight' : 'active',
        label: s.label || String(j + 1),
      }).filter(Boolean);
      setHL(firstId, hl);
      applyHL(firstId);
      display.querySelectorAll('.scale-step').forEach((r, j) => r.classList.toggle('scale-step-active', j === idx));
    });
  });

  const missing = path.filter(s => s.missing).length;
  info.innerHTML = `<strong>${dispNote(state.scaleRoot, state.notation)} ${scaleDef.label}</strong>
    &nbsp;·&nbsp;<span style="color:var(--muted);font-size:10px">${styleNote}</span>
    ${diagrams.length > 1 ? `<br><span style="color:var(--muted);font-size:10px">Diagrama 1=auto, 2=Opción 2, …</span>` : ''}
    ${missing > 0 ? `<br><span style="color:var(--pull-hi)">${missing} nota(s) no disponible(s).</span>` : ''}`;
}

// ── Persistent storage — backed by Python file API ────────────────────────────
// window._appData is loaded from user_data.json at boot via pywebview.api.load_data()
// All reads are synchronous (from the in-memory cache); writes flush to file async.

function _storageGet() {
  return window._appData || {};
}

function _storageSet(data) {
  window._appData = data;
  // Flush to file via pywebview API (async, fire-and-forget)
  if (window.pywebview && window.pywebview.api) {
    window.pywebview.api.save_data(JSON.stringify(data)).catch(() => {});
  }
}

// ── Fingering storage ─────────────────────────────────────────────────────────

function scaleStorageKey(slot) {
  const s = (slot !== undefined) ? slot : 1;
  return `scale_${state.scaleType}_v${s}`;
}
function saveScaleFingering(key, steps) {
  const d = _storageGet();
  d.scales = d.scales || {};
  d.scales[key] = steps;
  _storageSet(d);
}
function loadScaleFingering(key) {
  const d = _storageGet();
  return d.scales && d.scales[key] ? d.scales[key] : null;
}
function deleteScaleFingering(key) {
  const d = _storageGet();
  if (d.scales) delete d.scales[key];
  _storageSet(d);
}

// Reconstruct path array from saved [{row,btn,dir}] assignments
function buildPathFromSaved(saved, tuningKey, root, scaleId) {
  // saved = [{row, btn, dir, label}] — free-form assignments, not tied to scale intervals
  return saved.map((pos, i) => {
    if (!pos || pos.row == null) return { missing: true, note: '?', noteN: 0, semitone: 0 };
    const tuning = TUNINGS[tuningKey];
    const noteStr = tuning.rows[pos.row][pos.btn][pos.dir];
    return { row: pos.row, btn: pos.btn, dir: pos.dir, missing: false,
             note: noteStr, noteN: noteNum(noteStr), semitone: 0, label: pos.label || String(i+1) };
  });
}

// ── Scale edit mode ────────────────────────────────────────────────────────────

function enterScaleEditMode() {
  state.editMode    = true;
  state.editHistory = [];
  state._editLastDiagramId = null;
  // Keep existing highlights visible — user edits by toggling individual buttons
  renderAllDiagrams();
  refreshScaleControls();
}

function exitEditMode(save) {
  if (save) {
    currentDiagrams().forEach((diag, i) => {
      const hl  = getHL(diag.id);
      const slot = diag.slot && diag.slot !== 'auto' ? parseInt(diag.slot) : i + 1;
      if (hl.length === 0) {
        // User cleared this diagram — delete its saved fingering so auto-path shows next time
        deleteScaleFingering(scaleStorageKey(slot));
        return;
      }
      const steps = hl.map(h => ({ row: h.row, btn: h.btn, dir: h.dir, label: h.label }));
      saveScaleFingering(scaleStorageKey(slot), steps);
      diag.slot = String(slot);
    });
    saveDiagramLayout();
  }
  state.editMode   = false;
  state.editHistory = [];
  renderAllDiagrams();
  updateScales();
  refreshScaleControls();
}

function handleEditClick(diagramId, rIdx, bIdx, dir) {
  if (!state.editMode) return;
  if (!_hl[diagramId]) _hl[diagramId] = [];
  const hl = _hl[diagramId];

  // Toggle off if same half clicked again
  const existing = hl.findIndex(h => h.row===rIdx && h.btn===bIdx && h.dir===dir);
  if (existing !== -1) {
    hl.splice(existing, 1);
    // Also remove from undo history
    const hi = state.editHistory.findIndex(e => e.diagramId===diagramId && e.row===rIdx && e.btn===bIdx && e.dir===dir);
    if (hi !== -1) state.editHistory.splice(hi, 1);
    applyHL(diagramId);
    refreshScaleEditUI();
    return;
  }

  const inputEl = document.getElementById('edit-label-input');
  const label = inputEl ? inputEl.value.trim() : String(hl.length + 1);
  if (!label) return;

  const entry = { diagramId, row: rIdx, btn: bIdx, dir, label, style: 'highlight', color: state.editColor || 'yellow' };
  hl.push(entry);
  state.editHistory.push(entry);
  applyHL(diagramId);
  refreshScaleEditUI();
}

function undoEditStep() {
  if (!state.editMode || state.editHistory.length === 0) return;
  const last = state.editHistory.pop();
  const hl = _hl[last.diagramId];
  if (hl) {
    const idx = hl.findIndex(h => h.row===last.row && h.btn===last.btn && h.dir===last.dir);
    if (idx !== -1) hl.splice(idx, 1);
    applyHL(last.diagramId);
  }
  refreshScaleEditUI();
}

function refreshScaleEditUI() {
  const counter = document.getElementById('edit-counter');
  const saveBtn = document.getElementById('edit-save');
  const undoBtn = document.getElementById('edit-undo');
  if (!counter) return;
  const n = state.editHistory.length;
  counter.textContent = n === 0
    ? 'Clic en cualquier diagrama para asignar grado'
    : `${n} asignado(s) — cada diagrama es independiente`;
  counter.style.color = n > 0 ? 'var(--active)' : '';
  if (saveBtn) saveBtn.disabled = n === 0;
  if (undoBtn) undoBtn.disabled = n === 0;
}

function refreshScaleControls() {
  const area = document.getElementById('scale-controls-area');
  if (!area) return;

  if (state.editMode) {
    area.innerHTML = `
      <div class="edit-mode-panel">
        <div class="edit-counter" id="edit-counter">Clic en botones para asignar grados</div>
        <div style="display:flex;gap:6px;align-items:center;margin:4px 0">
          <label style="font-size:11px;color:var(--muted)">Etiqueta:</label>
          <input id="edit-label-input" value="1" style="width:55px;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:4px;padding:3px 6px;font-size:12px">
        </div>
        <div class="color-picker">
          <span style="font-size:11px;color:var(--muted)">Color:</span>
          <button class="color-dot${(state.editColor||'yellow')==='yellow'?' active':''}" data-ec="yellow" style="background:#e8c84a" title="Amarillo"></button>
          <button class="color-dot${state.editColor==='red'   ?' active':''}" data-ec="red"    style="background:#e05050" title="Rojo"></button>
          <button class="color-dot${state.editColor==='blue'  ?' active':''}" data-ec="blue"   style="background:#4080e0" title="Azul"></button>
          <button class="color-dot${state.editColor==='green' ?' active':''}" data-ec="green"  style="background:#3caa3c" title="Verde"></button>
          <button class="color-dot${state.editColor==='orange'?' active':''}" data-ec="orange" style="background:#d08020" title="Naranja"></button>
          <button class="color-dot${state.editColor==='purple'?' active':''}" data-ec="purple" style="background:#9040d0" title="Morado"></button>
        </div>
        <div class="edit-actions">
          <button class="edit-action-btn" id="edit-undo" disabled>↩ Undo</button>
          <button class="edit-action-btn success" id="edit-save" disabled>✓ Guardar</button>
          <button class="edit-action-btn danger" id="edit-cancel">✕ Cancelar</button>
        </div>
      </div>`;
    area.querySelectorAll('[data-ec]').forEach(dot => {
      dot.addEventListener('click', () => {
        state.editColor = dot.dataset.ec;
        area.querySelectorAll('[data-ec]').forEach(d => d.classList.toggle('active', d === dot));
      });
    });
    document.getElementById('edit-undo').addEventListener('click', undoEditStep);
    document.getElementById('edit-save').addEventListener('click', () => exitEditMode(true));
    document.getElementById('edit-cancel').addEventListener('click', () => exitEditMode(false));
  } else {
    // Show which diagram slots have custom saves
    const diagrams = currentDiagrams();
    const savedSlots = diagrams.map((d, i) => loadScaleFingering(scaleStorageKey(i+1))).filter(Boolean);

    area.innerHTML = `
      <div class="control-group">
        <div class="control-label">Estilo / Style</div>
        <div class="style-toggle">
          <button class="style-btn ${state.scaleStyle==='standard'?'active':''}" id="style-standard">Estándar</button>
          <button class="style-btn ${state.scaleStyle==='vallenato'?'active':''}" id="style-vallenato">Vallenato</button>
        </div>
      </div>
      <div class="scale-edit-actions">
        <button class="edit-launch-btn" id="btn-enter-edit">✏️ Editar fingering</button>
        ${savedSlots.length > 0 ? '<button class="edit-reset-btn" id="btn-reset">↩ Borrar guardados</button>' : ''}
      </div>
      <div style="font-size:10px;color:var(--muted);margin-top:2px">
        Agrega diagramas para guardar variaciones múltiples (Diagrama 1=Auto, 2=Opción 2…)
      </div>`;
    document.getElementById('style-standard').addEventListener('click', () => {
      state.scaleStyle = 'standard'; refreshScaleControls(); updateScales();
    });
    document.getElementById('style-vallenato').addEventListener('click', () => {
      state.scaleStyle = 'vallenato'; refreshScaleControls(); updateScales();
    });
    document.getElementById('btn-enter-edit').addEventListener('click', enterScaleEditMode);
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      // Delete saves for all current diagram slots
      currentDiagrams().forEach((d, i) => deleteScaleFingering(scaleStorageKey(i+1)));
      refreshScaleControls(); updateScales();
    });
  }
}

// ── Chord storage ─────────────────────────────────────────────────────────────

function chordStorageKey(root, type) {
  // Keyed by semitone offset from the accordion's home key so the same
  // fingering loads automatically when you switch tuning (G→F→Bb etc.).
  const offset = (noteNum(root) - noteNum(state.tuning) + 12) % 12;
  return `chord_custom_offset${offset}_${type}`;
}
function saveCustomChord(key, voicing) {
  const d = _storageGet();
  d.chords = d.chords || {};
  d.chords[key] = d.chords[key] || [];
  d.chords[key].push(voicing);
  _storageSet(d);
}
function loadCustomChords(key) {
  const d = _storageGet();
  return (d.chords && d.chords[key]) ? d.chords[key] : [];
}
function deleteCustomChords(key) {
  const d = _storageGet();
  if (d.chords) delete d.chords[key];
  _storageSet(d);
}

// ── Chord edit mode ────────────────────────────────────────────────────────────

function enterChordEditMode() {
  state.chordEditMode  = true;
  state.chordEditSteps = [];
  state.chordEditDir   = null;
  setHighlights([]);
  applyHighlights();
  renderAllDiagrams();
  refreshChordEditUI();
}

function exitChordEditMode(save) {
  if (save && state.chordEditSteps.length > 0) {
    const key = chordStorageKey(state.chordRoot, state.chordType);
    saveCustomChord(key, { dir: state.chordEditDir, buttons: state.chordEditSteps });
  }
  state.chordEditMode  = false;
  state.chordEditSteps = [];
  state.chordEditDir   = null;
  renderAllDiagrams();
  updateChords();
}

function handleChordEditClick(diagramId, rIdx, bIdx, dir) {
  if (!state.chordEditMode) return;
  if (state.chordEditDir === null) state.chordEditDir = dir;
  if (dir !== state.chordEditDir) return;
  const existing = state.chordEditSteps.findIndex(s => s.row===rIdx && s.btn===bIdx);
  if (existing !== -1) {
    state.chordEditSteps.splice(existing, 1);
  } else {
    const note = TUNINGS[state.tuning].rows[rIdx][bIdx][dir];
    state.chordEditSteps.push({ row: rIdx, btn: bIdx, dir, note });
  }
  if (state.chordEditSteps.length === 0) state.chordEditDir = null;
  // Write directly to the clicked diagram
  if (!_hl[diagramId]) _hl[diagramId] = [];
  _hl[diagramId] = state.chordEditSteps.map(s => ({ row: s.row, btn: s.btn, dir: s.dir, style: 'active' }));
  applyHL(diagramId);
  refreshChordEditUI();
}

function refreshChordEditUI() {
  const area = document.getElementById('chord-edit-area');
  if (!area) return;
  const n = state.chordEditSteps.length;
  const dirLabel = state.chordEditDir === 'push' ? '↓ Cerrando' : state.chordEditDir === 'pull' ? '↑ Abriendo' : '—';
  area.innerHTML = `
    <div class="edit-mode-panel">
      <div class="edit-counter" id="chord-edit-counter">
        ${n === 0 ? 'Clic en botones del acorde' : `${n} botón(es) · ${dirLabel}`}
      </div>
      <div class="edit-actions">
        <button class="edit-action-btn success" id="chord-edit-save" ${n===0?'disabled':''}>✓ Guardar</button>
        <button class="edit-action-btn danger" id="chord-edit-cancel">✕ Cancelar</button>
      </div>
    </div>`;
  document.getElementById('chord-edit-save').addEventListener('click', () => exitChordEditMode(true));
  document.getElementById('chord-edit-cancel').addEventListener('click', () => exitChordEditMode(false));
}

// ── Tab: Terceras ────────────────────────────────────────────────────────────

function buildTercerasUI() {
  buildIntervalUI('terc', [3,4], 'Terceras', 'Tercera / Third');
}

function buildSextasUI() {
  buildIntervalUI('sext', [8,9], 'Sextas', 'Sexta / Sixth');
}

// ── Escala Armónica ───────────────────────────────────────────────────────────

function syncArmonicaDiagrams(count) {
  const arr = state.tabDiagrams.armonica;
  while (arr.length < count) {
    const id = state.nextDiagramId++;
    _hl[id] = [];
    arr.push({ id, degree: arr.length, vIdx: 0 });
  }
  if (arr.length > count) arr.length = count;
}

function updateArmonica() {
  const degrees = HARMONIZED_SCALES[state.armonicaType];
  if (!degrees) {
    currentDiagrams().forEach(d => { setHL(d.id, []); applyHL(d.id); });
    return;
  }
  const prevCount = currentDiagrams().length;
  syncArmonicaDiagrams(degrees.length);
  if (prevCount !== degrees.length) renderAllDiagrams();

  const rootN = noteNum(state.armonicaRoot);
  currentDiagrams().forEach((diag, i) => {
    const deg = degrees[diag.degree !== undefined ? diag.degree : i];
    if (!deg) { setHL(diag.id, []); applyHL(diag.id); return; }
    const chordRoot = numNote((rootN + deg.s) % 12);
    const voicings  = findChordVoicings(state.tuning, chordRoot, deg.t);
    if (voicings.length === 0) { setHL(diag.id, []); applyHL(diag.id); return; }
    const vIdx = Math.min(diag.vIdx || 0, voicings.length - 1);
    diag.vIdx = vIdx;
    const v  = voicings[vIdx];
    const hl = v.buttons.map(p => ({ row: p.row, btn: p.btn, dir: v.dir, style: 'active' }));
    setHL(diag.id, hl);
    applyHL(diag.id);
  });
}

function stepArmonicaDiagram(diagramId, delta) {
  const diag = currentDiagrams().find(d => d.id === diagramId);
  if (!diag) return;
  const degrees = HARMONIZED_SCALES[state.armonicaType];
  if (!degrees) return;
  const deg = degrees[diag.degree !== undefined ? diag.degree : 0];
  if (!deg) return;
  const chordRoot = numNote((noteNum(state.armonicaRoot) + deg.s) % 12);
  const voicings  = findChordVoicings(state.tuning, chordRoot, deg.t);
  if (voicings.length === 0) return;
  const n = voicings.length;
  diag.vIdx = (((diag.vIdx || 0) + delta) % n + n) % n;
  saveDiagramLayout();
  const v  = voicings[diag.vIdx];
  const hl = v.buttons.map(p => ({ row: p.row, btn: p.btn, dir: v.dir, style: 'active' }));
  setHL(diag.id, hl);
  applyHL(diag.id);
  renderAllDiagrams();
}

function buildArmonicaUI() {
  const panel = document.getElementById('tab-content');
  panel.innerHTML = `
    <div class="control-group">
      <div class="control-label">Nota raíz / Root</div>
      <select id="armonica-root"></select>
    </div>
    <div class="control-group">
      <div class="control-label">Escala / Scale</div>
      <select id="armonica-type"></select>
    </div>
    <div class="results-info" id="armonica-info" style="font-size:10px;color:var(--muted)">
      Cada diagrama muestra un grado de la escala armonizada.
    </div>`;

  const rootSel = document.getElementById('armonica-root');
  buildNativeRootSelector(rootSel, state.armonicaRoot,
    nativeRootsForScale(state.tuning, state.armonicaType));
  rootSel.addEventListener('change', e => {
    state.armonicaRoot = e.target.value;
    updateArmonica();
    renderAllDiagrams();
  });

  const typeSel = document.getElementById('armonica-type');
  Object.entries(HARMONIZED_SCALES).forEach(([id]) => {
    const def = SCALE_TYPES.find(s => s.id === id);
    if (!def) return;
    const opt = new Option(def.label, id);
    if (id === state.armonicaType) opt.selected = true;
    typeSel.appendChild(opt);
  });
  typeSel.addEventListener('change', e => {
    state.armonicaType = e.target.value;
    buildNativeRootSelector(rootSel, state.armonicaRoot,
      nativeRootsForScale(state.tuning, state.armonicaType));
    updateArmonica();
    renderAllDiagrams();
  });

  updateArmonica();
  renderAllDiagrams();
}

function intervalSaveKey(prefix, slot) {
  const rootKey = prefix === 'terc' ? 'tercRoot' : 'sextRoot';
  const s = slot !== undefined ? slot : (state[prefix === 'terc' ? 'tercSlot' : 'sextSlot'] || '1');
  return `${prefix}_edit_${state[rootKey]}_v${s}`;
}

function buildIntervalUI(prefix, intervals, heading, pairLabel) {
  const editModeKey = prefix === 'terc' ? 'tercEditMode' : 'sextEditMode';
  const editStepsKey = prefix === 'terc' ? 'tercEditSteps' : 'sextEditSteps';
  const rootKey = prefix === 'terc' ? 'tercRoot' : 'sextRoot';
  const isEdit = !!state[editModeKey];

  const panel = document.getElementById('tab-content');
  panel.innerHTML = `
    <div class="control-group">
      <div class="control-label">Nota raíz / Root</div>
      <select id="${prefix}-root" ${isEdit ? 'disabled' : ''}></select>
    </div>
    <div id="${prefix}-edit-area"></div>
    <div class="control-group">
      <div class="control-label">${pairLabel} disponibles</div>
      <div class="pair-list" id="${prefix}-pairs"></div>
    </div>
    <div class="results-info" id="${prefix}-info">Selecciona raíz.</div>
  `;

  const rootSel = document.getElementById(`${prefix}-root`);
  buildNativeRootSelector(rootSel, state[rootKey], nativeRootsForInterval(state.tuning));
  rootSel.addEventListener('change', e => {
    state[rootKey] = e.target.value;
    updateIntervalTab(prefix, intervals);
  });

  _refreshIntervalEditArea(prefix, intervals);
  updateIntervalTab(prefix, intervals);
}

function _refreshIntervalEditArea(prefix, intervals) {
  const area = document.getElementById(`${prefix}-edit-area`);
  if (!area) return;
  const editModeKey  = prefix === 'terc' ? 'tercEditMode' : 'sextEditMode';
  const editStepsKey = prefix === 'terc' ? 'tercEditSteps' : 'sextEditSteps';

  if (state[editModeKey]) {
    const n = state[editStepsKey].length;
    const ec = state.editColor || 'yellow';
    area.innerHTML = `
      <div class="edit-mode-panel">
        <div class="edit-counter">${n === 0 ? 'Clic en botones para asignar etiquetas' : `${n} asignado(s)`}</div>
        <div style="display:flex;gap:6px;align-items:center;margin:4px 0">
          <label style="font-size:11px;color:var(--muted)">Etiqueta:</label>
          <input id="${prefix}-label-input" value="1" style="width:55px;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:4px;padding:3px 6px;font-size:12px">
        </div>
        <div class="color-picker">
          <span style="font-size:11px;color:var(--muted)">Color:</span>
          <button class="color-dot${ec==='yellow'?' active':''}" data-ec="yellow" style="background:#e8c84a" title="Amarillo"></button>
          <button class="color-dot${ec==='red'   ?' active':''}" data-ec="red"    style="background:#e05050" title="Rojo"></button>
          <button class="color-dot${ec==='blue'  ?' active':''}" data-ec="blue"   style="background:#4080e0" title="Azul"></button>
          <button class="color-dot${ec==='green' ?' active':''}" data-ec="green"  style="background:#3caa3c" title="Verde"></button>
          <button class="color-dot${ec==='orange'?' active':''}" data-ec="orange" style="background:#d08020" title="Naranja"></button>
          <button class="color-dot${ec==='purple'?' active':''}" data-ec="purple" style="background:#9040d0" title="Morado"></button>
        </div>
        <div class="edit-actions">
          <button class="edit-action-btn" id="${prefix}-edit-undo" ${n===0?'disabled':''}>↩ Undo</button>
          <button class="edit-action-btn success" id="${prefix}-edit-save" ${n===0?'disabled':''}>✓ Guardar</button>
          <button class="edit-action-btn danger" id="${prefix}-edit-cancel">✕ Cancelar</button>
        </div>
      </div>`;
    area.querySelectorAll('[data-ec]').forEach(dot => {
      dot.addEventListener('click', () => {
        state.editColor = dot.dataset.ec;
        area.querySelectorAll('[data-ec]').forEach(d => d.classList.toggle('active', d === dot));
      });
    });
    document.getElementById(`${prefix}-edit-undo`).addEventListener('click', () => {
      if (!state[editStepsKey].length) return;
      state[editStepsKey].pop();
      _applyIntervalEditHL(prefix);
      // Update counter in-place — re-rendering would reset the label input
      const n = state[editStepsKey].length;
      const counter = document.querySelector(`#${prefix}-edit-area .edit-counter`);
      if (counter) counter.textContent = n === 0 ? 'Clic en botones para asignar etiquetas' : `${n} asignado(s)`;
      const undoBtn = document.getElementById(`${prefix}-edit-undo`);
      const saveBtn = document.getElementById(`${prefix}-edit-save`);
      if (undoBtn) undoBtn.disabled = n === 0;
      if (saveBtn) saveBtn.disabled = n === 0;
    });
    document.getElementById(`${prefix}-edit-save`).addEventListener('click',  () => _exitIntervalEdit(prefix, intervals, true));
    document.getElementById(`${prefix}-edit-cancel`).addEventListener('click', () => _exitIntervalEdit(prefix, intervals, false));
  } else {
    const slotKey  = prefix === 'terc' ? 'tercSlot' : 'sextSlot';
    const curSlot  = state[slotKey] || '1';
    const saveKey  = intervalSaveKey(prefix, curSlot);
    const hasSave  = !!(_storageGet()[prefix + '_saves'] || {})[saveKey];
    area.innerHTML = `<div class="scale-edit-actions">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <label style="font-size:11px;color:var(--muted)">Versión:</label>
        <select id="${prefix}-slot-sel" class="diagram-slot-sel">
          <option value="1" ${curSlot==='1'?'selected':''}>Slot 1</option>
          <option value="2" ${curSlot==='2'?'selected':''}>Slot 2</option>
        </select>
      </div>
      <button class="edit-launch-btn" id="${prefix}-enter-edit">✏️ Editar escala</button>
      ${hasSave ? `<button class="edit-reset-btn" id="${prefix}-reset-edit">↩ Borrar guardado</button>` : ''}
    </div>`;
    document.getElementById(`${prefix}-slot-sel`).addEventListener('change', e => {
      state[slotKey] = e.target.value;
      updateIntervalTab(prefix, intervals);
      _refreshIntervalEditArea(prefix, intervals);
    });
    document.getElementById(`${prefix}-enter-edit`).addEventListener('click', () => {
      const editModeKey  = prefix === 'terc' ? 'tercEditMode' : 'sextEditMode';
      const editStepsKey = prefix === 'terc' ? 'tercEditSteps' : 'sextEditSteps';
      state[editModeKey] = true;
      // Pre-load current highlights — don't start blank
      const preloaded = [];
      currentDiagrams().forEach(d => {
        getHL(d.id).forEach(h => {
          preloaded.push({ diagramId: d.id, row: h.row, btn: h.btn, dir: h.dir, label: h.label, color: h.color || 'yellow' });
        });
      });
      state[editStepsKey] = preloaded;
      renderAllDiagrams();
      _refreshIntervalEditArea(prefix, intervals);
    });
    document.getElementById(`${prefix}-reset-edit`)?.addEventListener('click', () => {
      const d = _storageGet();
      if (d[prefix + '_saves']) delete d[prefix + '_saves'][saveKey];
      _storageSet(d);
      updateIntervalTab(prefix, intervals);
      _refreshIntervalEditArea(prefix, intervals);
    });
  }
}

function _applyIntervalEditHL(prefix) {
  const steps = prefix === 'terc' ? state.tercEditSteps : state.sextEditSteps;
  // Clear all current-tab diagrams first
  currentDiagrams().forEach(d => { setHL(d.id, []); applyHL(d.id); });
  // Re-apply per-diagram with colors
  const byDiagram = {};
  steps.forEach(s => {
    byDiagram[s.diagramId] = byDiagram[s.diagramId] || [];
    byDiagram[s.diagramId].push({ row: s.row, btn: s.btn, dir: s.dir, style: 'highlight', label: s.label, color: s.color || 'yellow' });
  });
  Object.entries(byDiagram).forEach(([id, hl]) => { setHL(parseInt(id), hl); applyHL(parseInt(id)); });
}

function _exitIntervalEdit(prefix, intervals, save) {
  const editModeKey  = prefix === 'terc' ? 'tercEditMode' : 'sextEditMode';
  const editStepsKey = prefix === 'terc' ? 'tercEditSteps' : 'sextEditSteps';
  const rootKey      = prefix === 'terc' ? 'tercRoot'     : 'sextRoot';
  const savedSteps   = [...state[editStepsKey]]; // snapshot before clearing

  if (save) {
    const slotKey = prefix === 'terc' ? 'tercSlot' : 'sextSlot';
    const key = intervalSaveKey(prefix, state[slotKey] || '1');
    const d = _storageGet();
    d[prefix + '_saves'] = d[prefix + '_saves'] || {};
    if (savedSteps.length > 0) {
      d[prefix + '_saves'][key] = savedSteps;
    } else {
      delete d[prefix + '_saves'][key];
    }
    _storageSet(d);
  }

  state[editModeKey]  = false;
  state[editStepsKey] = [];
  renderAllDiagrams(); // re-render without edit-mode class

  if (save && savedSteps.length > 0) {
    // Keep the highlights the user just drew — don't reset to auto-pair view
    _applyStepsHL(savedSteps);
  } else {
    updateIntervalTab(prefix, intervals);
  }
  _refreshIntervalEditArea(prefix, intervals);
}

function _applyStepsHL(steps) {
  currentDiagrams().forEach(d => { setHL(d.id, []); applyHL(d.id); });
  const byDiagram = {};
  steps.forEach(s => {
    byDiagram[s.diagramId] = byDiagram[s.diagramId] || [];
    byDiagram[s.diagramId].push({ row: s.row, btn: s.btn, dir: s.dir, style: 'highlight', label: s.label, color: s.color || 'yellow' });
  });
  Object.entries(byDiagram).forEach(([id, hl]) => { setHL(parseInt(id), hl); applyHL(parseInt(id)); });
}

function updateIntervalTab(prefix, intervals) {
  const rootKey  = prefix === 'terc' ? 'tercRoot'    : 'sextRoot';
  const pairKey  = prefix === 'terc' ? 'tercPairs'   : 'sextPairs';
  const idxKey   = prefix === 'terc' ? 'tercPairIdx' : 'sextPairIdx';

  state[pairKey]  = findIntervalPairs(state.tuning, state[rootKey], intervals);
  state[idxKey]   = 0;

  const listEl = document.getElementById(`${prefix}-pairs`);
  const infoEl = document.getElementById(`${prefix}-info`);
  listEl.innerHTML = '';

  // Check for saved custom fingering for this slot/root
  const slotKey  = prefix === 'terc' ? 'tercSlot' : 'sextSlot';
  const saveKey  = intervalSaveKey(prefix, state[slotKey] || '1');
  const appData  = _storageGet();
  const savedEdit = (appData[prefix + '_saves'] || {})[saveKey];

  if (savedEdit && savedEdit.length > 0) {
    // Show the full saved scale diagram instead of one pair at a time
    _applyStepsHL(savedEdit);
    infoEl.innerHTML = `<strong>${dispNote(state[rootKey], state.notation)}</strong> — escala guardada
      <br><span style="font-size:10px;color:var(--muted)">Clic en par para ver posición individual · Editar para cambiar</span>`;
  } else if (state[pairKey].length === 0) {
    infoEl.innerHTML = '<span class="no-results">No se encontraron pares en esta afinación.</span>';
    currentDiagrams().forEach(d => { setHL(d.id, []); applyHL(d.id); });
    return;
  } else {
    showPair(state[pairKey][0]);
    infoEl.innerHTML = `<strong>${state[pairKey].length}</strong> par(es) · <strong>${dispNote(state[rootKey], state.notation)}</strong>
      <br><span style="font-size:10px;color:var(--muted)">Ambas notas: misma dirección del fuelle</span>`;
  }

  // Always populate the pair list so individual pairs can be previewed
  state[pairKey].forEach((pair, i) => {
    const item = document.createElement('div');
    item.className = `pair-item${i === 0 && !savedEdit ? ' active' : ''}`;
    item.innerHTML = `
      <span class="pair-notes">${dispNote(pair.root.note, state.notation)} + ${dispNote(pair.harmony.note, state.notation)}</span>
      <span class="pair-meta">F${pair.root.row+1}-B${pair.root.btn+1} / F${pair.harmony.row+1}-B${pair.harmony.btn+1}</span>
      <span class="pair-dir ${pair.dir}">${pair.dir==='push' ? '↓' : '↑'}</span>
    `;
    item.title = pair.intervalName;
    item.addEventListener('click', () => {
      state[idxKey] = i;
      listEl.querySelectorAll('.pair-item').forEach((el,j) => el.className = `pair-item${j===i?' active':''}`);
      showPair(pair);
    });
    listEl.appendChild(item);
  });
}

function showPair(pair) {
  const highlights = [
    { row: pair.root.row,    btn: pair.root.btn,    dir: pair.dir, style: 'highlight' },
    { row: pair.harmony.row, btn: pair.harmony.btn, dir: pair.dir, style: 'active'    },
  ];
  setHighlights(highlights);
  applyHighlights();
}

// ── Interval edit click handler ───────────────────────────────────────────────

function _handleIntervalEditClick(prefix, diagramId, rIdx, bIdx, dir) {
  const stepsKey = prefix === 'terc' ? 'tercEditSteps' : 'sextEditSteps';
  const steps = state[stepsKey];
  // Toggle off if same half clicked again
  const existing = steps.findIndex(s => s.row===rIdx && s.btn===bIdx && s.dir===dir && s.diagramId===diagramId);
  if (existing !== -1) {
    steps.splice(existing, 1);
  } else {
    const inputEl = document.getElementById(`${prefix}-label-input`);
    const defaultLabel = String(steps.length + 1);
    const label = inputEl ? inputEl.value.trim() : defaultLabel;
    if (!label) return;
    steps.push({ diagramId, row: rIdx, btn: bIdx, dir, label, color: state.editColor || 'yellow' });
  }
  // Apply highlights per diagram
  const byDiagram = {};
  steps.forEach(s => {
    byDiagram[s.diagramId] = byDiagram[s.diagramId] || [];
    byDiagram[s.diagramId].push({ row: s.row, btn: s.btn, dir: s.dir, style: 'highlight', label: s.label, color: s.color });
  });
  Object.entries(byDiagram).forEach(([id, hl]) => { setHL(parseInt(id), hl); applyHL(parseInt(id)); });
  // Update counter in-place — do NOT call _refreshIntervalEditArea here, it would reset the input
  const n = steps.length;
  const counter = document.querySelector(`#${prefix}-edit-area .edit-counter`);
  if (counter) counter.textContent = n === 0 ? 'Clic en botones para asignar etiquetas' : `${n} asignado(s)`;
  const undoBtn = document.getElementById(`${prefix}-edit-undo`);
  const saveBtn = document.getElementById(`${prefix}-edit-save`);
  if (undoBtn) undoBtn.disabled = n === 0;
  if (saveBtn) saveBtn.disabled = n === 0;
}

// ── Tab: Libre ────────────────────────────────────────────────────────────────

function libreStorageKey(slot) {
  return `libre_v${slot}`;
}

function saveLibreSlot() {
  const d = _storageGet();
  d.libre = d.libre || {};
  d.libre[libreStorageKey(state.libreSlot)] = currentDiagrams().map(diag => ({
    steps: getHL(diag.id).map(h => ({ row: h.row, btn: h.btn, dir: h.dir, label: h.label, color: h.color })),
    note: diag.note || '',
  }));
  _storageSet(d);
  saveDiagramLayout();
}

function loadLibreSlot(slot) {
  const saved = (_storageGet().libre || {})[libreStorageKey(slot)];
  const diagrams = state.tabDiagrams.libre;

  if (!saved || saved.length === 0) {
    while (diagrams.length > 1) { const r = diagrams.pop(); delete _hl[r.id]; }
    if (diagrams.length === 0) { const id = state.nextDiagramId++; _hl[id] = []; diagrams.push({ id, note: '' }); }
    diagrams.forEach(d => { d.note = ''; setHL(d.id, []); });
  } else {
    while (diagrams.length < saved.length) {
      const id = state.nextDiagramId++;
      _hl[id] = [];
      diagrams.push({ id, note: '' });
    }
    while (diagrams.length > saved.length) {
      const r = diagrams.pop();
      delete _hl[r.id];
    }
    saved.forEach((panel, i) => {
      diagrams[i].note = panel.note || '';
      setHL(diagrams[i].id, (panel.steps || []).map(s => ({
        row: s.row, btn: s.btn, dir: s.dir, style: 'highlight', label: s.label, color: s.color,
      })));
    });
  }
  saveDiagramLayout();
  renderAllDiagrams();
  applyHighlights();
}

function handleLibreClick(diagramId, rIdx, bIdx, dir) {
  if (!_hl[diagramId]) _hl[diagramId] = [];
  const hl = _hl[diagramId];
  const existing = hl.findIndex(h => h.row === rIdx && h.btn === bIdx && h.dir === dir);
  if (existing !== -1) {
    hl.splice(existing, 1);
  } else {
    hl.push({ row: rIdx, btn: bIdx, dir, style: 'highlight', label: state.libreNumber, color: state.editColor || 'yellow' });
  }
  applyHL(diagramId);
  saveLibreSlot();
}

function buildLibreUI() {
  const panel = document.getElementById('tab-content');
  const ec = state.editColor || 'yellow';
  panel.innerHTML = `
    <div class="control-group">
      <div class="control-label">Slot</div>
      <div class="libre-slots">
        ${['1','2','3','4'].map(s => `<button class="libre-slot-btn${s===state.libreSlot?' active':''}" data-ls="${s}">S${s}</button>`).join('')}
      </div>
    </div>
    <div class="control-group">
      <div class="control-label">Número</div>
      <div class="libre-nums">
        ${['1','2','3','4','5','6','7','8','9'].map(n => `<button class="libre-num-btn${n===state.libreNumber?' active':''}" data-ln="${n}">${n}</button>`).join('')}
      </div>
    </div>
    <div class="control-group">
      <div class="color-picker">
        <span style="font-size:11px;color:var(--muted)">Color:</span>
        <button class="color-dot${ec==='yellow'?' active':''}" data-ec="yellow" style="background:#e8c84a" title="Amarillo"></button>
        <button class="color-dot${ec==='red'   ?' active':''}" data-ec="red"    style="background:#e05050" title="Rojo"></button>
        <button class="color-dot${ec==='blue'  ?' active':''}" data-ec="blue"   style="background:#4080e0" title="Azul"></button>
        <button class="color-dot${ec==='green' ?' active':''}" data-ec="green"  style="background:#3caa3c" title="Verde"></button>
        <button class="color-dot${ec==='orange'?' active':''}" data-ec="orange" style="background:#d08020" title="Naranja"></button>
        <button class="color-dot${ec==='purple'?' active':''}" data-ec="purple" style="background:#9040d0" title="Morado"></button>
      </div>
    </div>
    <div class="results-info" style="font-size:10px;color:var(--muted)">
      Selecciona número + color, clic en botón del acordeón para marcar. Clic otra vez para borrar.
    </div>`;

  panel.querySelectorAll('[data-ls]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.ls === state.libreSlot) return;
      saveLibreSlot();
      state.libreSlot = btn.dataset.ls;
      panel.querySelectorAll('[data-ls]').forEach(b => b.classList.toggle('active', b === btn));
      loadLibreSlot(state.libreSlot);
    });
  });

  panel.querySelectorAll('[data-ln]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.libreNumber = btn.dataset.ln;
      panel.querySelectorAll('[data-ln]').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  panel.querySelectorAll('[data-ec]').forEach(dot => {
    dot.addEventListener('click', () => {
      state.editColor = dot.dataset.ec;
      panel.querySelectorAll('[data-ec]').forEach(d => d.classList.toggle('active', d === dot));
    });
  });

  loadLibreSlot(state.libreSlot);
}

// ── Tab router ────────────────────────────────────────────────────────────────

function switchTab(tab) {
  // Exit any active edit modes cleanly
  if (state.editMode)      { state.editMode = false; state.editSteps = []; }
  if (state.chordEditMode) { state.chordEditMode = false; state.chordEditSteps = []; state.chordEditDir = null; }
  if (state.tercEditMode)  { state.tercEditMode = false; state.tercEditSteps = []; }
  if (state.sextEditMode)  { state.sextEditMode = false; state.sextEditSteps = []; }

  state.tab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));

  // Clear highlights for this tab's diagrams, then re-render fresh buttons
  currentDiagrams().forEach(d => { _hl[d.id] = []; });
  renderAllDiagrams();

  switch (tab) {
    case 'chords':   buildChordsUI();   break;
    case 'scales':   buildScalesUI();   break;
    case 'terceras': buildTercerasUI(); break;
    case 'sextas':   buildSextasUI();   break;
    case 'armonica': buildArmonicaUI(); break;
    case 'libre':    buildLibreUI();    break;
  }
}

// ── Tuning switch ─────────────────────────────────────────────────────────────

function switchTuning(key) {
  // Shift all roots by the same interval so relative position is preserved.
  // G root on G accordion → F root on F accordion (same fingering, different notes).
  const delta = (noteNum(key) - noteNum(state.tuning) + 12) % 12;
  ['chordRoot','scaleRoot','tercRoot','sextRoot','armonicaRoot'].forEach(k => {
    state[k] = numNote((noteNum(state[k]) + delta) % 12);
  });
  state.tuning = key;
  document.querySelectorAll('.tuning-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.tuning === key);
  });
  switchTab(state.tab); // handles edit mode exit + render + tab rebuild
}

// ── Notation switch ──────────────────────────────────────────────────────────

function switchNotation(style) {
  state.notation = style;
  document.querySelectorAll('.notation-toggle button').forEach(b => {
    b.classList.toggle('active', b.dataset.notation === style);
  });
  renderAllDiagrams();
  switchTab(state.tab);
}

// ── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  function setupListeners() {
    document.querySelectorAll('.tuning-pill').forEach(pill => {
      pill.addEventListener('click', () => switchTuning(pill.dataset.tuning));
    });
    document.querySelectorAll('.notation-toggle button').forEach(btn => {
      btn.addEventListener('click', () => switchNotation(btn.dataset.notation));
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    document.getElementById('diagrams-wrapper').addEventListener('click', e => {
      const anyEdit = state.editMode || state.chordEditMode || state.tercEditMode || state.sextEditMode || state.tab === 'libre';
      if (!anyEdit) return;
      const half = e.target.closest('.btn-half');
      if (!half) return;
      const btn = half.closest('.acc-btn');
      if (!btn) return;
      const diagramId = parseInt(btn.dataset.diagram);
      const rIdx = parseInt(btn.dataset.row);
      const bIdx = parseInt(btn.dataset.btn);
      const dir  = half.classList.contains('btn-push') ? 'push' : 'pull';
      if (state.editMode)           handleEditClick(diagramId, rIdx, bIdx, dir);
      else if (state.chordEditMode) handleChordEditClick(diagramId, rIdx, bIdx, dir);
      else if (state.tercEditMode)  _handleIntervalEditClick('terc', diagramId, rIdx, bIdx, dir);
      else if (state.sextEditMode)  _handleIntervalEditClick('sext', diagramId, rIdx, bIdx, dir);
      else if (state.tab === 'libre') handleLibreClick(diagramId, rIdx, bIdx, dir);
    });
  }

  function startApp(savedData) {
    window._appData = savedData || {};

    // Restore diagram layout (tabs, slot/vIdx per diagram, nextDiagramId)
    if (savedData && savedData.tabDiagrams) {
      Object.keys(savedData.tabDiagrams).forEach(tab => {
        if (state.tabDiagrams[tab]) {
          state.tabDiagrams[tab] = savedData.tabDiagrams[tab];
        }
      });
      if (savedData.nextDiagramId) {
        state.nextDiagramId = savedData.nextDiagramId;
      }
      // Initialize _hl for every restored diagram ID
      Object.values(state.tabDiagrams).forEach(diagrams => {
        diagrams.forEach(d => { if (!_hl[d.id]) _hl[d.id] = []; });
      });
      // Ensure nextDiagramId is beyond all known IDs (guards against cross-tab conflicts)
      const allIds = Object.values(state.tabDiagrams).flat().map(d => d.id);
      if (allIds.length > 0) state.nextDiagramId = Math.max(state.nextDiagramId, Math.max(...allIds) + 1);
    }

    setupListeners();
    renderAllDiagrams();
    switchTab(state.tab);
  }

  // Load persisted data from file via pywebview, then start
  let started = false;
  function tryStart() {
    if (started) return;
    started = true;
    if (window.pywebview && window.pywebview.api) {
      window.pywebview.api.load_data()
        .then(raw => { try { startApp(JSON.parse(raw)); } catch { startApp({}); } })
        .catch(() => startApp({}));
    } else {
      startApp({});
    }
  }

  window.addEventListener('pywebviewready', tryStart);
  // Fallback: if pywebviewready already fired or running in a plain browser
  setTimeout(tryStart, 300);
});
