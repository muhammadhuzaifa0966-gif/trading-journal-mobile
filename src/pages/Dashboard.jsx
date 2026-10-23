import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Page, Card, Stat, tooltipProps, tick } from '../components/ui.jsx';
import { useTrades, getStatistics } from '../lib/store.js';
import { money, pf } from '../lib/format.js';

export default function Dashboard() {
  const trades = useTrades();
  const stats = useMemo(() => getStatistics(trades), [trades]);

  // cumulative P&L per day (closed + breakeven)
  const trend = useMemo(() => {
    const byDay = {};
    trades
      .filter((t) => t.status !== 'open')
      .forEach((t) => {
        const d = (t.exitTime || t.entryTime || '').slice(0, 10);
        byDay[d] = (byDay[d] || 0) + (t.pnl || 0);
      });
    let run = 0;
    return Object.keys(byDay)
      .sort()
      .map((d) => ({ date: d.slice(5), pnl: +(run += byDay[d]).toFixed(2) }));
  }, [trades]);

  const pie = [
    { name: 'Wins', value: stats.winningTrades, color: '#10B981' },
    { name: 'Losses', value: stats.losingTrades, color: '#EF4444' },
  ].filter((p) => p.value > 0);

  if (!trades.length) {
    return (
      <Page title="TradeLogs Pro" subtitle="Your trading journal">
        <Card className="text-center py-10">
          <p className="text-lg font-semibold">No trades yet</p>
          <p className="text-sm text-gray-400 mt-2 mb-5">Log your first trade to see P&L, win rate and charts here.</p>
          <Link to="/add" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-blue-600 font-bold">
            Add first trade
          </Link>
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Dashboard" subtitle="Your trading overview">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="Total P&L" value={money(stats.totalPnL)} tone={stats.totalPnL >= 0 ? 'up' : 'down'} sub={`Avg ${money(stats.averagePnL)}`} />
        <Stat label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.winningTrades}W / ${stats.losingTrades}L`} />
        <Stat label="Profit Factor" value={pf(stats.profitFactor)} sub={`Expectancy ${money(stats.expectancy)}`} />
        <Stat label="Trades" value={stats.totalTrades} sub={`${stats.openTrades} open · ${stats.closedTrades} closed`} />
      </div>

      <Card title="P&L Trend" className="mb-4">
        {trend.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend} margin={{ left: -12, right: 8, top: 5 }}>
              <defs>
                <linearGradient id="gpnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={tick} />
              <YAxis stroke="#9CA3AF" tick={tick} />
              <Tooltip {...tooltipProps} formatter={(v) => [money(v), 'P&L']} />
              <Area type="monotone" dataKey="pnl" stroke="#3B82F6" strokeWidth={2} fill="url(#gpnl)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 py-8 text-center">Close a trade to see the trend</p>
        )}
      </Card>

      <Card title="Win / Loss" className="mb-4">
        {pie.length ? (
          <div className="flex items-center gap-4">
            <div className="w-36 h-36 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie} dataKey="value" innerRadius={42} outerRadius={64} paddingAngle={3} stroke="none">
                    {pie.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipProps} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="inline-block w-3 h-3 rounded-full bg-success mr-2" />Wins <b>{stats.winningTrades}</b></p>
              <p><span className="inline-block w-3 h-3 rounded-full bg-danger mr-2" />Losses <b>{stats.losingTrades}</b></p>
              <p className="text-gray-400 text-xs">Avg win {money(stats.avgWin)}<br />Avg loss {money(stats.avgLoss)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-6 text-center">No closed trades yet</p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-gray-400">Long</p>
          <p className={`text-lg font-bold ${stats.longPnL >= 0 ? 'text-success' : 'text-danger'}`}>{money(stats.longPnL)}</p>
          <p className="text-[11px] text-gray-500">{stats.longTrades} trades · {stats.longWinRate}% win</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400">Short</p>
          <p className={`text-lg font-bold ${stats.shortPnL >= 0 ? 'text-success' : 'text-danger'}`}>{money(stats.shortPnL)}</p>
          <p className="text-[11px] text-gray-500">{stats.shortTrades} trades · {stats.shortWinRate}% win</p>
        </Card>
      </div>
    </Page>
  );
}
