// Local trade storage for the phone app (localStorage inside the Android WebView)
// plus the same status / P&L / statistics rules as the desktop app.
import { useSyncExternalStore } from 'react';
import { calcTrade, needsFxRate } from '../shared/instruments';

const KEY = 'tl_mobile_trades_v1';
const SETTINGS_KEY = 'tl_mobile_settings_v1';

export const isNum = (v) => v !== null && v !== undefined && v !== '' && !isNaN(Number(v));
const toNum = (v, d = 0) => (isNum(v) ? Number(v) : d);
const normSide = (s) => (s === 'short' ? 'short' : 'long');

// ---------- persistence ----------

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Array.isArray(d.trades)) return d;
  } catch (_) {}
  return { nextId: 1, trades: [] };
}

let state = load();
const listeners = new Set();

function commit(next) {
  state = { nextId: next.nextId, trades: next.trades };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) {}
  listeners.forEach((f) => f());
}

const subscribe = (f) => {
  listeners.add(f);
  return () => listeners.delete(f);
};

export const useTrades = () =>
  useSyncExternalStore(subscribe, () => state.trades, () => state.trades);

// ---------- one trade ----------

// Validates the input, recalculates everything and returns a full record.
function buildRecord(input, base = {}) {
  const m = { ...base, ...input };
  const symbol = String(m.symbol || '').trim().toUpperCase();
  const entryPrice = Number(m.entryPrice);
  const quantity = Number(m.quantity);
  if (!symbol) throw new Error('Symbol is required');
  if (!isNum(m.entryPrice) || entryPrice <= 0) throw new Error('Entry price must be greater than 0');
  if (!isNum(m.quantity) || quantity <= 0) throw new Error('Lot size must be greater than 0');
  if (m.exitPrice !== null && m.exitPrice !== undefined && m.exitPrice !== '' && !isNum(m.exitPrice)) {
    throw new Error('Exit price must be a valid number');
  }
  if (m.fees !== '' && m.fees != null && !isNum(m.fees)) throw new Error('Fees must be a valid number');

  const hasExit = isNum(m.exitPrice);
  const exitPrice = hasExit ? Number(m.exitPrice) : null;
  const row = {
    symbol,
    side: normSide(m.side),
    entryPrice,
    quantity,
    fees: toNum(m.fees, 0),
    fxRate: needsFxRate(symbol) ? toNum(m.fxRate, 0) : 0,
  };
  const r = calcTrade({ ...row, exitPrice });
  const risk = toNum(m.riskAmount, 0);
  const reward = toNum(m.rewardAmount, 0);

  return {
    ...base,
    ...row,
    exitPrice,
    entryTime: m.entryTime || new Date().toISOString().slice(0, 16),
    exitTime: hasExit ? m.exitTime || new Date().toISOString().slice(0, 16) : null,
    notes: m.notes || '',
    strategy: m.strategy || '',
    status: !hasExit ? 'open' : m.status === 'breakeven' ? 'breakeven' : 'closed',
    pnl: r.pnl,
    pnlPercent: r.pnlPercent,
    pips: r.pips,
    positionSize: r.positionSize,
    riskAmount: risk,
    rewardAmount: reward,
    riskRewardRatio: risk && reward ? +(reward / risk).toFixed(2) : 0,
  };
}

export function addTrade(input) {
  const id = state.nextId;
  const rec = buildRecord(input, { id, createdAt: new Date().toISOString() });
  commit({ nextId: id + 1, trades: [...state.trades, rec] });
  return id;
}

export function updateTrade(id, input) {
  const old = state.trades.find((t) => t.id === id);
  if (!old) throw new Error('Trade not found');
  const rec = buildRecord(input, old);
  commit({ nextId: state.nextId, trades: state.trades.map((t) => (t.id === id ? rec : t)) });
}

export function deleteTrade(id) {
  commit({ nextId: state.nextId, trades: state.trades.filter((t) => t.id !== id) });
}

export function clearAll() {
  commit({ nextId: 1, trades: [] });
}

// ---------- backup / restore / csv ----------

export function exportJSON() {
  return JSON.stringify({ app: 'TradeLogs Pro', version: 1, exportedAt: new Date().toISOString(), trades: state.trades }, null, 2);
}

// Replaces all trades with the ones in a backup file. Returns how many were loaded.
export function importJSON(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data.trades;
  if (!Array.isArray(list)) throw new Error('This file is not a TradeLogs backup');
  let id = 1;
  const trades = list.map((t) => buildRecord(t, { id: id++, createdAt: t.createdAt || new Date().toISOString() }));
  commit({ nextId: id, trades });
  return trades.length;
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(trades) {
  const cols = ['id', 'symbol', 'side', 'entryPrice', 'exitPrice', 'quantity', 'pips', 'fees', 'entryTime', 'exitTime', 'status', 'pnl', 'pnlPercent', 'strategy', 'notes'];
  const head = ['id', 'symbol', 'side', 'entryPrice', 'exitPrice', 'lotSize', 'pipsOrPoints', 'fees', 'entryTime', 'exitTime', 'status', 'pnl', 'pnlPercent', 'strategy', 'notes'];
  const rows = trades.map((t) => cols.map((c) => csvCell(t[c])).join(','));
  return [head.join(','), ...rows].join('\n');
}

// ---------- settings ----------

export const loadSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch (_) {
    return {};
  }
};
export const saveSettings = (s) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (_) {}
};

// ---------- statistics (same rules as the desktop app) ----------

export function getStatistics(trades) {
  const closed = trades.filter((t) => t.status === 'closed');
  const settled = trades.filter((t) => t.status === 'closed' || t.status === 'breakeven');
  const sum = (a) => a.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
  const n2 = (v) => +(Number(v) || 0).toFixed(2);
  const wins = closed.filter((t) => t.pnl > 0);
  const losses = closed.filter((t) => t.pnl < 0);
  const longC = closed.filter((t) => t.side === 'long');
  const shortC = closed.filter((t) => t.side === 'short');
  const avg = (a) => (a.length ? sum(a) / a.length : 0);

  const r = {
    totalTrades: trades.length,
    openTrades: trades.filter((t) => t.status === 'open').length,
    closedTrades: closed.length,
    breakevenTrades: trades.filter((t) => t.status === 'breakeven').length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    totalPnL: n2(sum(settled)),
    averagePnL: n2(avg(closed)),
    largestWin: n2(closed.length ? Math.max(...closed.map((t) => t.pnl)) : 0),
    largestLoss: n2(closed.length ? Math.min(...closed.map((t) => t.pnl)) : 0),
    grossProfit: n2(sum(wins)),
    grossLoss: n2(Math.abs(sum(losses))),
    avgWin: n2(avg(wins)),
    avgLoss: n2(Math.abs(avg(losses))),
    longPnL: n2(sum(settled.filter((t) => t.side === 'long'))),
    shortPnL: n2(sum(settled.filter((t) => t.side === 'short'))),
    longTrades: longC.length,
    shortTrades: shortC.length,
    longWins: longC.filter((t) => t.pnl > 0).length,
    shortWins: shortC.filter((t) => t.pnl > 0).length,
  };
  r.winRate = r.closedTrades ? +((r.winningTrades / r.closedTrades) * 100).toFixed(1) : 0;
  r.profitFactor = r.grossLoss > 0 ? +(r.grossProfit / r.grossLoss).toFixed(2) : r.grossProfit > 0 ? Infinity : 0;
  r.expectancy = r.closedTrades ? +((r.totalPnL || 0) / r.closedTrades).toFixed(2) : 0;
  r.avgWinLossRatio = r.avgLoss > 0 ? +(r.avgWin / r.avgLoss).toFixed(2) : 0;
  r.longWinRate = r.longTrades ? +((r.longWins / r.longTrades) * 100).toFixed(1) : 0;
  r.shortWinRate = r.shortTrades ? +((r.shortWins / r.shortTrades) * 100).toFixed(1) : 0;
  return r;
}
