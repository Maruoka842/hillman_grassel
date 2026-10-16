/**
 * Hillman–Grassl correspondence — interactive demo
 * H (λ-array → rpp) and H⁻¹ (rpp → λ-array) shown simultaneously.
 * Reference: R. P. Stanley, Enumerative Combinatorics, Vol. 2, Section 7.22.
 */

'use strict';

// ═══════════════════════════════════════════════════════════════
// § 1  MATH UTILITIES
// ═══════════════════════════════════════════════════════════════

const clone2D   = a => a.map(r => r.slice());
const zeroArray = λ => λ.map(n => new Array(n).fill(0));

function parsePartition(str) {
  const nums = str.split(',').map(s => Number(s.trim()));
  if (nums.some(n => !Number.isInteger(n) || n <= 0)) return null;
  return nums.slice().sort((a, b) => b - a);
}

function transpose2D(M) {
  if (!M || !M.length) return [];
  return Array.from({ length: M[0].length }, (_, j) => {
    const col = [];
    for (const row of M) { if (row.length <= j) break; col.push(row[j]); }
    return col;
  });
}

function conjugate(λ) {
  const c = [];
  for (let j = 0; j < (λ[0] || 0); j++) {
    let k = 0; while (k < λ.length && λ[k] > j) k++;
    c.push(k);
  }
  return c;
}

function isRPP(λ, π) {
  for (let i = 0; i < λ.length; i++)
    for (let j = 0; j < λ[i]; j++) {
      if (j + 1 < λ[i]          && π[i][j] > π[i][j + 1])     return false;
      if (i + 1 < λ.length && j < λ[i + 1] && π[i][j] > π[i + 1][j]) return false;
    }
  return true;
}

// ═══════════════════════════════════════════════════════════════
// § 2  ALGORITHM: H (λ-array → rpp)
// ═══════════════════════════════════════════════════════════════
function hillmanGrasslWithSteps(λ, M) {
  const l  = λ.length;
  const Mt = transpose2D(M);
  const colMults = [];
  for (let j = 0; j < Mt.length; j++) {
    const cm = [];
    for (let r = 0; r < Mt[j].length; r++)
      for (let k = 0; k < Mt[j][r]; k++) cm.push([r, j]);
    cm.reverse();
    colMults.push(...cm);
  }
  colMults.reverse();

  const res = zeroArray(λ), steps = [];
  for (const [r, s] of colMults) {
    const before = clone2D(res);
    let i = r, j = λ[r] - 1;
    const path = [];
    while (true) {
      path.push([i, j]);
      const old = res[i][j]; res[i][j]++;
      const dn = (i + 1 < l) && (j < λ[i + 1]) && (old === res[i + 1][j]);
      if (dn) { i++; } else { if (j === s) break; j--; }
    }
    steps.push({ hookRow: r, hookCol: s, path: path.slice(), before, after: clone2D(res) });
  }
  return { rpp: res, steps };
}

// ═══════════════════════════════════════════════════════════════
// § 3  ALGORITHM: H⁻¹ (rpp → λ-array)
// ═══════════════════════════════════════════════════════════════
function hillmanGrasslInverseWithSteps(λ, πIn) {
  const Mt  = transpose2D(πIn);
  const res = zeroArray(λ), steps = [];
  let iter  = 0;
  while (true) {
    if (++iter > 200000) break;
    let s = -1;
    for (let j = 0; j < Mt.length; j++) { if (Mt[j].some(v => v !== 0)) { s = j; break; } }
    if (s === -1) break;

    const rppBefore = transpose2D(Mt), mBefore = clone2D(res);
    let j = s, col = Mt[j], i = col.length - 1;
    const path = [];
    while (true) {
      path.push([i, j]);
      const old = col[i]; col[i]--;
      if (i > 0 && old === col[i - 1]) { i--; }
      else { j++; if (j === λ[i]) break; col = Mt[j]; }
    }
    res[i][s]++;
    steps.push({
      startCol: s, path: path.slice(), outRow: i, outCol: s,
      rppBefore, rppAfter: transpose2D(Mt), mBefore, mAfter: clone2D(res),
    });
  }
  return { array: res, steps };
}

// ═══════════════════════════════════════════════════════════════
// § 4  CANVAS RENDERER
// ═══════════════════════════════════════════════════════════════

const CELL = 52, PAD = 4;

function drawDiagram(canvas, λ, data, opts = {}) {
  const { pathSet = new Set(), startCell = null, endCell = null,
          dimSet  = new Set(), ringCell  = null } = opts;
  const rows = λ.length, cols = λ[0] || 0;
  canvas.width  = cols * CELL + PAD * 2;
  canvas.height = rows * CELL + PAD * 2;
  const ctx = canvas.getContext('2d');
  const bg  = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#1e293b');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < λ[i]; j++) {
      const x = PAD + j * CELL, y = PAD + i * CELL, key = `${i},${j}`;
      let fill = '#1e3a5f';
      if      (key === startCell) fill = '#fbbf24';
      else if (key === endCell)   fill = '#34d399';
      else if (pathSet.has(key))  fill = '#22d3ee';
      else if (dimSet.has(key))   fill = '#166534';
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.roundRect(x+1, y+1, CELL-2, CELL-2, 4); ctx.fill();

      if (ringCell === key) {
        ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(x+2, y+2, CELL-4, CELL-4, 4); ctx.stroke();
      }
      const onPath = pathSet.has(key) || key === startCell || key === endCell;
      ctx.strokeStyle = onPath ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.10)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x+1, y+1, CELL-2, CELL-2, 4); ctx.stroke();

      const v = data[i][j];
      ctx.fillStyle    = onPath ? '#0f172a' : '#e2e8f0';
      ctx.font         = `bold ${v > 9 ? 15 : 18}px 'Cascadia Code','Consolas',monospace`;
      ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(v), x + CELL/2, y + CELL/2);
    }
  }
}

function drawArrows(ctx, path) {
  if (path.length < 2) return;
  ctx.strokeStyle = 'rgba(255,255,255,.72)'; ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.lineWidth = 2.5;
  for (let k = 0; k < path.length - 1; k++) {
    const [r1,c1] = path[k], [r2,c2] = path[k+1];
    arrow(ctx, PAD+c1*CELL+CELL/2, PAD+r1*CELL+CELL/2, PAD+c2*CELL+CELL/2, PAD+r2*CELL+CELL/2);
  }
}
function arrow(ctx, x1, y1, x2, y2) {
  const a = Math.atan2(y2-y1, x2-x1), sh = 14, hl = 10;
  const sx = x1+Math.cos(a)*sh, sy = y1+Math.sin(a)*sh;
  const ex = x2-Math.cos(a)*sh, ey = y2-Math.sin(a)*sh;
  ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex,ey);
  ctx.lineTo(ex-hl*Math.cos(a-.38), ey-hl*Math.sin(a-.38));
  ctx.lineTo(ex-hl*Math.cos(a+.38), ey-hl*Math.sin(a+.38));
  ctx.closePath(); ctx.fill();
}

// ═══════════════════════════════════════════════════════════════
// § 5  PLAYBACK ENGINE
// ═══════════════════════════════════════════════════════════════

const DELAY = 900;
const pb    = {};   // pb['fwd'] | pb['inv']

function pbInit(id, data) {
  if (pb[id]?.timer) clearInterval(pb[id].timer);
  pb[id] = { ...data, idx: -1, timer: null, playing: false };
  const btn = document.getElementById(`${id}-play-btn`);
  if (btn) { btn.textContent = '▶ 再生'; btn.classList.remove('playing'); }
}

// ── render helpers ────────────────────────────────────────────

function renderFwd(idx) {
  const st = pb['fwd']; if (!st) return;
  st.idx = Math.max(-1, Math.min(idx, st.steps.length - 1));
  const { λ, M, steps } = st, s = st.idx;

  let rpp, pathSet, startCell, endCell, hookCell, dimSet, path;
  const changed = new Set();

  if (s < 0) {
    rpp = zeroArray(λ); pathSet = new Set(); startCell = endCell = hookCell = null;
    dimSet = new Set(); path = [];
  } else {
    const step = steps[s];
    rpp       = clone2D(step.after);
    path      = step.path;
    pathSet   = new Set(path.map(([r,c]) => `${r},${c}`));
    startCell = `${path[0][0]},${path[0][1]}`;
    endCell   = `${path[path.length-1][0]},${path[path.length-1][1]}`;
    hookCell  = `${step.hookRow},${step.hookCol}`;
    for (let k = 0; k < s; k++) steps[k].path.forEach(([r,c]) => changed.add(`${r},${c}`));
    dimSet = changed;
  }

  drawDiagram(document.getElementById('fwd-canvas-in'),  λ, M,  { ringCell: hookCell });
  const co = document.getElementById('fwd-canvas-out');
  drawDiagram(co, λ, rpp, { pathSet, startCell, endCell, dimSet });
  if (s >= 0 && path.length > 1) drawArrows(co.getContext('2d'), path);

  setUI('fwd', s, steps.length,
    s < 0 ? '▶ 再生 または「次へ」を押してください。'
          : `<span class="sd-hook">M[${steps[s].hookRow+1}][${steps[s].hookCol+1}] のトークンを挿入</span>`
          + `<br><span class="sd-path">経路: ${steps[s].path.map(([r,c])=>`(${r+1},${c+1})`).join(' → ')}</span>`
  );

  const banner = document.getElementById('fwd-final-banner');
  if (s === steps.length - 1 && steps.length > 0) {
    banner.classList.remove('hidden');
    banner.innerHTML = '<span class="ok">✓ H(M) 完成！</span>';
  } else { banner.classList.add('hidden'); }
}

function renderInv(idx) {
  const st = pb['inv']; if (!st) return;
  st.idx = Math.max(-1, Math.min(idx, st.steps.length - 1));
  const { λ, inputRPP, steps } = st, s = st.idx;

  let curRPP, curM, pathSet, startCell, endCell, ringCell, dimRPP, dimM, path;
  const changedRPP = new Set(), changedM = new Set();

  if (s < 0) {
    curRPP = clone2D(inputRPP); curM = zeroArray(λ);
    pathSet = new Set(); startCell = endCell = ringCell = null;
    dimRPP = new Set(); dimM = new Set(); path = [];
  } else {
    const step = steps[s];
    curRPP    = clone2D(step.rppAfter);
    curM      = clone2D(step.mAfter);
    path      = step.path;
    pathSet   = new Set(path.map(([r,c]) => `${r},${c}`));
    startCell = `${path[0][0]},${path[0][1]}`;
    endCell   = `${path[path.length-1][0]},${path[path.length-1][1]}`;
    ringCell  = `${step.outRow},${step.outCol}`;
    for (let k = 0; k < s; k++) {
      steps[k].path.forEach(([r,c]) => changedRPP.add(`${r},${c}`));
      changedM.add(`${steps[k].outRow},${steps[k].outCol}`);
    }
    dimRPP = changedRPP; dimM = changedM;
  }

  const ci = document.getElementById('inv-canvas-in');
  drawDiagram(ci, λ, curRPP, { pathSet, startCell, endCell, dimSet: dimRPP });
  if (s >= 0 && path.length > 1) drawArrows(ci.getContext('2d'), path);
  drawDiagram(document.getElementById('inv-canvas-out'), λ, curM, { dimSet: dimM, ringCell });

  setUI('inv', s, steps.length,
    s < 0 ? '▶ 再生 または「次へ」を押してください。'
          : `<span class="sd-hook">最左非ゼロ列 s = ${steps[s].startCol+1}  格子路を構成</span>`
          + `<br><span class="sd-path">格子路: ${steps[s].path.map(([r,c])=>`(${r+1},${c+1})`).join(' → ')}</span>`
          + `<br><span class="sd-out">→ M[${steps[s].outRow+1}][${steps[s].outCol+1}] += 1</span>`
  );

  const banner = document.getElementById('inv-final-banner');
  if (s === steps.length - 1 && steps.length > 0) {
    banner.classList.remove('hidden');
    banner.innerHTML = '<span class="ok">✓ H⁻¹(π) 完成！</span>';
  } else { banner.classList.add('hidden'); }
}

function setUI(id, idx, total, descHTML) {
  document.getElementById(`${id}-step-counter`).textContent =
    idx < 0 ? `ステップ 0 / ${total}` : `ステップ ${idx+1} / ${total}`;
  document.getElementById(`${id}-progress`).style.width =
    total === 0 ? '100%' : `${Math.max(0, Math.round(((idx+1)/total)*100))}%`;
  document.getElementById(`${id}-step-desc`).innerHTML = descHTML;

  document.querySelectorAll(`.pb-btn[data-pb="${id}"][data-action="prev"]`)
    .forEach(b => { b.disabled = idx < 0; });
  document.querySelectorAll(`.pb-btn[data-pb="${id}"][data-action="next"]`)
    .forEach(b => { b.disabled = idx >= total - 1; });
}

const renderFns = { fwd: renderFwd, inv: renderInv };

function pbStep(id, d)   { const s = pb[id]; if (s) renderFns[id](s.idx + d); }
function pbJump(id, pos) { const s = pb[id]; if (s) renderFns[id](pos === 'start' ? -1 : s.steps.length - 1); }

function pbTogglePlay(id) {
  const s = pb[id]; if (!s) return;
  const btn = document.getElementById(`${id}-play-btn`);
  if (s.playing) {
    clearInterval(s.timer); s.timer = null; s.playing = false;
    btn.textContent = '▶ 再生'; btn.classList.remove('playing');
  } else {
    if (s.idx >= s.steps.length - 1) renderFns[id](-1);
    s.playing = true; btn.textContent = '⏸ 一時停止'; btn.classList.add('playing');
    s.timer = setInterval(() => {
      if (s.idx >= s.steps.length - 1) { pbTogglePlay(id); return; }
      renderFns[id](s.idx + 1);
    }, DELAY);
  }
}

// delegate all playback clicks
document.addEventListener('click', e => {
  const b = e.target.closest('.pb-btn[data-pb]'); if (!b) return;
  const id = b.dataset.pb, act = b.dataset.action;
  if (act === 'rewind') pbJump(id, 'start');
  else if (act === 'prev') pbStep(id, -1);
  else if (act === 'play') pbTogglePlay(id);
  else if (act === 'next') pbStep(id, +1);
  else if (act === 'end')  pbJump(id, 'end');
});

// ═══════════════════════════════════════════════════════════════
// § 7  GRID BUILDER HELPERS
// ═══════════════════════════════════════════════════════════════

function buildGrid(el, λ, vals) {
  el.innerHTML = '';
  for (let i = 0; i < λ.length; i++) {
    const row = document.createElement('div'); row.className = 'grid-row';
    for (let j = 0; j < λ[i]; j++) {
      const inp = document.createElement('input');
      inp.type = 'number'; inp.min = '0'; inp.value = vals?.[i]?.[j] ?? 0;
      inp.dataset.row = i; inp.dataset.col = j;
      inp.setAttribute('aria-label', `[${i+1}][${j+1}]`);
      row.appendChild(inp);
    }
    el.appendChild(row);
  }
}

function readGrid(el, λ) {
  const M = zeroArray(λ); let ok = true;
  el.querySelectorAll('input').forEach(inp => {
    const r = +inp.dataset.row, c = +inp.dataset.col;
    const raw = inp.value.trim();
    const v = raw === '' ? NaN : Number(raw);
    if (!Number.isSafeInteger(v) || v < 0 || !M[r] || c < 0 || c >= M[r].length) { ok = false; return; }
    M[r][c] = v;
  });
  return ok ? M : null;
}

function sizeCanvas(canvas, λ) {
  canvas.style.width  = ((λ[0]||0)*CELL + PAD*2) + 'px';
  canvas.style.height = (λ.length   *CELL + PAD*2) + 'px';
}

// ═══════════════════════════════════════════════════════════════
// § 8  SHARED λ INPUT & SETUP
// ═══════════════════════════════════════════════════════════════

const FWD_EX = {
  '3,3,1':     [[1,2,0],[1,0,1],[1]],
  '4,3,2,1':   [[1,1,0,0],[1,0,1],[0,1],[1]],
  '5,4,4,2,1': [[2,1,0,1,0],[1,0,2,1],[0,1,0,1],[1,0],[1]],
  '4,4,4,4':   [[1,0,1,0],[0,1,0,1],[1,0,1,0],[0,1,0,1]],
};
const INV_EX = {
  '3,3,1':     [[0,1,3],[2,4,4],[3]],
  '4,3,2,1':   [[0,1,2,2],[1,3,3],[2,3],[3]],
  '5,4,4,2,1': [[0,1,3,4,4],[1,3,4,5],[1,4,4,5],[4,5],[5]],
  '4,4,4,4':   [[1,1,2,2],[1,1,2,2],[2,2,3,3],[2,2,3,3]],
};

let currentλ = null;

function setupBothGrids(λ) {
  // 未テスト
  // 分割を切り替える際に、旧デモの再生タイマーを停止して表示状態を初期化する。
  // 計算量: O(1)
  for (const id of ['fwd', 'inv']) {
    if (pb[id]?.timer) clearInterval(pb[id].timer);
    if (pb[id]) { pb[id].timer = null; pb[id].playing = false; }
    const btn = document.getElementById(`${id}-play-btn`);
    if (btn) { btn.textContent = '▶ 再生'; btn.classList.remove('playing'); }
  }

  currentλ = λ;
  const key = λ.join(',');

  // build input grids
  buildGrid(document.getElementById('fwd-array-grid'), λ, FWD_EX[key]);
  buildGrid(document.getElementById('inv-array-grid'), λ, INV_EX[key]);

  // show input area
  document.getElementById('both-input-area').classList.remove('hidden');

  // hide demo areas until computed
  document.getElementById('fwd-demo-area').classList.add('hidden');
  document.getElementById('inv-demo-area').classList.add('hidden');
  document.getElementById('inv-rpp-error').classList.add('hidden');
}

document.getElementById('shared-gen-btn').addEventListener('click', () => {
  const λ = parsePartition(document.getElementById('shared-partition-input').value);
  if (!λ) { alert('分割が無効です（例: 5,4,4,2,1）'); return; }
  setupBothGrids(λ);
});

// ── preset buttons ──────────────────────────────────────────
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('shared-partition-input').value = btn.dataset.val;
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('shared-gen-btn').click();
  });
});

// ═══════════════════════════════════════════════════════════════
// § 9  COMPUTE BUTTONS
// ═══════════════════════════════════════════════════════════════

document.getElementById('fwd-compute-btn').addEventListener('click', () => {
  const λ = currentλ; if (!λ) return;
  const M = readGrid(document.getElementById('fwd-array-grid'), λ);
  if (!M) { alert('全マスに 0 以上の整数を入力してください。'); return; }

  const { rpp, steps } = hillmanGrasslWithSteps(λ, M);
  ['fwd-canvas-in','fwd-canvas-out'].forEach(id => sizeCanvas(document.getElementById(id), λ));
  pbInit('fwd', { λ, M, steps });

  document.getElementById('fwd-demo-area').classList.remove('hidden');
  document.getElementById('fwd-demo-area').scrollIntoView({ behavior:'smooth', block:'start' });
  renderFwd(-1);
});

document.getElementById('inv-compute-btn').addEventListener('click', () => {
  const λ = currentλ; if (!λ) return;
  const π = readGrid(document.getElementById('inv-array-grid'), λ);
  if (!π) { alert('全マスに 0 以上の整数を入力してください。'); return; }

  const errEl = document.getElementById('inv-rpp-error');
  if (!isRPP(λ, π)) { errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');

  const { array, steps } = hillmanGrasslInverseWithSteps(λ, π);
  ['inv-canvas-in','inv-canvas-out'].forEach(id => sizeCanvas(document.getElementById(id), λ));
  pbInit('inv', { λ, inputRPP: π, steps });

  document.getElementById('inv-demo-area').classList.remove('hidden');
  document.getElementById('inv-demo-area').scrollIntoView({ behavior:'smooth', block:'start' });
  renderInv(-1);
});

// live rpp validation
document.getElementById('inv-array-grid').addEventListener('input', () => {
  if (!currentλ) return;
  const π = readGrid(document.getElementById('inv-array-grid'), currentλ);
  const errEl = document.getElementById('inv-rpp-error');
  if (π) errEl.classList.toggle('hidden', isRPP(currentλ, π));
});

/**
 * 未テスト
 * 入力された λ-配列 M に対する rpp H(M) を計算し、H⁻¹ の入力グリッドに反映する。
 * 計算量: O(S · |λ|) （S は M のエントリの総和、|λ| は分割 λ の大きさ）
 */
function syncMToRPP() {
  if (!currentλ) return;
  const M = readGrid(document.getElementById('fwd-array-grid'), currentλ);
  if (!M) { alert('全マスに 0 以上の整数を入力してください。'); return; }
  const { rpp } = hillmanGrasslWithSteps(currentλ, M);
  buildGrid(document.getElementById('inv-array-grid'), currentλ, rpp);
  document.getElementById('inv-rpp-error').classList.add('hidden');
}

/**
 * 未テスト
 * 入力された rpp π に対する λ-配列 H⁻¹(π) を計算し、H の入力グリッドに反映する。
 * 計算量: O(S · |λ|) （S は π のエントリの総和、|λ| は分割 λ の大きさ）
 */
function syncRPPToM() {
  if (!currentλ) return;
  const π = readGrid(document.getElementById('inv-array-grid'), currentλ);
  if (!π) { alert('全マスに 0 以上の整数を入力してください。'); return; }
  const errEl = document.getElementById('inv-rpp-error');
  if (!isRPP(currentλ, π)) { errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');
  const { array } = hillmanGrasslInverseWithSteps(currentλ, π);
  buildGrid(document.getElementById('fwd-array-grid'), currentλ, array);
}

document.getElementById('fwd-sync-btn').addEventListener('click', syncMToRPP);
document.getElementById('inv-sync-btn').addEventListener('click', syncRPPToM);

// ═══════════════════════════════════════════════════════════════
// § 10  PAGE LOAD
// ═══════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
  // mark default preset active
  const defVal = document.getElementById('shared-partition-input').value.replace(/\s/g,'');
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.val.replace(/\s/g,'') === defVal);
  });
  // generate grids
  document.getElementById('shared-gen-btn').click();
});

