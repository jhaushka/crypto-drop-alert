import { useState } from 'react';
import { Trash2, RefreshCw, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

export const AlertCard = ({ alert, onUpdateThreshold, onRemove }) => {
  const [threshold, setThreshold] = useState(alert.threshold);
  const [editing, setEditing] = useState(false);

  const handleThresholdBlur = () => {
    setEditing(false);
    if (threshold !== alert.threshold) {
      onUpdateThreshold(alert.id, threshold); // optimistic update in parent hook
    }
  };

  const fmt = (n) => n ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';
  const pct = (n) => `${n > 0 ? '+' : ''}${n?.toFixed(2)}%`;

  const cardBg = alert.triggered ? '#fef2f2' : alert.failed ? '#fffbeb' : '#ffffff';
  const borderColor = alert.triggered ? '#fca5a5' : alert.failed ? '#fcd34d' : '#e2e8f0';

  return (
    <div style={{
      background: cardBg, border: `1px solid ${borderColor}`,
      borderRadius: '12px', padding: '1rem', position: 'relative'
    }}>
      {/* Status badge */}
      {alert.triggered && (
        <div style={{
          position: 'absolute', top: '10px', right: '40px',
          background: '#fee2e2', color: '#dc2626',
          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px'
        }}>
          ALERT
        </div>
      )}
      {alert.failed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '12px', marginBottom: '8px' }}>
          <AlertTriangle size={12} />
          <span>Fetch failed — retrying</span>
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={() => onRemove(alert.id)}
        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
      >
        <Trash2 size={14} />
      </button>

      {/* Coin identity */}
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
          {alert.coin_symbol.toUpperCase()}
        </span>
        <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '8px' }}>
          {alert.coin_name}
        </span>
      </div>

      {/* Price row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Current price</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: alert.triggered ? '#dc2626' : '#1e293b' }}>
            {alert.currentPrice ? fmt(alert.currentPrice) : <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>24h change</div>
          <div style={{
            fontSize: '15px', fontWeight: 600,
            color: alert.change24h < 0 ? '#dc2626' : '#16a34a',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            {alert.change24h < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            {pct(alert.change24h)}
          </div>
        </div>
      </div>

      {/* Threshold — inline editable */}
      <div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
          Alert threshold {editing && <span style={{ color: '#6366f1' }}>• editing</span>}
        </div>
        <input
          type="number"
          value={threshold}
          onChange={e => { setThreshold(Number(e.target.value)); setEditing(true); }}
          onBlur={handleThresholdBlur}
          onKeyDown={e => e.key === 'Enter' && e.target.blur()}
          style={{
            width: '100%', padding: '6px 10px',
            border: `1px solid ${editing ? '#6366f1' : '#e2e8f0'}`,
            borderRadius: '8px', fontSize: '13px',
            background: 'transparent', outline: 'none'
          }}
        />
        {alert.currentPrice && alert.threshold > 0 && (
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {alert.triggered
              ? `↓ ${fmt(alert.currentPrice - alert.threshold)} below target`
              : `${fmt(alert.currentPrice - alert.threshold)} above target`
            }
          </div>
        )}
      </div>
    </div>
  );
};