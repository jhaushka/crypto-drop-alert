import { useState } from 'react';
import { X, Search } from 'lucide-react';

// Popular coins pre-loaded so user doesn't need to type IDs
const POPULAR_COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
  { id: 'matic-network', name: 'Polygon', symbol: 'MATIC' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
];

export const AddCoinModal = ({ onAdd, onClose, existingIds }) => {
  const [selected, setSelected] = useState(null);
  const [threshold, setThreshold] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = POPULAR_COINS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selected || !threshold) return;
    setSaving(true);
    try {
      await onAdd({
        coin_id: selected.id,
        coin_name: selected.name,
        coin_symbol: selected.symbol,
        threshold: parseFloat(threshold),
      });
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        alert(`${selected.name} is already tracked`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg, #fff)', borderRadius: '16px',
        padding: '1.5rem', width: '100%', maxWidth: '480px',
        border: '0.5px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Track a coin</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            placeholder="Search coins..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px', padding: '8px 8px 8px 36px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1.25rem', maxHeight: '200px', overflowY: 'auto' }}>
          {filtered.map(coin => {
            const isTracked = existingIds.includes(coin.id);
            const isSelected = selected?.id === coin.id;
            return (
              <button
                key={coin.id}
                onClick={() => !isTracked && setSelected(coin)}
                disabled={isTracked}
                style={{
                  padding: '8px', borderRadius: '8px', border: `1px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`,
                  background: isSelected ? '#eef2ff' : isTracked ? '#f8fafc' : '#fff',
                  cursor: isTracked ? 'not-allowed' : 'pointer',
                  opacity: isTracked ? 0.5 : 1,
                  fontSize: '13px', textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 600 }}>{coin.symbol}</div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>{coin.name}</div>
                {isTracked && <div style={{ color: '#94a3b8', fontSize: '10px' }}>tracked</div>}
              </button>
            );
          })}
        </div>

        {selected && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Alert me when {selected.name} drops below (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 5000000"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={!selected || !threshold || saving}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            background: selected && threshold ? '#6366f1' : '#e2e8f0',
            color: selected && threshold ? '#fff' : '#94a3b8',
            border: 'none', cursor: selected && threshold ? 'pointer' : 'not-allowed',
            fontSize: '14px', fontWeight: 600
          }}
        >
          {saving ? 'Adding...' : `Track ${selected?.name ?? 'coin'}`}
        </button>
      </div>
    </div>
  );
};  