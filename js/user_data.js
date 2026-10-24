import { TOOLS, UPGRADES, SETTINGS, statsFor } from './config.js';
import { calculateScore, normalizeCatches } from './scoring.js';

export function createState() {
  return { money: 0, upgrades: Object.fromEntries(Object.keys(UPGRADES).map(k => [k, 0])),
    equipment: 'spear', tools: { spear: null, net: 0, bigNet: 0 }, trips: 0,
    currentCatch: {}, lastResult: null, screen: 'title', activeTrip: null, settledTrip: 0 };
}
export function saveState(state, storage) {
  try { (storage ?? globalThis.localStorage).setItem(SETTINGS.saveKey, JSON.stringify({ version: 1, ...state })); return true; }
  catch { return false; }
}
export function loadState(storage) {
  const state = createState();
  try {
    const raw = JSON.parse((storage ?? globalThis.localStorage).getItem(SETTINGS.saveKey));
    if (!raw || raw.version !== 1) return state;
    const integer = (v, min, max, fallback = 0) => Number.isSafeInteger(v) && v >= min && v <= max ? v : fallback;
    state.money = integer(raw.money, -1000000000, 1000000000);
    state.trips = integer(raw.trips, 0, 1000000000);
    state.settledTrip = integer(raw.settledTrip, 0, state.trips);
    for (const [id, def] of Object.entries(UPGRADES)) state.upgrades[id] = integer(raw.upgrades?.[id], 0, def.max);
    for (const id of ['net', 'bigNet']) state.tools[id] = integer(raw.tools?.[id], 0, TOOLS[id].durability);
    if (Object.hasOwn(TOOLS, raw.equipment) && (raw.equipment === 'spear' || state.tools[raw.equipment] > 0)) state.equipment = raw.equipment;
    // 更新時は途中の漁を放棄。確定済み結果だけ復元し、再入金しない。
    if (raw.lastResult?.catches) {
      const catches = normalizeCatches(raw.lastResult.catches);
      const reduction = Number.isFinite(raw.lastResult.penaltyReduction) ? raw.lastResult.penaltyReduction : 0;
      state.lastResult = { ...calculateScore(catches, { penaltyReduction: reduction }), catches,
        penaltyReduction: reduction, trip: integer(raw.lastResult.trip, 0, state.trips),
        brokenTool: Object.hasOwn(TOOLS, raw.lastResult.brokenTool) ? raw.lastResult.brokenTool : null };
    }
  } catch { /* 保存拒否・壊れた保存データでも開始可能 */ }
  return state;
}
export function beginTrip(state) {
  if (state.activeTrip) return null;
  const trip = { id: ++state.trips, equipment: state.equipment, stats: statsFor(state) };
  state.currentCatch = {};
  state.activeTrip = trip;
  return trip;
}
// 結果確定・入金・耐久度消費を一箇所に集約。
export function settleTrip(state, tripId, catches) {
  const trip = state.activeTrip;
  if (!trip || trip.id !== tripId || state.settledTrip >= tripId) return null;
  const normalized = normalizeCatches(catches);
  const result = { ...calculateScore(normalized, trip.stats), catches: normalized,
    penaltyReduction: trip.stats.penaltyReduction, trip: tripId, brokenTool: null };
  state.money += result.totalScore;
  if (trip.equipment !== 'spear') {
    state.tools[trip.equipment] = Math.max(0, state.tools[trip.equipment] - 1);
    if (!state.tools[trip.equipment]) { state.equipment = 'spear'; result.brokenTool = trip.equipment; }
  }
  state.currentCatch = normalized;
  state.lastResult = result;
  state.settledTrip = tripId;
  state.activeTrip = null;
  return result;
}
