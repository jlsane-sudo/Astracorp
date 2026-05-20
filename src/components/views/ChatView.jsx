import { Button, Card } from '../ui';

export function ChatView({ chat, input, onInput, onSend }) {
  return (
    <div>
      <div className="pw-section-kicker">CHAT GLOBAL</div>
      <Card style={{ maxHeight: 420, overflow: 'auto' }}>
        {chat.map((m, i) => (
          <div key={`${m.t}-${i}`} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <strong>{m.avatar} {m.from}</strong>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>{m.msg}</div>
          </div>
        ))}
      </Card>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input className="pw-input" value={input} onChange={(e) => onInput(e.target.value)} placeholder="Escribe un mensaje..." />
        <Button onClick={onSend}>ENVIAR</Button>
      </div>
    </div>
  );
}
