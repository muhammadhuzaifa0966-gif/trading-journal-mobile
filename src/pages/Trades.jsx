import React, { useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { Page, Card, Empty, Sheet, inputClass } from '../components/ui.jsx';
import TradeForm, { formFromTrade } from '../components/TradeForm.jsx';
import { useTrades, updateTrade, deleteTrade } from '../lib/store.js';
import { getInstrument, priceDigits } from '../shared/instruments.js';
import { money } from '../lib/format.js';

const FILTERS = [
  ['all', 'All'],
  ['open', 'Open'],
  ['closed', 'Closed'],
  ['long', 'Long'],
  ['short', 'Short'],
];

export default function Trades() {
  const trades = useTrades();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return [...trades]
      .filter((t) => {
        if (filter === 'open' && t.status !== 'open') return false;
        if (filter === 'closed' && t.status === 'open') return false;
        if ((filter === 'long' || filter === 'short') && t.side !== filter) return false;
        if (!s) return true;
        return [t.symbol, t.strategy, t.notes].some((v) => String(v || '').toLowerCase().includes(s));
      })
      .sort((a, b) => String(b.entryTime).localeCompare(String(a.entryTime)) || b.id - a.id);
  }, [trades, q, filter]);

  const total = list.filter((t) => t.status !== 'open').reduce((s, t) => s + (t.pnl || 0), 0);

  const save = (data) => {
    updateTrade(editing.id, data);
    setEditing(null);
  };
  const remove = () => {
    if (window.confirm('Delete this trade?')) {
      deleteTrade(editing.id);
      setEditing(null);
    }
  };

  return (
    <Page title="Trades" subtitle={`${list.length} trade${list.length === 1 ? '' : 's'} · P&L ${money(total)}`}>
      <div className="relative mb-3">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search symbol, strategy, notes" className={`${inputClass} pl-10`} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`shrink-0 px-4 py-1.5 rounded-full text-sm border ${filter === k ? 'bg-accent border-accent text-white' : 'border-gray-600 text-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {!list.length ? (
        <Empty>{trades.length ? 'No trades match this filter' : 'No trades yet. Tap + to add one.'}</Empty>
      ) : (
        <div className="space-y-3">
          {list.map((t) => {
            const spec = getInstrument(t.symbol);
            const d = priceDigits(t.symbol);
            const open = t.status === 'open';
            return (
              <button key={t.id} onClick={() => setEditing(t)} className="w-full text-left active:scale-[0.99] transition">
                <Card>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{t.symbol}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${t.side === 'short' ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>{t.side}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${open ? 'bg-info/20 text-info' : t.status === 'closed' ? 'bg-gray-600/40 text-gray-300' : 'bg-warning/20 text-warning'}`}>{t.status}</span>
                    </div>
                    <span className={`text-lg font-bold ${open ? 'text-gray-500' : t.pnl >= 0 ? 'text-success' : 'text-danger'}`}>{open ? '-' : money(t.pnl)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {Number(t.entryPrice).toFixed(d)} → {t.exitPrice != null ? Number(t.exitPrice).toFixed(d) : '...'}
                    </span>
                    <span>{Number(t.quantity).toFixed(2)} lots</span>
                    <span className={open ? '' : t.pips >= 0 ? 'text-success' : 'text-danger'}>
                      {open ? '' : `${t.pips > 0 ? '+' : ''}${t.pips} ${spec.pipLabel === 'pips' ? 'pips' : 'pts'}`}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {String(t.entryTime || '').replace('T', ' ').slice(0, 16)}
                    {t.strategy ? ` · ${t.strategy}` : ''}
                  </p>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.symbol}` : ''}>
        {editing && (
          <>
            <TradeForm key={editing.id} initial={formFromTrade(editing)} onSubmit={save} onCancel={() => setEditing(null)} submitLabel="Save Changes" />
            <button onClick={remove} className="mt-4 w-full py-3 rounded-xl border border-danger text-danger font-semibold flex items-center justify-center gap-2">
              <Trash2 size={18} /> Delete trade
            </button>
          </>
        )}
      </Sheet>
    </Page>
  );
}
