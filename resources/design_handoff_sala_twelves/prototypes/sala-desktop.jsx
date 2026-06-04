/* sala-desktop.jsx — shell ESCRITORIO interactivo (usa el núcleo useSala) */

function SalaDesktop() {
  const sala = useSala();
  const { role, pTab, setPTab, nTab, setNTab, char, setChar,
    notes, setNotes, newNote, setNewNote, threadRef, toast, flash, switchRole,
    reset, quickRoll, dmRequest, dmImage, dmLoot, dmShop, dmState, speakNpc } = sala;

  const panel = role === 'player'
    ? <PlayerPanelLive tab={pTab} setTab={setPTab} char={char} setChar={setChar}
        notes={notes} setNotes={setNotes} newNote={newNote} setNewNote={setNewNote}
        onRoll={() => quickRoll('1d8+4', 'Atributo')} />
    : (
      <>
        <div className="tw-panel-head">
          <div><div className="tw-eyebrow">Panel del Narrador</div><div className="tw-panel-title">Control</div></div>
        </div>
        <NarratorPanelLive tab={nTab} setTab={setNTab}
          actions={{ dmRequest, dmImage, dmLoot, dmShop, dmState, speakNpc, flash }} />
      </>
    );

  return (
    <>
      <div className="sala-d-stage">
        <div className="tw-desktop">
          <div className="tw-d-top">
            <div className="tw-iconbtn" onClick={() => flash('Volver a salas')}>{I.back}</div>
            <span className="tw-wordmark"><span className="w-accent">T</span>WELVES</span>
            <div className="tw-d-divv"></div>
            <div className="tw-d-roommeta">
              <div className="tw-roombar-name" style={{ fontSize: '15px' }}>Runeways</div>
              <div className="tw-roombar-sub"><span className="tw-livedot"></span>{role === 'narrator' ? 'Narrador · El metro de Graja' : 'El metro de Graja'}</div>
            </div>
            <div className="tw-presence">
              <div className="pa dm">DM</div><div className="pa">Z</div><div className="pa">M</div><div className="pa">K</div>
            </div>
            <div className="sala-d-roleswitch">
              <button className={'sala-role' + (role === 'player' ? ' active' : '')} onClick={() => switchRole('player')}>{I.user}Jugador</button>
              <button className={'sala-role' + (role === 'narrator' ? ' active' : '')} onClick={() => switchRole('narrator')}>{I.mask}Narrador</button>
            </div>
            <div className="tw-iconbtn" onClick={reset} title="Reiniciar">⟳</div>
            <div className="tw-iconbtn" onClick={() => flash('Ajustes de la sala')}>{I.gear}</div>
          </div>

          <div className="tw-d-body">
            <div className="tw-d-main">
              <div className="tw-d-thread" ref={threadRef}>
                <div className="tw-thread-inner"><ThreadItems sala={sala} /></div>
              </div>
              <div className="tw-d-composer"><div className="tw-thread-inner"><ComposerInner sala={sala} /></div></div>
            </div>
            <div className="tw-d-side">{panel}</div>
          </div>

          <Lightbox sala={sala} />
          {toast && <div className="sala-toast">{toast}</div>}
        </div>
      </div>

      <div className="sala-d-small">
        <span className="tw-wordmark"><span className="w-accent">T</span>WELVES</span>
        <div>Esta es la vista de <strong>escritorio</strong>.<br/>Amplía la ventana (≥720px) para verla,<br/>o abre la versión móvil del prototipo.</div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SalaDesktop />);
