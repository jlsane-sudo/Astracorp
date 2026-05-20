import React from 'react';

const TYPE_STYLES = {
  success: {
    border: '1px solid rgba(34,197,94,0.35)',
    background: 'rgba(6, 12, 20, 0.94)',
    accent: '#22c55e',
  },
  error: {
    border: '1px solid rgba(239,68,68,0.35)',
    background: 'rgba(12, 6, 8, 0.94)',
    accent: '#ef4444',
  },
  warn: {
    border: '1px solid rgba(251,191,36,0.35)',
    background: 'rgba(12, 10, 4, 0.94)',
    accent: '#fbbf24',
  },
  info: {
    border: '1px solid rgba(56,189,248,0.35)',
    background: 'rgba(5, 10, 14, 0.94)',
    accent: '#38bdf8',
  },
};

function getTypeStyle(type) {
  return TYPE_STYLES[type] || TYPE_STYLES.info;
}

export function ToastStack({ toasts = [] }) {
  if (!Array.isArray(toasts) || toasts.length === 0) return null;

  return (
    <div style={styles.stack}>
      {toasts.map((toast) => {
        const typeStyle = getTypeStyle(toast.type);

        return (
          <div
  key={toast.id}
  onClick={() => toast.onClose?.(toast.id)}
  style={{
    ...styles.toast,
    border: typeStyle.border,
    background: typeStyle.background,
    cursor: 'pointer',
  }}
>
            <div
              style={{
                ...styles.accent,
                background: typeStyle.accent,
              }}
            />

            <div style={styles.content}>
              <div style={styles.message}>{toast.msg}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  stack: {
    position: 'fixed',
    right: 18,
    bottom: 18,
    display: 'grid',
    gap: 10,
    zIndex: 9999,
    width: 'min(320px, calc(100vw - 24px))',
    pointerEvents: 'none',
  },
  toast: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 14,
    boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    animation: 'toast-slide-in 180ms ease-out',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  content: {
    padding: '12px 14px 12px 16px',
  },
  message: {
    color: '#e5eef9',
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.45,
    wordBreak: 'break-word',
  },
};

export default ToastStack;