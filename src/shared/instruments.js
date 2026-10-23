// Instrument specifications and the lot / pip / point maths used everywhere
// (main process, database and UI). Plain CommonJS so Electron can require it
// and the React build can import it.
//
//   contractSize  units of the instrument in ONE lot
//   pipSize       price distance that counts as 1 pip (forex, metals, energy)
//                 or 1 point (indices, crypto, futures)
//   quote         currency the P&L is earned in
//   usdBase       true when USD is the base currency (USDJPY, USDCHF, USDCAD):
//                 P&L comes out in the quote currency and is divided by price
//
// Gross P&L (USD) = price move x direction x lots x contractSize x (quote -> USD)
// Pips / points   = price move x direction / pipSize
//
// Brokers differ a little (gold pip, index contract size), so the numbers
// below are the common CFD / MT4-MT5 conventions.

const FOREX = 100000;

const fx = (name, quote, pipSize, extra = {}) => ({
  name,
  category: 'forex',
  contractSize: FOREX,
  pipSize,
  pipLabel: 'pips',
  quote,
  ...extra,
});

const INSTRUMENTS = {
  // Forex, USD is the quote currency
  EURUSD: fx('Euro / US Dollar', 'USD', 0.0001),
  GBPUSD: fx('British Pound / US Dollar', 'USD', 0.0001),
  AUDUSD: fx('Australian Dollar / US Dollar', 'USD', 0.0001),
  NZDUSD: fx('New Zealand Dollar / US Dollar', 'USD', 0.0001),

  // Forex, USD is the base currency
  USDJPY: fx('US Dollar / Japanese Yen', 'JPY', 0.01, { usdBase: true }),
  USDCHF: fx('US Dollar / Swiss Franc', 'CHF', 0.0001, { usdBase: true }),
  USDCAD: fx('US Dollar / Canadian Dollar', 'CAD', 0.0001, { usdBase: true }),

  // Forex crosses (need a quote -> USD rate)
  EURGBP: fx('Euro / British Pound', 'GBP', 0.0001),
  EURJPY: fx('Euro / Japanese Yen', 'JPY', 0.01),
  GBPJPY: fx('British Pound / Japanese Yen', 'JPY', 0.01),
  AUDJPY: fx('Australian Dollar / Japanese Yen', 'JPY', 0.01),
  CADJPY: fx('Canadian Dollar / Japanese Yen', 'JPY', 0.01),
  NZDJPY: fx('New Zealand Dollar / Japanese Yen', 'JPY', 0.01),
  CHFJPY: fx('Swiss Franc / Japanese Yen', 'JPY', 0.01),
  EURCHF: fx('Euro / Swiss Franc', 'CHF', 0.0001),
  GBPCHF: fx('British Pound / Swiss Franc', 'CHF', 0.0001),
  EURAUD: fx('Euro / Australian Dollar', 'AUD', 0.0001),
  GBPAUD: fx('British Pound / Australian Dollar', 'AUD', 0.0001),
  EURCAD: fx('Euro / Canadian Dollar', 'CAD', 0.0001),
  GBPCAD: fx('British Pound / Canadian Dollar', 'CAD', 0.0001),
  AUDCAD: fx('Australian Dollar / Canadian Dollar', 'CAD', 0.0001),
  AUDNZD: fx('Australian Dollar / New Zealand Dollar', 'NZD', 0.0001),

  // Metals and energy CFDs
  XAUUSD: { name: 'Gold (100 oz per lot)', category: 'metal', contractSize: 100, pipSize: 0.1, pipLabel: 'pips', quote: 'USD' },
  XAGUSD: { name: 'Silver (5,000 oz per lot)', category: 'metal', contractSize: 5000, pipSize: 0.01, pipLabel: 'pips', quote: 'USD' },
  USOIL: { name: 'WTI Crude Oil (1,000 bbl per lot)', category: 'energy', contractSize: 1000, pipSize: 0.01, pipLabel: 'pips', quote: 'USD' },
  UKOIL: { name: 'Brent Crude Oil (1,000 bbl per lot)', category: 'energy', contractSize: 1000, pipSize: 0.01, pipLabel: 'pips', quote: 'USD' },

  // Index CFDs (1 point = 1 unit of currency per lot)
  US30: { name: 'Dow Jones 30', category: 'index', contractSize: 1, pipSize: 1, pipLabel: 'points', quote: 'USD' },
  NAS100: { name: 'Nasdaq 100', category: 'index', contractSize: 1, pipSize: 1, pipLabel: 'points', quote: 'USD' },
  SPX500: { name: 'S&P 500', category: 'index', contractSize: 1, pipSize: 1, pipLabel: 'points', quote: 'USD' },
  GER40: { name: 'DAX 40 (EUR)', category: 'index', contractSize: 1, pipSize: 1, pipLabel: 'points', quote: 'EUR' },
  UK100: { name: 'FTSE 100 (GBP)', category: 'index', contractSize: 1, pipSize: 1, pipLabel: 'points', quote: 'GBP' },

  // Crypto CFDs
  BTCUSD: { name: 'Bitcoin', category: 'crypto', contractSize: 1, pipSize: 1, pipLabel: 'points', quote: 'USD' },
  ETHUSD: { name: 'Ethereum', category: 'crypto', contractSize: 1, pipSize: 1, pipLabel: 'points', quote: 'USD' },

  // Futures (a lot is one contract)
  MGC: { name: 'Micro Gold Futures (10 oz)', category: 'futures', contractSize: 10, pipSize: 1, pipLabel: 'points', quote: 'USD' },
  GC: { name: 'Gold Futures (100 oz)', category: 'futures', contractSize: 100, pipSize: 1, pipLabel: 'points', quote: 'USD' },
  MES: { name: 'Micro E-mini S&P 500', category: 'futures', contractSize: 5, pipSize: 1, pipLabel: 'points', quote: 'USD' },
  ES: { name: 'E-mini S&P 500', category: 'futures', contractSize: 50, pipSize: 1, pipLabel: 'points', quote: 'USD' },
  MNQ: { name: 'Micro E-mini Nasdaq 100', category: 'futures', contractSize: 2, pipSize: 1, pipLabel: 'points', quote: 'USD' },
  NQ: { name: 'E-mini Nasdaq 100', category: 'futures', contractSize: 20, pipSize: 1, pipLabel: 'points', quote: 'USD' },
  MCL: { name: 'Micro WTI Crude Oil (100 bbl)', category: 'futures', contractSize: 100, pipSize: 1, pipLabel: 'points', quote: 'USD' },
  CL: { name: 'WTI Crude Oil Futures (1,000 bbl)', category: 'futures', contractSize: 1000, pipSize: 1, pipLabel: 'points', quote: 'USD' },
};

// Other names brokers use for the same instrument
const ALIASES = {
  GOLD: 'XAUUSD',
  XAU: 'XAUUSD',
  SILVER: 'XAGUSD',
  XAG: 'XAGUSD',
  WTI: 'USOIL',
  XTIUSD: 'USOIL',
  CRUDE: 'USOIL',
  BRENT: 'UKOIL',
  XBRUSD: 'UKOIL',
  DJ30: 'US30',
  DOW: 'US30',
  WS30: 'US30',
  USTEC: 'NAS100',
  NDX: 'NAS100',
  NASDAQ: 'NAS100',
  US100: 'NAS100',
  US500: 'SPX500',
  SP500: 'SPX500',
  DAX: 'GER40',
  DE40: 'GER40',
  DAX40: 'GER40',
  FTSE: 'UK100',
  BTC: 'BTCUSD',
  ETH: 'ETHUSD',
};

// Used only for pairs whose quote currency is not USD and that have no USD leg
// (crosses and non-US indices). The trade form lets the user override it.
const DEFAULT_FX = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  AUD: 0.66,
  NZD: 0.6,
  CAD: 0.73,
  CHF: 1.13,
  JPY: 0.0067,
};

const CUSTOM = {
  name: 'Custom instrument (1 unit per lot, 1 point = 1.00)',
  category: 'custom',
  contractSize: 1,
  pipSize: 1,
  pipLabel: 'points',
  quote: 'USD',
};

const isNum = (v) => v !== null && v !== undefined && v !== '' && !isNaN(Number(v));

// "eur/usd", "EURUSD.m", "gold" -> "EURUSD", "EURUSD", "XAUUSD"
function normalizeSymbol(symbol) {
  const raw = String(symbol || '').toUpperCase().replace(/[\s/_-]/g, '');
  const candidates = [raw, raw.split('.')[0], raw.replace(/[MC]$/, '')];
  for (const c of candidates) {
    if (INSTRUMENTS[c]) return c;
    if (ALIASES[c]) return ALIASES[c];
  }
  return raw;
}

function getInstrument(symbol) {
  const key = normalizeSymbol(symbol);
  const spec = INSTRUMENTS[key];
  return spec ? { symbol: key, known: true, ...spec } : { symbol: key, known: false, ...CUSTOM };
}

// A cross pair or non-US index needs a quote -> USD rate typed in by the user
function needsFxRate(symbol) {
  const spec = getInstrument(symbol);
  return spec.known && spec.quote !== 'USD' && !spec.usdBase;
}

function defaultFxRate(symbol) {
  return DEFAULT_FX[getInstrument(symbol).quote] || 1;
}

// Multiplier that turns a P&L in the quote currency into USD
function quoteToUsd(spec, price, fxRate) {
  if (spec.quote === 'USD') return 1;
  if (spec.usdBase) {
    const p = Number(price) || 0;
    return p ? 1 / p : 0;
  }
  return Number(fxRate) > 0 ? Number(fxRate) : DEFAULT_FX[spec.quote] || 1;
}

// USD value of one pip / point for ONE lot at the given price
function pipValuePerLot(symbol, price, fxRate) {
  const spec = getInstrument(symbol);
  return spec.pipSize * spec.contractSize * quoteToUsd(spec, price, fxRate);
}

// Everything the app needs to know about a trade's result.
// trade: { symbol, side, entryPrice, exitPrice, quantity (lots), fees, fxRate }
function calcTrade(trade) {
  const spec = getInstrument(trade.symbol);
  const lots = Number(trade.quantity) || 0;
  const entry = Number(trade.entryPrice) || 0;
  const fees = Number(trade.fees) || 0;
  const dir = trade.side === 'short' ? -1 : 1;
  const hasExit = isNum(trade.exitPrice);
  const exit = hasExit ? Number(trade.exitPrice) : null;

  const entryConv = quoteToUsd(spec, entry, trade.fxRate);
  const positionSize = +(lots * spec.contractSize * entry * entryConv).toFixed(2);
  const pipValue = +pipValuePerLot(spec.symbol, exit || entry, trade.fxRate).toFixed(4);

  if (!hasExit) {
    return { pnl: 0, pnlPercent: 0, pips: 0, grossPnl: 0, fees, pipValue, positionSize };
  }

  const move = (exit - entry) * dir;
  const conv = quoteToUsd(spec, exit, trade.fxRate);
  const gross = move * lots * spec.contractSize * conv;

  return {
    pnl: +(gross - fees).toFixed(2),
    pnlPercent: entry ? +((move / entry) * 100).toFixed(2) : 0,
    pips: +(move / spec.pipSize).toFixed(1),
    grossPnl: +gross.toFixed(2),
    fees,
    pipValue,
    positionSize,
  };
}

// Decimals to show for a price of this instrument (forex quotes 5 / 3 digits)
function priceDigits(symbol) {
  const spec = getInstrument(symbol);
  if (spec.category !== 'forex') return 2;
  return Math.round(-Math.log10(spec.pipSize)) + 1;
}

// Symbols for the form's suggestion list
function listSymbols() {
  return Object.keys(INSTRUMENTS);
}

export {
  INSTRUMENTS,
  DEFAULT_FX,
  normalizeSymbol,
  getInstrument,
  needsFxRate,
  defaultFxRate,
  quoteToUsd,
  pipValuePerLot,
  calcTrade,
  priceDigits,
  listSymbols,
};
