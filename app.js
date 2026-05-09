let currentData = null;

const STOCK_GROUPS = {
  '指数': { label: '指数', tickers: ['^GSPC', '^IXIC', '^DJI', '^N225', '^HSI', 'SCHD'] },
  '科技': { label: '科技', tickers: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'] },
  '金融': { label: '金融', tickers: ['JPM', 'V', 'GS', 'BLK', 'PYPL', 'XYZ'] },
  '加密': { label: '加密', tickers: ['COIN', 'HOOD', 'MSTR', 'CRCL', 'BMNR', 'TRON'] }
};

const DISPLAY_NAMES = {
  '^GSPC': '标普 500', '^IXIC': '纳斯达克', '^DJI': '道琼斯',
  '^N225': '日经 225', '^HSI': '恒生指数',
  'SCHD': 'Schwab 美国高股息 ETF (SCHD)',
  'AAPL': 'Apple (AAPL)', 'TSLA': 'Tesla (TSLA)', 'NVDA': 'NVIDIA (NVDA)',
  'MSFT': 'Microsoft (MSFT)', 'GOOGL': 'Alphabet (GOOGL)', 'AMZN': 'Amazon (AMZN)',
  'JPM': 'JPMorgan Chase (JPM)', 'V': 'Visa (V)', 'GS': 'Goldman Sachs (GS)',
  'BLK': 'BlackRock (BLK)', 'PYPL': 'PayPal (PYPL)', 'XYZ': 'Block (XYZ)',
  'COIN': 'Coinbase (COIN)', 'HOOD': 'Robinhood (HOOD)', 'MSTR': 'MicroStrategy (MSTR)',
  'CRCL': 'Circle (CRCL)', 'BMNR': 'Bitmine (BMNR)', 'TRON': 'TRON (TRON)'
};

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function init() {
  const picker = document.getElementById('date-picker');
  picker.value = getToday();
  picker.addEventListener('change', () => loadData(picker.value));
  loadData(getToday());
  initExport();
}

async function loadData(date) {
  const content = document.getElementById('content');
  const noData = document.getElementById('no-data');
  const updateTime = document.getElementById('update-time');
  const liveDot = document.getElementById('live-dot');

  content.innerHTML = '<div class="loading">正在加载数据</div>';
  noData.classList.add('hidden');
  liveDot.classList.add('hidden');
  updateTime.textContent = '';

  try {
    const res = await fetch(`data/${date}.json`);
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    currentData = { ...data, date };

    if (data.updated_at) {
      updateTime.textContent = `更新于 ${data.updated_at}`;
      liveDot.classList.remove('hidden');
    }

    content.innerHTML = '';
    noData.classList.add('hidden');
    renderAll(content, data);
  } catch (e) {
    content.innerHTML = '';
    noData.classList.remove('hidden');
    currentData = null;
  }
}

function changeClass(val) {
  if (val > 0) return 'up';
  if (val < 0) return 'down';
  return 'flat';
}

function fmtChange(val) {
  if (val == null) return '';
  const sign = val > 0 ? '+' : '';
  return `(${sign}${val.toFixed(2)}%)`;
}

function fmtPrice(val, decimals) {
  if (val == null) return '—';
  return val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderAll(container, data) {
  renderStocks(container, data.stocks);
  renderETF(container, data.crypto_etf);
  renderForex(container, data.forex);
  renderBonds(container, data.bonds);
  renderCommodities(container, data.commodities);
  if (data.news && data.news.length > 0) {
    renderNews(container, data.news);
  }
}

function createCard(title, bodyHtml) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<div class="card-head"><h2>${escapeHtml(title)}</h2></div><div class="card-body">${bodyHtml}</div>`;
  return card;
}

function renderStocks(container, stocks) {
  if (!stocks || stocks.length === 0) return;

  const stockMap = {};
  for (const s of stocks) {
    stockMap[s.ticker] = s;
  }

  let html = '';
  const groups = ['指数', '科技', '金融', '加密'];

  for (const groupKey of groups) {
    const group = STOCK_GROUPS[groupKey];
    html += `<div class="sub-label">${escapeHtml('「' + group.label + '」')}</div>`;
    html += '<div class="data-row">';

    for (const ticker of group.tickers) {
      const s = stockMap[ticker];
      if (!s) continue;
      const displayName = DISPLAY_NAMES[ticker] || s.name;
      const decimals = s.price >= 1000 ? 2 : s.price >= 100 ? 2 : 2;
      const cls = changeClass(s.change_pct);
      html += `<span class="data-item">
        <span class="name">${escapeHtml(displayName)}：</span>
        <span class="price">${fmtPrice(s.price, decimals)}</span>
        <span class="change ${cls}">${fmtChange(s.change_pct)}</span>
      </span>`;
    }
    html += '</div>';
  }

  container.appendChild(createCard('全球主要指数与重点美股', html));
}

function renderETF(container, etfData) {
  if (!etfData || etfData.length === 0) return;

  let html = '';
  for (const etf of etfData) {
    const dateParts = etf.date ? etf.date.split('-') : [];
    const dateStr = dateParts.length === 3
      ? `${parseInt(dateParts[1])} 月 ${parseInt(dateParts[2])} 日`
      : '';

    html += `<div class="etf-row">
      <span class="label">${escapeHtml(etf.name)}</span>
      净流入：<span class="mono">${escapeHtml(etf.net_inflow)}</span>
      ｜成交额：<span class="mono">${escapeHtml(etf.volume)}</span>
      ｜总资产：<span class="mono">${escapeHtml(etf.total_assets)}</span>（占市值 <span class="mono">${escapeHtml(etf.market_cap_pct)}</span>）
      <span class="etf-date">截至 ${dateStr}</span>
    </div>`;
  }

  container.appendChild(createCard('BTC / ETH / SOL 现货 ETF', html));
}

function renderForex(container, forex) {
  if (!forex || forex.length === 0) return;

  let html = '<div class="data-row">';
  for (const f of forex) {
    const decimals = f.price < 1 ? 5 : 4;
    html += `<span class="data-item">
      <span class="name">${escapeHtml(f.name)}：</span>
      <span class="price">${fmtPrice(f.price, decimals)}</span>
    </span>`;
  }
  html += '</div>';

  container.appendChild(createCard('外汇市场', html));
}

function renderBonds(container, bonds) {
  if (!bonds || bonds.length === 0) return;

  const BOND_NAMES = { 'U.S. 30Y': '30Y', 'U.S. 10Y': '10Y', 'U.S. 5Y': '5Y', 'U.S. 2Y': '2Y' };

  let html = '<div class="data-row">';
  for (const b of bonds) {
    const label = BOND_NAMES[b.name] || b.name;
    const sign = b.change_abs > 0 ? '+' : '';
    const changeStr = b.change_abs != null ? `(${sign}${b.change_abs.toFixed(3)})` : '';
    const cls = changeClass(b.change_abs);
    html += `<span class="data-item">
      <span class="name">${escapeHtml(label)}：</span>
      <span class="price">${b.price.toFixed(3)}%</span>
      <span class="change ${cls}">${changeStr}</span>
    </span>`;
  }
  html += '</div>';

  container.appendChild(createCard('美债收益率', html));
}

function renderCommodities(container, commodities) {
  if (!commodities || commodities.length === 0) return;

  const COMMODITY_NAMES = {
    'Brent Oil': 'Brent', 'WTI Crude Oil': 'WTI', 'Natural Gas': '天然气',
    'Gold': '黄金', 'Silver': '白银', 'Platinum': '铂金', 'Copper': '铜',
    'Heating Oil': '取暖油'
  };

  let html = '<div class="data-row">';
  for (const c of commodities) {
    const label = COMMODITY_NAMES[c.name] || c.name;
    const decimals = c.price >= 100 ? 2 : c.price >= 10 ? 3 : 4;
    const cls = changeClass(c.change_pct);
    html += `<span class="data-item">
      <span class="name">${escapeHtml(label)}：</span>
      <span class="price">${fmtPrice(c.price, decimals)}</span>
      <span class="change ${cls}">${fmtChange(c.change_pct)}</span>
    </span>`;
  }
  html += '</div>';

  container.appendChild(createCard('大宗商品', html));
}

function renderNews(container, news) {
  let html = '';
  for (const item of news) {
    const source = item.url
      ? `（<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.source)}</a>）`
      : item.source ? `（${escapeHtml(item.source)}）` : '';
    html += `<div class="news-item">${escapeHtml(item.content)}${source}</div>`;
  }

  container.appendChild(createCard('每日要闻与市场点评', html));
}

/* Export */
function initExport() {
  const btn = document.getElementById('export-btn');
  const panel = document.getElementById('export-panel');
  const wrapper = btn.closest('.export-wrapper');

  btn.addEventListener('click', () => panel.classList.toggle('open'));

  document.addEventListener('mousedown', (e) => {
    if (!wrapper.contains(e.target)) panel.classList.remove('open');
  });

  panel.querySelectorAll('.export-option').forEach(opt => {
    opt.addEventListener('click', () => {
      if (!currentData) return;
      const format = opt.dataset.format;
      if (format === 'pdf') exportPDF();
      else if (format === 'copy') {
        navigator.clipboard.writeText(exportSlackText()).then(() => showToast()).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = exportSlackText();
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showToast();
        });
      }
      panel.classList.remove('open');
    });
  });
}

function showToast() {
  const toast = document.getElementById('export-toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function exportPDF() {
  const printTitle = document.getElementById('print-title');
  printTitle.textContent = `传统金融市场日报 — ${currentData.date}`;
  window.print();
}

function exportSlackText() {
  const d = currentData;
  if (!d) return '';

  const stockMap = {};
  for (const s of d.stocks || []) stockMap[s.ticker] = s;

  function fmtS(ticker) {
    const s = stockMap[ticker];
    if (!s || s.price == null) return '';
    const name = DISPLAY_NAMES[ticker] || s.name;
    const pct = s.change_pct != null ? s.change_pct : 0;
    const sign = pct > 0 ? '+' : '';
    return `${name}：${fmtPrice(s.price, 2)} (${sign}${pct.toFixed(2)}%)`;
  }

  function joinItems(tickers) {
    return tickers.map(t => fmtS(t)).filter(Boolean).join(' ｜ ');
  }

  let out = `传统金融市场日报 — ${d.date}\n`;
  out += `详细数据见 Google Sheets（数据来源：Yahoo Finance / FRED / SoSoValue）\n\n`;

  out += `**全球主要指数与重点美股**\n\n`;
  out += `「指数」\n ${joinItems(STOCK_GROUPS['指数'].tickers)}\n\n`;
  out += `「科技」\n ${joinItems(STOCK_GROUPS['科技'].tickers)}\n\n`;
  out += `「金融」\n ${joinItems(STOCK_GROUPS['金融'].tickers)}\n\n`;
  out += `「加密」\n ${joinItems(STOCK_GROUPS['加密'].tickers)}\n\n`;

  out += `**BTC / ETH / SOL 现货 ETF**\n\n`;
  for (const etf of d.crypto_etf || []) {
    const dp = etf.date ? etf.date.split('-') : [];
    const dateStr = dp.length === 3 ? `${parseInt(dp[1])} 月 ${parseInt(dp[2])} 日` : '';
    out += `${etf.name} 净流入：${etf.net_inflow} ｜ 成交额：${etf.volume} ｜ 总资产：${etf.total_assets}（占市值 ${etf.market_cap_pct}）截至 ${dateStr}\n`;
  }
  out += '\n';

  out += `**外汇市场**\n\n`;
  const forexItems = (d.forex || []).map(f => {
    const dec = f.price < 1 ? 5 : 4;
    return `${f.name}：${fmtPrice(f.price, dec)}`;
  });
  out += forexItems.join(' ｜ ') + '\n\n';

  const BOND_NAMES = { 'U.S. 30Y': '30Y', 'U.S. 10Y': '10Y', 'U.S. 5Y': '5Y', 'U.S. 2Y': '2Y' };
  out += `**美债收益率**\n\n`;
  const bondItems = (d.bonds || []).filter(b => b.price != null).map(b => {
    const label = BOND_NAMES[b.name] || b.name;
    const chg = b.change_abs != null ? b.change_abs : 0;
    const sign = chg > 0 ? '+' : '';
    return `${label}：${b.price.toFixed(3)}% (${sign}${chg.toFixed(3)})`;
  });
  out += bondItems.join(' ｜ ') + '\n\n';

  const COMMODITY_NAMES = {
    'Brent Oil': 'Brent', 'WTI Crude Oil': 'WTI', 'Natural Gas': '天然气',
    'Gold': '黄金', 'Silver': '白银', 'Platinum': '铂金', 'Copper': '铜',
    'Heating Oil': '取暖油'
  };
  out += `**大宗商品**\n\n`;
  const commItems = (d.commodities || []).filter(c => c.price != null).map(c => {
    const label = COMMODITY_NAMES[c.name] || c.name;
    const dec = c.price >= 100 ? 2 : c.price >= 10 ? 3 : 4;
    const pct = c.change_pct != null ? c.change_pct : 0;
    const sign = pct > 0 ? '+' : '';
    return `${label}：${fmtPrice(c.price, dec)} (${sign}${pct.toFixed(2)}%)`;
  });
  out += commItems.join(' ｜ ') + '\n\n';

  if (d.news && d.news.length > 0) {
    out += `**每日要闻与市场点评**\n\n`;
    for (const item of d.news) {
      const src = item.source && item.url ? `（[${item.source}](${item.url})）` : '';
      out += `• ${item.content}${src}\n`;
    }
  }

  return out.trim();
}

init();
