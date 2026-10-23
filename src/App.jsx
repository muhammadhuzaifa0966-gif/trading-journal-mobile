import React, { useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Home, List, Plus, BarChart3, Settings as Cog } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import Dashboard from './pages/Dashboard.jsx';
import AddTrade from './pages/AddTrade.jsx';
import Trades from './pages/Trades.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/trades', label: 'Trades', icon: List },
  { to: '/add', label: 'Add', icon: Plus, main: true },
  { to: '/analytics', label: 'Stats', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Cog },
];

export default function App() {
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#0F172A' }).catch(() => {});
  }, []);

  useEffect(() => {
    const el = document.getElementById('scroll-area');
    if (el) el.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="h-full flex flex-col bg-primary text-white">
      <main id="scroll-area" className="flex-1 overflow-y-auto safe-top">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trades" element={<Trades />} />
          <Route path="/add" element={<AddTrade />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="shrink-0 bg-secondary/95 border-t border-gray-700 safe-bottom">
        <ul className="flex items-end justify-around px-2 pt-1.5 pb-1.5">
          {tabs.map(({ to, label, icon: Icon, end, main }) => (
            <li key={to} className="flex-1">
              <NavLink to={to} end={end} className="flex flex-col items-center gap-0.5">
                {({ isActive }) =>
                  main ? (
                    <>
                      <span className="-mt-6 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-lg shadow-accent/40 border-4 border-primary">
                        <Icon size={26} className="text-white" />
                      </span>
                      <span className={`text-[11px] ${isActive ? 'text-accent' : 'text-gray-400'}`}>{label}</span>
                    </>
                  ) : (
                    <>
                      <Icon size={22} className={isActive ? 'text-accent' : 'text-gray-400'} />
                      <span className={`text-[11px] ${isActive ? 'text-accent font-semibold' : 'text-gray-400'}`}>{label}</span>
                    </>
                  )
                }
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
