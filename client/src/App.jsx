import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Plus, RefreshCw, Bell, Zap } from 'lucide-react';
import { useAlerts } from './hooks/useAlerts';
import { AlertCard } from './components/AlertCard';
import { AddCoinModal } from './components/AddCoinModal';
import './App.css';

export default function App() {
  const { alerts, loading, refreshing, countdown, lastFetchMs, addCoin, updateAlert, removeCoin, refreshPrices } = useAlerts();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'triggered'

  // Request browser notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const displayed = filter === 'triggered'
    ? alerts.filter(a => a.triggered)
    : alerts;

  const triggeredCount = alerts.filter(a => a.triggered).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Toaster position="top-right" />

      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 1.5rem', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={20} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>CryptoAlert</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Latency badge — makes Promise.all benefit visible */}
          {lastFetchMs && (
            <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '99px' }}>
              {alerts.length} coins in {lastFetchMs}ms
            </span>
          )}
          {triggeredCount > 0 && (
            <span style={{ fontSize: '12px', color: '#dc2626', background: '#fee2e2', padding: '4px 10px', borderRadius: '99px', fontWeight: 600 }}>
              {triggeredCount} alert{triggeredCount > 1 ? 's' : ''} triggered
            </span>
          )}
          <button
            onClick={refreshPrices}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              border: '1px solid #e2e8f0', background: '#fff',
              fontSize: '13px', cursor: 'pointer', color: '#1e293b'
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Fetching...' : `Refresh (${countdown}s)`}
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              background: '#6366f1', color: '#fff',
              border: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: 600
            }}
          >
            <Plus size={14} /> Track coin
          </button>
        </div>
      </header>

      <main style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats row */}
        {alerts.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Tracking', value: alerts.length },
              { label: 'Alerts triggered', value: triggeredCount },
              { label: 'Last fetch', value: lastFetchMs ? `${lastFetchMs}ms` : '—' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: '10px', padding: '12px 16px', minWidth: '120px'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{stat.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {alerts.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
            {['all', 'triggered'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
                  border: `1px solid ${filter === f ? '#6366f1' : '#e2e8f0'}`,
                  background: filter === f ? '#eef2ff' : '#fff',
                  color: filter === f ? '#6366f1' : '#64748b',
                  cursor: 'pointer', fontWeight: filter === f ? 600 : 400
                }}
              >
                {f === 'all' ? `All (${alerts.length})` : `Triggered (${triggeredCount})`}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <Bell size={40} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>No coins tracked yet</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '1.5rem' }}>
              Add coins you want to monitor. You'll get alerts when they drop below your threshold.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '10px 20px', borderRadius: '8px', background: '#6366f1',
                color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600
              }}
            >
              Track your first coin
            </button>
          </div>
        )}

        {/* Alert cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {displayed.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onUpdateThreshold={updateAlert}
              onRemove={removeCoin}
            />
          ))}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <AddCoinModal
          onAdd={addCoin}
          onClose={() => setShowModal(false)}
          existingIds={alerts.map(a => a.coin_id)}
        />
      )}
    </div>
  );
}