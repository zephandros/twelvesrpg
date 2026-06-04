/* room-parts.jsx — iconos + primitivas compartidas de la Sala (→ window) */

const I = {
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>,
  gear: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  members: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  panel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>,
  send: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  dice: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>,
  chest: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10v9a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-9"/><path d="M2 10l2-5a1 1 0 0 1 .9-.6h14.2a1 1 0 0 1 .9.6l2 5"/><path d="M3 10h18"/><path d="M12 4v6M10 13h4v2h-4z"/></svg>,
  image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
  expand: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>,
  swords: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2M10 5L3 12l4 4 7-7"/></svg>,
  mask: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5s2 6 9 6 9-6 9-6"/><path d="M3 5c0 8 3 14 9 14s9-6 9-14"/><circle cx="8.5" cy="9" r="1" fill="currentColor"/><circle cx="15.5" cy="9" r="1" fill="currentColor"/></svg>,
  whisper: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  chev: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  note: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>,
  folder: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  bolt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>,
  coin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" strokeLinecap="round"/></svg>,
  store: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M3 9h18"/></svg>,
};

const Diamond = ({n}) => <span style={{color:'var(--accent)',fontSize:'13px',letterSpacing:'2px'}}>◈</span>;

/* barra superior de sala (móvil) */
function RoomBar({ name = 'Runeways', sub = '4 en línea', onPanel, panelIcon, code }) {
  return (
    <div className="tw-roombar">
      <div className="tw-iconbtn">{I.back}</div>
      <div className="tw-roombar-mid">
        <div className="tw-roombar-name">{name}</div>
        <div className="tw-roombar-sub"><span className="tw-livedot"></span>{sub}</div>
      </div>
      <div className="tw-iconbtn">{I.members}</div>
      <div className="tw-iconbtn">{panelIcon || I.panel}</div>
    </div>
  );
}

function StatusBar() {
  return <div className="tw-statusbar"><span>9:41</span><span className="dots">●●●</span></div>;
}

/* mensaje de diálogo */
function Msg({ who, role, time, avatar, av, body, cont, npc, whisper, mine, children }) {
  return (
    <div className={'tw-msg' + (cont ? ' cont' : '') + (mine ? ' mine' : '')}>
      {cont
        ? <div className="tw-avatar spacer"></div>
        : <div className={'tw-avatar' + (av ? ' ' + av : '')}>{avatar}</div>}
      <div className="tw-msg-main">
        {!cont && (
          <div className="tw-msg-head">
            <span className={'tw-msg-name' + (npc ? ' npc' : '')}>{who}</span>
            {role && <span className={'tw-roletag ' + role.cls}>{role.label}</span>}
            <span className="tw-msg-time">{time}</span>
          </div>
        )}
        {whisper
          ? <div className="tw-whisper">{I.whisper}<span>{body}</span></div>
          : <div className={'tw-msg-body' + (npc ? ' npc' : '')}>{body}</div>}
        {children}
      </div>
    </div>
  );
}

const Narration = ({ children }) => <div className="tw-narration">{children}</div>;

function StateDivider({ label = 'Combate iniciado', icon }) {
  return (
    <div className="tw-state">
      <div className="tw-state-pill">{icon || I.swords}<span>{label}</span></div>
    </div>
  );
}

const DayDiv = ({ children }) => <div className="tw-daydiv"><span>{children}</span></div>;

/* tarjeta tirada de dados */
function DiceCard({ actor = 'Zephandro', attr = 'Coordinación', die = 'd8', roll = 6, mod = '+6', total = 12, result = 'ok', resultLabel = 'Éxito', bleft, mine }) {
  return (
    <div className={'tw-event tw-dicecard' + (mine ? ' mine' : '') + (bleft ? ' bleft' : '')}>
      <div className="tw-event-head">
        {I.dice}
        <span className="tw-event-kind">Tirada · {attr}</span>
        <span className="tw-event-title">{actor}</span>
      </div>
      <div className="tw-dice">
        <div className="tw-die"><span className="dval">{roll}</span></div>
        <div className="tw-dice-mid">
          <div className="tw-dice-formula">{die} {mod} <span style={{color:'var(--ink-faint)'}}>= {total}</span></div>
          <div className="tw-dice-detail">Dado {roll} {mod.replace('+',' + ').replace('−',' − ')} modificador</div>
          <div style={{marginTop:'8px'}}><span className={'tw-result-tag ' + result}>{resultLabel}</span></div>
        </div>
        <div className="tw-dice-total">
          <div className="num">{total}</div>
          <div className="lbl">Total</div>
        </div>
      </div>
    </div>
  );
}

/* tarjeta inventario / botín / tienda */
function LootCard({ kind = 'Botín', title = 'Rata gigante', items = [], action = 'Recoger todo', shop, bleft, icon }) {
  return (
    <div className={'tw-event' + (bleft ? ' bleft' : '')}>
      <div className="tw-event-head">
        {icon || (shop ? I.store : I.chest)}
        <span className="tw-event-kind">{kind}</span>
        <span className="tw-event-title">{title}</span>
      </div>
      <div className="tw-loot-list">
        {items.map((it, i) => (
          <div className="tw-loot-item" key={i}>
            <div className="tw-loot-ico">{it.ico}</div>
            <div className="tw-loot-name">{it.name}</div>
            {it.qty && <div className="tw-loot-qty">×{it.qty}</div>}
            {it.price && <div className="tw-loot-price">{it.price} <span style={{color:'var(--accent)'}}>◈</span></div>}
          </div>
        ))}
      </div>
      <div className="tw-event-foot">
        <button className="tw-btn dark sm" style={{flex:1}}>{action}</button>
        {shop && <button className="tw-btn sm">Cerrar</button>}
      </div>
    </div>
  );
}

/* evento imagen */
function ImageEvent({ caption = 'Toca para ampliar', bleft }) {
  return (
    <div className={'tw-imgevent' + (bleft ? ' bleft' : '')}>
      <div className="tw-imgframe">
        <div className="ph">{I.image}<span>Imagen del DM</span></div>
        <div className="tw-imgcap"><span>{caption}</span><span className="expand">{I.expand}Ampliar</span></div>
      </div>
    </div>
  );
}

/* composer básico */
function Composer({ value, cmd, placeholder = 'Escribe o usa /comando', chips = true }) {
  return (
    <div className="tw-composer">
      {chips && (
        <div className="tw-cmdrow">
          <div className="tw-chip cmd">{I.dice}/tirar</div>
          <div className="tw-chip cmd">{I.whisper}/susurrar</div>
          <div className="tw-chip">{I.user}Acción</div>
          <div className="tw-chip">{I.note}Aparte</div>
        </div>
      )}
      <div className="tw-inputbar">
        <div className="tw-plus">{I.plus}</div>
        <div className="tw-field">
          {cmd
            ? <span><span className="cmdtoken">{cmd}</span> <span className="typed">{value}</span></span>
            : (value ? <span className="typed">{value}</span> : placeholder)}
        </div>
        <div className="tw-send">{I.send}</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  I, Diamond, RoomBar, StatusBar, Msg, Narration, StateDivider, DayDiv,
  DiceCard, LootCard, ImageEvent, Composer,
});
