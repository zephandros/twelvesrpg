/* sala-core.jsx — núcleo compartido: hook useSala() + vistas reutilizables.
   Cargar DESPUÉS de room-parts.jsx + sala-panels.jsx, ANTES de los shells
   (sala-interactive.jsx móvil / sala-desktop.jsx). */
const { useState, useRef, useEffect, useCallback } = React;

const STORE = 'twelves-sala-v1';
let _uid = 0;
const uid = () => 'm' + (++_uid) + '-' + Math.floor(Math.random() * 1e4);
const now = () => { const d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); };

/* --- motor de dados --- */
function rollDice(formula) {
  const m = (formula || '1d8').replace(/\s/g, '').match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) return null;
  const count = Math.min(parseInt(m[1] || '1'), 12);
  const sides = parseInt(m[2]);
  const mod = m[3] ? parseInt(m[3]) : 0;
  const rolls = []; let sum = 0;
  for (let i = 0; i < count; i++) { const r = 1 + Math.floor(Math.random() * sides); rolls.push(r); sum += r; }
  const total = sum + mod;
  const modStr = mod > 0 ? '+' + mod : mod < 0 ? '−' + Math.abs(mod) : '+0';
  let result = 'fail', resultLabel = 'Fallo';
  if (count === 1 && rolls[0] === sides) { result = 'crit'; resultLabel = 'Crítico'; }
  else if (total >= 10) { result = 'ok'; resultLabel = 'Éxito'; }
  return { count, sides, mod, modStr, rolls, sum, total, die: count + 'd' + sides, result, resultLabel };
}

function seedThread() {
  return [
    { id: uid(), type: 'day', label: 'Hoy · Sesión 4' },
    { id: uid(), type: 'narration', body: 'El metro de la ciudad de Graja está en silencio. Solo el goteo de una tubería rota marca el tiempo. Algo se mueve entre los vagones oxidados.' },
    { id: uid(), type: 'msg', who: 'El Vagabundo', av: 'npc', npc: true, role: { cls: 'npc', label: 'NPC' }, time: '20:14', avatarIco: 'mask', body: '«No deberíais estar aquí abajo… nadie que baja vuelve a ver la luz.»' },
    { id: uid(), type: 'msg', who: 'Zephandro', mine: true, time: '20:15', avatar: 'Z', body: 'Me acerco despacio, con las manos visibles. Intento calmarlo.' },
    { id: uid(), type: 'dice', actor: 'Zephandro', attr: 'Influencia', die: '1d8', roll: 6, mod: '+3', total: 9, result: 'fail', resultLabel: 'Fallo' },
    { id: uid(), type: 'image', title: 'La caverna olvidada', caption: 'El túnel se abre a una caverna', body: 'El túnel se abre a una bóveda de piedra negra. Raíces de luz palpitan en las paredes.' },
  ];
}

const DEFAULT_CHAR = { hearts: [true, true, false], luck: [true, true, true, false] };
const DEFAULT_NOTES = [
  'El Vagabundo mencionó que nadie que baja vuelve. La llave oxidada abre algo en la caverna.',
  'Pista: símbolo de tres lunas grabado en el vagón 12.',
];

function load() {
  try { const r = JSON.parse(localStorage.getItem(STORE)); if (r && r.messages) return r; } catch (e) {}
  return null;
}

/* ====================== HOOK ====================== */
function useSala() {
  const saved = load();
  const [role, setRole] = useState(saved?.role || 'player');
  const [view, setView] = useState('partida');     // móvil
  const [pTab, setPTab] = useState('Personaje');
  const [nTab, setNTab] = useState('Eventos');
  const [messages, setMessages] = useState(saved?.messages || seedThread());
  const [input, setInput] = useState('');
  const [speakAs, setSpeakAs] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [char, setChar] = useState(saved?.char || DEFAULT_CHAR);
  const [notes, setNotes] = useState(saved?.notes || DEFAULT_NOTES);
  const [newNote, setNewNote] = useState('');
  const [toast, setToast] = useState(null);

  const threadRef = useRef(null);
  const inputRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => { localStorage.setItem(STORE, JSON.stringify({ role, messages, char, notes })); }, [role, messages, char, notes]);
  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, [messages, view]);

  const flash = (msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 1900); };
  const add = useCallback((m) => setMessages(prev => [...prev, { id: uid(), ...m }]), []);

  const displayName = () => speakAs ? speakAs.name : (role === 'narrator' ? 'Narrador' : 'Zephandro');
  const avatarInit = () => role === 'narrator' ? 'DM' : 'Z';

  const send = () => {
    const text = input.trim();
    if (!text) return;
    if (text.startsWith('/')) {
      const sp = text.indexOf(' ');
      const cmd = (sp === -1 ? text.slice(1) : text.slice(1, sp)).toLowerCase();
      const rest = sp === -1 ? '' : text.slice(sp + 1).trim();
      if (cmd === 'tirar' || cmd === 'roll') {
        const r = rollDice(rest || '1d8');
        if (!r) { flash('Fórmula inválida — prueba /tirar 1d8+3'); return; }
        add({ type: 'dice', actor: displayName(), attr: 'Tirada libre', die: r.die, roll: r.count === 1 ? r.rolls[0] : r.sum, mod: r.modStr, total: r.total, result: r.result, resultLabel: r.resultLabel });
      } else if (cmd === 'susurrar' || cmd === 'w') {
        if (!rest) { flash('Escribe el mensaje a susurrar'); return; }
        add({ type: 'msg', who: displayName(), mine: true, time: now(), avatar: avatarInit(), whisper: true, body: rest + ' — (susurro)' });
      } else if (cmd === 'aparte' || cmd === 'ooc') {
        if (!rest) { flash('Escribe tu mensaje fuera de personaje'); return; }
        add({ type: 'msg', who: displayName(), mine: true, time: now(), avatar: avatarInit(), role: { cls: 'ghost', label: 'Aparte' }, body: rest });
      } else { flash('Comando no reconocido'); return; }
    } else {
      if (speakAs) add({ type: 'msg', who: speakAs.name, av: 'npc', npc: true, role: { cls: 'npc', label: 'NPC' }, time: now(), avatarIco: 'mask', body: '«' + text + '»' });
      else if (role === 'narrator') add({ type: 'narration', body: text });
      else add({ type: 'msg', who: 'Zephandro', mine: true, time: now(), avatar: 'Z', body: text });
    }
    setInput('');
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const goPartida = () => setView('partida');
  const dmRequest = (attr = 'Percepción') => { add({ type: 'request', attr, die: '1d8', target: 'Zephandro', done: false }); goPartida(); flash('Tirada de ' + attr + ' solicitada'); };
  const dmImage = (title = 'La caverna olvidada', caption = 'Toca para ampliar') => { add({ type: 'image', title, caption, body: 'Una imagen compartida por el Narrador.' }); goPartida(); flash('Imagen mostrada a la sala'); };
  const dmLoot = () => { add({ type: 'loot', kind: 'Botín', title: 'Rata gigante', action: 'Recoger todo', items: [{ ico: '🗝', name: 'Llave oxidada', qty: 1 }, { ico: '🧪', name: 'Vial de luz', qty: 2 }, { ico: '🪙', name: 'Monedas', qty: 12 }] }); goPartida(); flash('Botín abierto'); };
  const dmShop = () => { add({ type: 'loot', shop: true, kind: 'Tienda', title: 'Madame Ysolde', action: 'Comprar', items: [{ ico: '🗡', name: 'Daga rúnica', price: 24 }, { ico: '🛡', name: 'Broquel', price: 18 }, { ico: '🧪', name: 'Poción mayor', price: 9 }] }); goPartida(); flash('Tienda abierta'); };
  const dmState = (label, icon) => { add({ type: 'state', label, icon }); goPartida(); flash(label); };
  const speakNpc = (name) => { setSpeakAs({ name }); goPartida(); flash('Hablando como ' + name); setTimeout(() => inputRef.current?.focus(), 60); };

  const resolveRequest = (id, attr) => {
    const r = rollDice('1d8+3');
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === id);
      const next = prev.map(m => m.id === id ? { ...m, done: true } : m);
      next.splice(idx + 1, 0, { id: uid(), type: 'dice', actor: 'Zephandro', attr, die: '1d8', roll: r.rolls[0], mod: '+3', total: r.total, result: r.result, resultLabel: r.resultLabel });
      return next;
    });
  };
  const takeLoot = (id) => { setMessages(prev => prev.map(m => m.id === id ? { ...m, taken: true } : m)); flash('Objetos recogidos'); };
  const quickRoll = (formula = '1d8+4', attr = 'Atributo') => { const r = rollDice(formula); add({ type: 'dice', actor: 'Zephandro', attr, die: r.die, roll: r.rolls[0], mod: r.modStr, total: r.total, result: r.result, resultLabel: r.resultLabel }); goPartida(); flash('Dado lanzado'); };
  const reset = () => { setMessages(seedThread()); setChar(DEFAULT_CHAR); setNotes(DEFAULT_NOTES); setSpeakAs(null); setView('partida'); flash('Partida reiniciada'); };
  const switchRole = (r) => { setRole(r); setView('partida'); setSpeakAs(null); setPTab('Personaje'); setNTab('Eventos'); };

  return {
    role, view, setView, pTab, setPTab, nTab, setNTab, messages, input, setInput,
    speakAs, setSpeakAs, lightbox, setLightbox, char, setChar, notes, setNotes,
    newNote, setNewNote, toast, threadRef, inputRef, flash, send, onKey,
    dmRequest, dmImage, dmLoot, dmShop, dmState, speakNpc, resolveRequest, takeLoot,
    quickRoll, reset, switchRole,
  };
}

/* ============ render de un ítem del hilo ============ */
function ThreadItems({ sala }) {
  const { messages, role, setLightbox, resolveRequest, takeLoot } = sala;
  return messages.map(m => {
    switch (m.type) {
      case 'day': return <DayDiv key={m.id}>{m.label}</DayDiv>;
      case 'narration': return <Narration key={m.id}>{m.body}</Narration>;
      case 'state': return <StateDivider key={m.id} label={m.label} icon={m.icon ? I[m.icon] : I.swords} />;
      case 'msg': return <Msg key={m.id} who={m.who} av={m.av} npc={m.npc} role={m.role} time={m.time} whisper={m.whisper} body={m.body} mine={m.mine} avatar={m.avatarIco ? I[m.avatarIco] : m.avatar} />;
      case 'dice': return <DiceCard key={m.id} actor={m.actor} attr={m.attr} die={m.die} roll={m.roll} mod={m.mod} total={m.total} result={m.result} resultLabel={m.resultLabel} mine={role === 'player' && m.actor === 'Zephandro'} />;
      case 'image': return (
        <div key={m.id} className="tw-imgevent bleft" onClick={() => setLightbox(m)}>
          <div className="tw-imgframe">
            <div className="ph">{I.image}<span>{m.title}</span></div>
            <div className="tw-imgcap"><span>{m.caption}</span><span className="expand">{I.expand}Ampliar</span></div>
          </div>
        </div>
      );
      case 'loot': return (
        <div key={m.id} className="tw-event bleft">
          <div className="tw-event-head">{m.shop ? I.store : I.chest}<span className="tw-event-kind">{m.kind}</span><span className="tw-event-title">{m.title}</span></div>
          <div className="tw-loot-list">
            {m.items.map((it, i) => (
              <div className="tw-loot-item" key={i}>
                <div className="tw-loot-ico">{it.ico}</div>
                <div className="tw-loot-name">{it.name}</div>
                {it.qty && <div className="tw-loot-qty">×{it.qty}</div>}
                {it.price && <div className="tw-loot-price">{it.price} <span style={{ color: 'var(--accent)' }}>◈</span></div>}
              </div>
            ))}
          </div>
          <div className="tw-event-foot">
            <button className="tw-btn dark sm" style={{ flex: 1 }} disabled={m.taken} onClick={() => takeLoot(m.id)}>{m.taken ? '✓ Recogido' : m.action}</button>
            {m.shop && <button className="tw-btn sm">Cerrar</button>}
          </div>
        </div>
      );
      case 'request': return (
        <div key={m.id} className="tw-event req bleft">
          <div className="tw-event-head">{I.dice}<span className="tw-event-kind">Tirada solicitada</span><span className="tw-event-title">{m.attr}</span></div>
          {m.done ? <div className="tw-req-done">Tirada resuelta ✓</div> : (
            <div className="tw-req-foot">
              <div style={{ font: '400 12.5px/1.5 var(--font)', color: 'var(--ink-2)', marginBottom: '10px' }}>El Narrador pide una tirada de <strong>{m.attr}</strong> ({m.die} + modificador).</div>
              {role === 'player'
                ? <button className="tw-btn dark full" onClick={() => resolveRequest(m.id, m.attr)}>{I.dice} Tirar {m.die}</button>
                : <div style={{ font: '400 11px var(--font)', color: 'var(--ink-faint)', textAlign: 'center' }}>Esperando a {m.target}…</div>}
            </div>
          )}
        </div>
      );
      default: return null;
    }
  });
}

/* ============ contenido del composer (chips + banner + input) ============ */
function ComposerInner({ sala }) {
  const { role, input, setInput, send, onKey, speakAs, setSpeakAs, inputRef, flash, dmRequest, dmImage, dmLoot, speakNpc } = sala;
  const isCmd = input.trimStart().startsWith('/');
  const chips = role === 'narrator' ? (
    <div className="tw-cmdrow">
      <div className="tw-chip" onClick={() => dmRequest('Percepción')}>{I.dice}Pedir tirada</div>
      <div className="tw-chip" onClick={() => dmImage()}>{I.image}Imagen</div>
      <div className="tw-chip" onClick={dmLoot}>{I.chest}Botín</div>
      <div className="tw-chip" onClick={() => speakNpc('El Vagabundo')}>{I.mask}Hablar como NPC</div>
    </div>
  ) : (
    <div className="tw-cmdrow">
      <div className="tw-chip cmd" onClick={() => { setInput('/tirar 1d8+'); inputRef.current?.focus(); }}>{I.dice}/tirar</div>
      <div className="tw-chip cmd" onClick={() => { setInput('/susurrar '); inputRef.current?.focus(); }}>{I.whisper}/susurrar</div>
      <div className="tw-chip" onClick={() => inputRef.current?.focus()}>{I.user}Acción</div>
    </div>
  );
  return (
    <>
      {chips}
      {speakAs && (
        <div className="sala-speakas">{I.mask}<span>Hablando como <strong>{speakAs.name}</strong></span>
          <span className="x" onClick={() => setSpeakAs(null)}>{I.close}</span></div>
      )}
      <div className="tw-inputbar">
        <div className="tw-plus" onClick={() => flash('Adjuntar imagen o recurso')}>{I.plus}</div>
        <input ref={inputRef} className={'tw-input' + (isCmd ? ' iscmd' : '')} value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={onKey}
          placeholder={speakAs ? 'Habla como ' + speakAs.name + '…' : role === 'narrator' ? 'Narra la escena…' : 'Escribe o usa /comando'} />
        <div className={'tw-send' + (input.trim() ? '' : ' off')} onClick={send}>{I.send}</div>
      </div>
    </>
  );
}

/* lightbox + toast reutilizables */
function Lightbox({ sala }) {
  const { lightbox, setLightbox } = sala;
  if (!lightbox) return null;
  return (
    <div className="tw-lightbox" onClick={() => setLightbox(null)}>
      <div className="tw-lb-top">
        <div><div className="tw-lb-title">{lightbox.title}</div><div className="tw-lb-sub">Compartida por el Narrador</div></div>
        <div className="tw-lb-close">{I.close}</div>
      </div>
      <div className="tw-lb-img"><div className="ph">{I.image}<span>Imagen a pantalla completa</span></div></div>
      <div className="tw-lb-cap">«{lightbox.body}»</div>
    </div>
  );
}

Object.assign(window, { useSala, ThreadItems, ComposerInner, Lightbox, rollDice });
