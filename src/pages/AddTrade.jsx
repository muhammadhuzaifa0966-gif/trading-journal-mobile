import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Page } from '../components/ui.jsx';
import TradeForm, { emptyForm } from '../components/TradeForm.jsx';
import { addTrade, loadSettings } from '../lib/store.js';

export default function AddTrade() {
  const nav = useNavigate();
  const [key, setKey] = useState(0);
  const [saved, setSaved] = useState(false);

  const submit = (data) => {
    addTrade(data);
    setSaved(true);
    setKey((k) => k + 1);
    setTimeout(() => setSaved(false), 2500);
    // new blank form stays here; go to Trades with the link below
  };

  return (
    <Page title="New Trade" subtitle="Log your latest trade">
      {saved && (
        <div className="mb-4 p-3 rounded-xl bg-success/10 border border-success text-success text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><Check size={18} /> Trade saved</span>
          <button onClick={() => nav('/trades')} className="underline">View trades</button>
        </div>
      )}
      <TradeForm key={key} initial={emptyForm(loadSettings())} onSubmit={submit} submitLabel="Save Trade" />
    </Page>
  );
}
