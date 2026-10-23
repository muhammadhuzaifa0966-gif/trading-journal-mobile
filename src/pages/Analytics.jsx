import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Page, Card, Stat, Empty, tooltipProps, tick } from '../components/ui.jsx';
import { useTrades, getStatistics } from '../lib/store.js';
import { money, pf } from '../lib/format.js';

const LOT_RANGES = [
  ['< 0.10', 0, 0.1],
  ['0.10-0.49', 0.1, 0.5],
  ['0.50-0.99', 0.5, 1],
  ['1-4.99', 1, 5],
  ['5+', 5, Infinity],
];

const winRate = (a) => (a.length ? +((a.filter((t) => t.pnl > 0).length / a.length) * 100).toFixed(1) : 0);

export default function Analytics() {
  const trades = useTrades();
  const stats = useMemo(() => getStatistics(trades), [trades]);
  const closed = useMemo(() => trades.filter((t) => t.status === 'closed'), [trades]);

  const daily = useMemo(() => {
    const m = {};
    trades.filter((t) => t.status !== 'open').forEach((t) => {
      const d = (t.exitTime || t.entryTime || '').slice(0, 10);
      m[d] = (m[d] || 0) + (t.pnl || 0);
    });
    return Object.keys(m).sort().slice(-14).map((d) => ({ date: d.slice(5), pnl: +m[d].toFixed(2) }));
  }, [trades]);

  const bySymbol = useMemo(() => {
    const m = {};
    closed.forEach((t) => {
      m[t.symbol] = m[t.symbol] || { symbol: t.symbol, pnl: 0, n: 0, wins: 0 };
      m[t.symbol].pnl += t.pnl;
      m[t.symbol].n += 1;
      if (t.pnl > 0) m[t.symbol].wins += 1;
    });
    return Object.values(m).sort((a, b) => b.pnl - a.pnl);
  }, [closed]);

  const byStrategy = useMemo(() => {
    const m = {};
    closed.forEach((t) => {
      const k = t.strategy || 'No strategy';
      (m[k] = m[k] || []).push(t);
    });
    return Object.entries(m).map(([strategy, a]) => ({ strategy, winRate: winRate(a), n: a.length }));
  }, [closed]);

  const byLot = useMemo(
    () => LOT_RANGES.map(([range, min, max]) => {
      const a = closed.filter((t) => t.quantity >= min && t.quantity < max);
      return { range, winRate: winRate(a), n: a.length };
    }).filter((r) => r.n > 0),
    [closed]
  );

  if (!closed.length) {
    return (
      <Page title="Analytics" subtitle="Performance insights">
        <Empty>Close a few trades and your statistics will show up here.</Empty>
      </Page>
    );
  }

  const maxAbs = Math.max(...bySymbol.map((s) => Math.abs(s.pnl)), 1);

  return (
    <Page title="Analytics" subtitle="Performance insights">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="Profit Factor" value={pf(stats.profitFactor)} />
        <Stat label="Expectancy" value={money(stats.expectancy)} tone={stats.expectancy >= 0 ? 'up' : 'down'} />
        <Stat label="Avg Win" value={money(stats.avgWin)} tone="up" />
        <Stat label="Avg Loss" value={money(stats.avgLoss)} tone="down" />
        <Stat label="Largest Win" value={money(stats.largestWin)} tone="up" />
        <Stat label="Largest Loss" value={money(stats.largestLoss)} tone="down" />
      </div>

      <Card title="Daily P&L (last 14 days)" className="mb-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={daily} margin={{ left: -12, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" tick={tick} />
            <YAxis stroke="#9CA3AF" tick={tick} />
            <Tooltip {...tooltipProps} formatter={(v) => [money(v), 'P&L']} />
            <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
              {daily.map((d, i) => (
                <Cell key={i} fill={d.pnl >= 0 ? '#10B981' : '#EF4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="By Symbol" className="mb-4">
        <div className="space-y-3">
          {bySymbol.map((s) => (
            <div key={s.symbol}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{s.symbol} <span className="text-gray-500 text-xs font-normal">{s.n} trades · {Math.round((s.wins / s.n) * 100)}% win</span></span>
                <span className={s.pnl >= 0 ? 'text-success' : 'text-danger'}>{money(s.pnl)}</span>
              </div>
              <div className="h-1.5 mt-1 rounded-full bg-primary overflow-hidden">
                <div className={`h-full rounded-full ${s.pnl >= 0 ? 'bg-success' : 'bg-danger'}`} style={{ width: `${(Math.abs(s.pnl) / maxAbs) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Win Rate by Strategy" className="mb-4">
        <ResponsiveContainer width="100%" height={Math.max(120, byStrategy.length * 42)}>
          <BarChart data={byStrategy} layout="vertical" margin={{ left: 10, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" tick={tick} />
            <YAxis type="category" dataKey="strategy" width={90} stroke="#9CA3AF" tick={tick} />
            <Tooltip {...tooltipProps} formatter={(v) => [`${v}%`, 'Win rate']} />
            <Bar dataKey="winRate" fill="#3B82F6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Win Rate by Lot Size">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byLot} margin={{ left: -12, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="range" stroke="#9CA3AF" tick={tick} />
            <YAxis domain={[0, 100]} stroke="#9CA3AF" tick={tick} />
            <Tooltip {...tooltipProps} formatter={(v) => [`${v}%`, 'Win rate']} />
            <Bar dataKey="winRate" fill="#F59E0B" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Page>
  );
}
