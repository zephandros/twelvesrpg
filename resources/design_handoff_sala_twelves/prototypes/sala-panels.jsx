/* sala-panels.jsx — paneles interactivos del Jugador y del Narrador (→ window)
   Cargar DESPUÉS de room-parts.jsx y ANTES de sala-interactive.jsx */
const { useState: useStateP } = React;

function PlayerPanelLive({ tab, setTab, char, setChar, notes, setNotes, newNote, setNewNote, onRoll }) {
  const toggleHeart = (i) => setChar(c => ({ ...c, hearts: c.hearts.map((v, j) => j === i ? !v : v) }));
  const toggleLuck = (i) => setChar(c => ({ ...c, luck: c.luck.map((v, j) => j === i ? !v : v) }));
  const addNote = () => { const t = newNote.trim(); if (!t) return; setNotes(n => [...n, t]); setNewNote(''); };
  const delNote = (i) => setNotes(n => n.filter((_, j) => j !== i));

  return (
    <div className="tw-panel">
      <div className="tw-panel-head">
        <div>
          <div className="tw-eyebrow">Tu personaje</div>
          <div className="tw-panel-title">Zephandro</div>
        </div>
      </div>
      <div className="tw-paneltabs">
        <div className={'tw-ptab' + (tab === 'Personaje' ? ' active' : '')} onClick={() => setTab('Personaje')}>Personaje</div>
        <div className={'tw-ptab' + (tab === 'Notas' ? ' active' : '')} onClick={() => setTab('Notas')}>Notas</div>
      </div>
      <div className="tw-panel-body">
        {tab === 'Personaje' ? (
          <>
            <div className="tw-row2">
              <div className="tw-field-group"><div className="tw-field-label">Línea de Sangre</div><div className="tw-field-value">Cenizos</div></div>
              <div className="tw-field-group"><div className="tw-field-label">Trasfondo</div><div className="tw-field-value">Forajido</div></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="tw-sec-title">Atributos</div>
              <div className="tw-attr-grid">
                <div className="tw-attr"><span className="n">Movilidad</span><span className="v">14</span></div>
                <div className="tw-attr"><span className="n">Coordinación</span><span className="v">16</span></div>
                <div className="tw-attr"><span className="n">Percepción</span><span className="v">11</span></div>
                <div className="tw-attr"><span className="n">Físico</span><span className="v">9</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="tw-sec-title">Estatus</div>
              <div style={{ display: 'flex', gap: '28px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  <div className="tw-field-label">Salud</div>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    {char.hearts.map((on, i) => <span key={i} className={'heartt' + (on ? ' on' : '')} onClick={() => toggleHeart(i)}></span>)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  <div className="tw-field-label">Suerte</div>
                  <div style={{ display: 'flex', gap: '9px' }}>
                    {char.luck.map((on, i) => <span key={i} className={'luckt' + (on ? '' : ' off')} onClick={() => toggleLuck(i)}>◈</span>)}
                  </div>
                </div>
              </div>
              <div className="hint" style={{ font: '400 11px var(--font)', color: 'var(--ink-faint)' }}>Toca para marcar daño o gastar suerte.</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="tw-sec-title">Habilidades</div>
              <div className="tw-list-row" style={{ borderTop: 'none' }}><div className="tw-list-main"><div className="tw-list-name">Sigilo</div></div><span className="tw-loot-qty">+3</span></div>
              <div className="tw-list-row"><div className="tw-list-main"><div className="tw-list-name">Persuasión</div></div><span className="tw-loot-qty">+1</span></div>
              <div className="tw-list-row"><div className="tw-list-main"><div className="tw-list-name">Atletismo</div></div><span className="tw-loot-qty">+4</span></div>
            </div>

            <button className="tw-btn dark full" onClick={onRoll}>{I.dice} Tirar dado</button>
          </>
        ) : (
          <>
            <div className="tw-sec-title">Notas de sesión</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notes.length === 0 && <div className="sala-empty">Aún no tienes notas.</div>}
              {notes.map((n, i) => (
                <div key={i} style={{ position: 'relative', padding: '13px 36px 13px 15px', background: 'var(--surface-2)', borderRadius: '12px', font: '400 13.5px/1.6 var(--font)', color: 'var(--ink)' }}>
                  {n}
                  <span onClick={() => delNote(i)} style={{ position: 'absolute', top: '9px', right: '10px', color: 'var(--ink-faint)', cursor: 'pointer', display: 'flex' }}>{I.close}</span>
                </div>
              ))}
              <textarea className="tw-note-input" rows="2" placeholder="Escribe una nota nueva…"
                value={newNote} onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }} />
              <button className="tw-btn full" onClick={addNote}>{I.plus} Añadir nota</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NarratorPanelLive({ tab, setTab, actions }) {
  const { dmRequest, dmImage, dmLoot, dmShop, dmState, speakNpc, flash } = actions;
  const tabs = ['Eventos', 'NPCs', 'Recursos', 'Jugadores', 'Dados'];

  const body = () => {
    switch (tab) {
      case 'Eventos': return (
        <>
          <div className="tw-sec-title">Lanzar evento</div>
          <div className="tw-action-grid">
            <button className="tw-action" onClick={() => dmRequest('Percepción')}>{I.dice}<span className="t">Pedir tirada</span><span className="d">Solicita 1d8 + atributo</span></button>
            <button className="tw-action" onClick={() => dmImage()}>{I.image}<span className="t">Mostrar imagen</span><span className="d">Lightbox a toda la sala</span></button>
            <button className="tw-action" onClick={dmLoot}>{I.chest}<span className="t">Abrir inventario</span><span className="d">Botín o saqueo</span></button>
            <button className="tw-action" onClick={dmShop}>{I.store}<span className="t">Abrir tienda</span><span className="d">Mercader con precios</span></button>
          </div>
          <div className="tw-sec-title">Estado de la partida</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="tw-btn dark" style={{ flex: 1 }} onClick={() => dmState('Combate iniciado', 'swords')}>{I.swords}Combate</button>
            <button className="tw-btn" style={{ flex: 1 }} onClick={() => dmState('Modo Rol', 'mask')}>{I.mask}Rol</button>
            <button className="tw-btn" style={{ flex: 1 }} onClick={() => dmState('Secuencia', 'bolt')}>{I.bolt}Secuencia</button>
          </div>
        </>
      );
      case 'NPCs': return (
        <>
          <div className="tw-sec-title">NPCs e interpretación</div>
          <div>
            {[['El Vagabundo', 'Informante · neutral'], ['Capitán Vorr', 'Guardia de Graja · hostil'], ['Madame Ysolde', 'Mercader · amistosa']].map(([n, r]) => (
              <div className="tw-list-row" key={n}>
                <div className="tw-list-av npc">{I.mask}</div>
                <div className="tw-list-main"><div className="tw-list-name">{n}</div><div className="tw-list-meta">{r}</div></div>
                <button className="tw-btn sm" onClick={() => speakNpc(n)}>Interpretar</button>
              </div>
            ))}
          </div>
          <div className="tw-sec-title">Enemigos</div>
          <div className="tw-list-row" style={{ borderBottom: 'none' }}>
            <div className="tw-list-av npc">🐀</div>
            <div className="tw-list-main"><div className="tw-list-name">Rata gigante ×3</div><div className="tw-mini-hp"><i></i><i></i><i className="empty"></i></div></div>
            <button className="tw-btn sm dark" onClick={() => dmState('Combate iniciado', 'swords')}>Atacar</button>
          </div>
          <button className="tw-btn full" onClick={() => flash('Crear nuevo NPC')}>{I.plus} Crear NPC</button>
        </>
      );
      case 'Recursos': return (
        <>
          <div className="tw-sec-title">Recursos · mapas e imágenes</div>
          <div className="tw-res-grid">
            {[['Caverna olvidada'], ['Mapa del metro'], ['Símbolo · tres lunas']].map(([c]) => (
              <div className="tw-res" key={c} onClick={() => dmImage(c, 'Recurso del Narrador')}><div className="cap">{c}</div></div>
            ))}
            <div className="tw-res add" onClick={() => flash('Subir recurso')}>{I.plus}</div>
          </div>
          <div className="hint" style={{ font: '400 11px var(--font)', color: 'var(--ink-faint)' }}>Toca un recurso para mostrarlo en la Partida.</div>
        </>
      );
      case 'Jugadores': return (
        <>
          <div className="tw-sec-title">Jugadores · 4</div>
          <div>
            {[['Z', 'Zephandro', 'Cenizos · Forajido', [1, 1, 0]], ['M', 'Mirelle', 'Lunaria · Sanadora', [1, 1, 1]], ['K', 'Kaeled', 'Ferreo · Guerrero', [1, 0, 0]]].map(([in_, n, b, hp]) => (
              <div className="tw-list-row" key={n}>
                <div className="tw-list-av">{in_}</div>
                <div className="tw-list-main"><div className="tw-list-name">{n}</div><div className="tw-list-meta">{b}</div>
                  <div className="tw-mini-hp">{hp.map((f, i) => <i key={i} className={f ? '' : 'empty'}></i>)}</div></div>
                <button className="tw-btn sm" onClick={() => flash('Abriendo hoja de ' + n)}>Ver hoja</button>
              </div>
            ))}
          </div>
        </>
      );
      case 'Dados': return (
        <>
          <div className="tw-sec-title">Tirada rápida</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map(d => (
              <div key={d} className="tw-die" style={{ width: '46px', height: '46px' }} onClick={() => flash('Tirando ' + d + '…')}><span className="dval" style={{ fontSize: '15px' }}>{d}</span></div>
            ))}
          </div>
          <button className="tw-btn dark full" onClick={() => flash('Tirada en secreto realizada')}>{I.dice} Tirar en secreto</button>
        </>
      );
      default: return null;
    }
  };

  return (
    <div className="tw-panel">
      <div className="tw-paneltabs">
        {tabs.map(t => <div key={t} className={'tw-ptab' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>{t}</div>)}
      </div>
      <div className="tw-panel-body">{body()}</div>
    </div>
  );
}

Object.assign(window, { PlayerPanelLive, NarratorPanelLive });
