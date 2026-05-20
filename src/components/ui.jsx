import { useState } from 'react';

export function Bar({ val, max, color = '#10b981', h = 6 }) {
  const width = Math.min(100, (val / max) * 100);
  return (
    <div style={{ height: h, background: 'rgba(255,255,255,0.07)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${width}%`, background: color, transition: 'width 0.4s ease' }} />
    </div>
  );
}

export function pctColor(p) {
  return p >= 80 ? '#10b981' : p >= 50 ? '#f59e0b' : p >= 20 ? '#f97316' : '#f87171';
}

export function fmtE(n) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function Card({ children, style }) {
  return <div style={{ background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 11, ...style }}>{children}</div>;
}

export function Button({
  children,
  color = '#10b981',
  disabled = false,
  disabledReason = '',
  title,
  style,
  onClick,
  ...props
}) {
  const [pending, setPending] = useState(false);
  const isDisabled = disabled || pending;
  const resolvedTitle = title || (isDisabled && disabledReason ? disabledReason : undefined);

  const handleClick = async (event) => {
    if (isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      if (disabledReason || title) {
        window.dispatchEvent(new CustomEvent('astracorp:blocked-action', {
          detail: { reason: disabledReason || title },
        }));
      }
      return;
    }
    if (!onClick) return;
    setPending(true);
    try {
      await onClick(event);
    } finally {
      setTimeout(() => setPending(false), 260);
    }
  };

  return (
    <button
      {...props}
      type="button"
      aria-disabled={isDisabled}
      data-disabled={isDisabled ? 'true' : undefined}
      title={resolvedTitle}
      onClick={handleClick}
      style={{
        position: 'relative',
        minHeight: 30,
        minWidth: 92,
        border: `1px solid ${isDisabled ? '#1e293b' : color}`,
        borderRadius: 8,
        background: isDisabled ? 'transparent' : `${color}18`,
        color: isDisabled ? '#1e293b' : color,
        cursor: isDisabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        fontSize: 10,
        letterSpacing: 0.8,
        padding: '6px 10px',
        opacity: isDisabled ? 0.55 : 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        transition: 'opacity 0.16s ease, transform 0.16s ease, border-color 0.16s ease',
        ...style,
      }}
    >
      <span style={{ opacity: pending ? 0.55 : 1 }}>{children}</span>
      {pending ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 7,
            top: '50%',
            width: 5,
            height: 5,
            borderRadius: 999,
            background: color,
            transform: 'translateY(-50%)',
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      ) : null}
    </button>
  );
}
