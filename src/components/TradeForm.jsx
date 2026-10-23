import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { Card, Field, inputClass } from './ui.jsx';
import { calcTrade, getInstrument, needsFxRate, defaultFxRate, listSymbols } from '../shared/instruments.js';
import { isNum } from '../lib/store.js';
import { money } from '../lib/format.js';

const QUICK = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'US30', 'BTCUSD', 'MGC'];
const LOTS = ['0.01', '0.10', '0.50', '1.00'];

export const emptyForm = (defaults = {}) => ({
  symbol: defaults.defaultSymbol || '',
  side: 'long',
  entryPrice: '',
  exitPrice: '',
  quantity: defaults.defaultLot || '',
  fxRate: '',
  fees: defaults.defaultFees || '',
  entryTime: new Date().toISOString().slice(0, 16),
  exitTime: '',
  status: 'closed',
  strategy: '',
  notes: '',
});

export const formFromTrade = (t) => ({
  symbol: t.symbol,
  side: t.side,
  entryPrice: t.entryPrice,
  exitPrice: t.exitPrice ?? '',
  quantity: t.quantity,
  fxRate: t.fxRate || '',
  fees: t.fees ?? '',
  entryTime: t.entryTime || '',
  exitTime: t.exitTime || '',
  status: t.status === 'open' ? 'closed' : t.status,
  strategy: t.strategy || '',
  notes: t.notes || '',
});

export default function TradeForm({ initial, onSubmit, submitLabel, onCancel }) {
  const [f, setF] = useState(initial);
  const [error, setError] = useState('');
  const set = (k, v) => {
    setF((p) => ({ ...p, [k]: v }));
    setError('');
  };

  const spec = useMemo(() => getInstrument(f.symbol), [f.symbol]);
  const askFx = needsFxRate(f.symbol);
  const hasExit = isNum(f.exitPrice);
  const unit = spec.pipLabel === 'pips' ? 'pip' : 'point';
  const calc = useMemo(
    () => calcTrade({ symbol: f.symbol, side: f.side, entryPrice: f.entryPrice, exitPrice: f.exitPrice, quantity: f.quantity, fees: f.fees, fxRate: f.fxRate }),
    [f]
  );

  const submit = (e) => {
    e.preventDefault();
    try {
      onSubmit({
        ...f,
        symbol: f.symbol.trim().toUpperCase(),
        exitPrice: hasExit ? Number(f.exitPrice) : null,
        fxRate: askFx && isNum(f.fxRate) ? Number(f.fxRate) : 0,
      });
    } catch (err) {
      setError(err.message || 'Could not save the trade');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="p-3 rounded-xl bg-danger/10 border border-danger text-danger text-sm">{error}</div>}

      <Card>
        <div className="space-y-4">
          <Field label="Symbol *">
            <input
              value={f.symbol}
              onChange={(e) => set('symbol', e.target.value.toUpperCase())}
              placeholder="e.g. EURUSD, XAUUSD, MGC"
              list="tl-symbols"
              autoCapitalize="characters"
              autoComplete="off"
              className={inputClass}
            />
            <datalist id="tl-symbols">
              {listSymbols().map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <div className="flex gap-2 flex-wrap -mt-1">
            {QUICK.map((s) => (
              <button type="button" key={s} onClick={() => set('symbol', s)} className={`px-3 py-1.5 rounded-lg text-xs border ${f.symbol === s ? 'border-accent text-white bg-accent/20' : 'border-gray-600 text-gray-300'}`}>
                {s}
              </button>
            ))}
          </div>
          {f.symbol && (
            <p className="text-xs text-gray-400 -mt-1">
              {spec.known ? (
                <>
                  <span className="text-accent font-semibold">{spec.name}</span> · 1 lot = {spec.contractSize.toLocaleString()} units · 1 {unit} = {spec.pipSize}
                </>
              ) : (
                <span className="text-warning">Unknown symbol: 1 unit per lot, 1 point = 1.00</span>
              )}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-primary border border-gray-700">
            {['long', 'short'].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => set('side', s)}
                className={`py-2.5 rounded-lg text-sm font-bold uppercase ${f.side === s ? (s === 'long' ? 'bg-success text-white' : 'bg-danger text-white') : 'text-gray-400'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Entry Price *">
              <input type="number" inputMode="decimal" step="any" value={f.entryPrice} onChange={(e) => set('entryPrice', e.target.value)} placeholder="0.00" className={inputClass} />
            </Field>
            <Field label="Lot Size *">
              <input type="number" inputMode="decimal" step="0.01" min="0" value={f.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="0.10" className={inputClass} />
            </Field>
          </div>
          <div className="flex gap-2 -mt-1">
            {LOTS.map((l) => (
              <button type="button" key={l} onClick={() => set('quantity', l)} className="px-3 py-1 text-xs rounded-lg border border-gray-600 text-gray-300">
                {l}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Exit Price">
              <input type="number" inputMode="decimal" step="any" value={f.exitPrice} onChange={(e) => set('exitPrice', e.target.value)} placeholder="empty = open" className={inputClass} />
            </Field>
            <Field label="Fees ($)">
              <input type="number" inputMode="decimal" step="0.01" value={f.fees} onChange={(e) => set('fees', e.target.value)} placeholder="0.00" className={inputClass} />
            </Field>
          </div>

          {askFx && (
            <Field label={`${spec.quote} to USD rate`} hint={`${spec.symbol} profit is earned in ${spec.quote}. Empty uses ${defaultFxRate(f.symbol)}.`}>
              <input type="number" inputMode="decimal" step="any" value={f.fxRate} onChange={(e) => set('fxRate', e.target.value)} placeholder={`${defaultFxRate(f.symbol)}`} className={inputClass} />
            </Field>
          )}

          {hasExit && (
            <Field label="Result">
              <select value={f.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                <option value="closed">Closed</option>
                <option value="breakeven">Breakeven</option>
              </select>
            </Field>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold mb-3 flex items-center gap-2">
          <Calculator size={18} className="text-accent" /> Live Calculation
        </h2>
        <div className="grid grid-cols-2 gap-2.5 text-sm">
          <div className="p-3 rounded-xl bg-primary border border-gray-700">
            <p className="text-[11px] text-gray-400">Per {unit} (1 lot)</p>
            <p className="font-bold">{money(calc.pipValue)}</p>
          </div>
          <div className="p-3 rounded-xl bg-primary border border-gray-700">
            <p className="text-[11px] text-gray-400">Per {unit} (your lots)</p>
            <p className="font-bold">{money(calc.pipValue * (Number(f.quantity) || 0))}</p>
          </div>
          <div className="p-3 rounded-xl bg-primary border border-gray-700">
            <p className="text-[11px] text-gray-400">Position size</p>
            <p className="font-bold">{money(calc.positionSize)}</p>
          </div>
          <div className="p-3 rounded-xl bg-primary border border-gray-700">
            <p className="text-[11px] text-gray-400">{spec.pipLabel === 'pips' ? 'Pips' : 'Points'} moved</p>
            <p className={`font-bold ${!hasExit ? 'text-gray-500' : calc.pips >= 0 ? 'text-success' : 'text-danger'}`}>{hasExit ? `${calc.pips > 0 ? '+' : ''}${calc.pips}` : '-'}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between p-3 rounded-xl bg-primary border border-gray-700">
          <span className="text-xs text-gray-400">{hasExit ? 'Net P&L (after fees)' : 'Add exit price for P&L'}</span>
          <span className={`text-xl font-bold ${!hasExit ? 'text-gray-500' : calc.pnl >= 0 ? 'text-success' : 'text-danger'}`}>{hasExit ? money(calc.pnl) : '-'}</span>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Entry Time">
              <input type="datetime-local" value={f.entryTime} onChange={(e) => set('entryTime', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Exit Time">
              <input type="datetime-local" value={f.exitTime} onChange={(e) => set('exitTime', e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Strategy">
            <input value={f.strategy} onChange={(e) => set('strategy', e.target.value)} placeholder="e.g. Breakout" className={inputClass} />
          </Field>
          <Field label="Notes">
            <textarea rows="3" value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="What did you see? What would you change?" className={`${inputClass} resize-none`} />
          </Field>
        </div>
      </Card>

      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-5 py-3.5 rounded-xl bg-gray-700 font-bold">
            Cancel
          </button>
        )}
        <button type="submit" className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-accent to-blue-600 font-bold text-base active:scale-[0.98] transition">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
