import React, { useRef, useState } from 'react';
import { Page, Card, Field, inputClass } from '../components/ui.jsx';
import { loadSettings, saveSettings, useTrades, exportJSON, importJSON, toCSV, clearAll } from '../lib/store.js';
import { saveText } from '../lib/format.js';

const Btn = ({ children, onClick, danger }) => (
  <button onClick={onClick} className={`w-full py-3 rounded-xl font-semibold border ${danger ? 'border-danger text-danger' : 'border-gray-600 text-white bg-primary'} active:scale-[0.98] transition`}>
    {children}
  </button>
);

export default function Settings() {
  const trades = useTrades();
  const [s, setS] = useState(loadSettings);
  const [msg, setMsg] = useState('');
  const file = useRef(null);

  const change = (k, v) => {
    const next = { ...s, [k]: v };
    setS(next);
    saveSettings(next);
  };
  const say = (m) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3500);
  };
  const stamp = new Date().toISOString().slice(0, 10);

  const run = (fn) => async () => {
    try {
      await fn();
    } catch (e) {
      say(e?.message || 'Something went wrong');
    }
  };

  const restore = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const text = await f.text();
      if (trades.length && !window.confirm(`This replaces your ${trades.length} current trades. Continue?`)) return;
      say(`${importJSON(text)} trades restored`);
    } catch (err) {
      say(err?.message || 'Could not read this backup file');
    }
  };

  return (
    <Page title="Settings" subtitle="Defaults and your data">
      <Card title="Trade Defaults" className="mb-4">
        <div className="space-y-4">
          <Field label="Default Symbol">
            <input value={s.defaultSymbol || ''} onChange={(e) => change('defaultSymbol', e.target.value.toUpperCase())} placeholder="e.g. XAUUSD" className={inputClass} />
          </Field>
          <Field label="Default Lot Size">
            <input type="number" inputMode="decimal" step="0.01" min="0" value={s.defaultLot || ''} onChange={(e) => change('defaultLot', e.target.value)} placeholder="e.g. 0.10" className={inputClass} />
          </Field>
          <Field label="Default Fees ($)">
            <input type="number" inputMode="decimal" step="0.01" value={s.defaultFees || ''} onChange={(e) => change('defaultFees', e.target.value)} placeholder="0.00" className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card title="Your Data" className="mb-4">
        <p className="text-xs text-gray-400 mb-3">{trades.length} trades are stored on this phone only. Make a backup before uninstalling the app or changing phones.</p>
        {msg && <div className="mb-3 p-3 rounded-xl bg-accent/10 border border-accent text-sm">{msg}</div>}
        <div className="space-y-2.5">
          <Btn onClick={run(async () => { await saveText(`tradelogs-backup-${stamp}.json`, exportJSON(), 'application/json'); })}>Backup all trades (JSON)</Btn>
          <Btn onClick={() => file.current?.click()}>Restore from backup</Btn>
          <input ref={file} type="file" accept=".json,application/json" className="hidden" onChange={restore} />
          <Btn onClick={run(async () => { if (!trades.length) return say('No trades to export'); await saveText(`trades-${stamp}.csv`, toCSV(trades), 'text/csv'); })}>Export trades (CSV)</Btn>
          <Btn danger onClick={() => { if (window.confirm('Delete ALL trades from this phone? This cannot be undone.')) { clearAll(); say('All trades deleted'); } }}>Delete all trades</Btn>
        </div>
      </Card>

      <Card title="About">
        <p className="text-sm text-gray-300">TradeLogs Pro Mobile · v1.0.0</p>
        <p className="text-xs text-gray-500 mt-1">P&L uses lot size, contract size and pip/point value per instrument (forex, gold, index, crypto, futures).</p>
      </Card>
    </Page>
  );
}
