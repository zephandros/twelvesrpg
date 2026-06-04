/* sala-interactive.jsx — shell MÓVIL (usa el núcleo useSala) */

function SalaMobile() {
  const sala = useSala();
  const { role, view, setView, pTab, setPTab, nTab, setNTab, char, setChar,
    notes, setNotes, newNote, setNewNote, threadRef, toast, flash, switchRole,
    reset, quickRoll, dmRequest, dmImage, dmLoot, dmShop, dmState, speakNpc } = sala;

  const panel = role === 'player'
    ? <PlayerPanelLive tab={pTab} setTab={setPTab} char={char} setChar={setChar}
        notes={notes} setNotes={setNotes} newNote={newNote} setNewNote={setNewNote}
        onRoll={() => quickRoll('1d8+4', 'Atributo')} />
    : <NarratorPanelLive tab={nTab} setTab={setNTab}
        actions={{ dmRequest, dmImage, dmLoot, dmShop, dmState, speakNpc, flash }} />;

  const segLabel = role === 'narrator' ? 'Panel DM' : 'Panel';

  return (
    <div className="sala-stage">
      <div className="sala-roleswitch">
        <span className="lbl">Ver como</span>
        <button className={'sala-role' + (role === 'player' ? ' active' : '')} onClick={() => switchRole('player')}>{I.user}Jugador</button>
        <button className={'sala-role' + (role === 'narrator' ? ' active' : '')} onClick={() => switchRole('narrator')}>{I.mask}Narrador</button>
        <button className="sala-role" onClick={reset} title="Reiniciar">⟳</button>
      </div>

      <div className="tw-phone">
        <StatusBar />
        <div className="tw-roombar">
          <div className="tw-iconbtn" onClick={() => flash('Volver a salas')}>{I.back}</div>
          <div className="tw-roombar-mid">
            <div className="tw-roombar-name">Runeways</div>
            <div className="tw-roombar-sub"><span className="tw-livedot"></span>{role === 'narrator' ? 'Narrador · 4 jugadores' : '4 en línea'}</div>
          </div>
          <div className="tw-iconbtn" onClick={() => flash('4 jugadores en la sala')}>{I.members}</div>
          <div className="tw-iconbtn" onClick={() => setView(view === 'panel' ? 'partida' : 'panel')}>{I.panel}</div>
        </div>

        {view === 'partida' ? (
          <>
            <div className="tw-thread" ref={threadRef}><ThreadItems sala={sala} /></div>
            <div className="tw-composer"><ComposerInner sala={sala} /></div>
          </>
        ) : panel}

        <div className="tw-segbar">
          <div className={'tw-seg' + (view === 'partida' ? ' active' : '')} onClick={() => setView('partida')}>{I.swords}Partida</div>
          <div className={'tw-seg' + (view === 'panel' ? ' active' : '')} onClick={() => setView('panel')}>{I.panel}{segLabel}</div>
        </div>

        <Lightbox sala={sala} />
        {toast && <div className="sala-toast">{toast}</div>}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SalaMobile />);
