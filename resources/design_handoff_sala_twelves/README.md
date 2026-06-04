# Handoff: TWELVES — Sala de juego (vistas móvil + escritorio)

## Overview
TWELVES es una app de mesa de rol (TTRPG) en línea. La **Sala** es la pantalla
principal donde transcurre la partida: un hilo de chat con narración, diálogo de
personajes y NPCs, tiradas de dados, botín/inventario e imágenes compartidas,
acompañado de un panel lateral contextual según el rol.

Hay un único producto con **dos roles** (Jugador y Narrador/DM) y **dos formatos
de pantalla**:

- **Móvil** — un único panel a pantalla completa con barra de pestañas inferior
  que alterna entre *Partida* (el chat) y *Panel* (hoja de personaje o controles
  del DM).
- **Escritorio** — dos columnas: el hilo de conversación a la izquierda y el panel
  contextual fijo a la derecha.

El mismo núcleo de estado y los mismos componentes de contenido alimentan ambos
formatos; sólo cambia la "carcasa" (shell) que los dispone.

## About the Design Files
Los archivos en `prototypes/` son **referencias de diseño hechas en HTML/CSS +
React vía Babel en el navegador** — prototipos que muestran el aspecto y el
comportamiento deseados, **no** código de producción para copiar tal cual.

La tarea es **recrear estos diseños en el entorno del codebase destino**
(React, React Native, Vue, SwiftUI, etc.) usando sus patrones, librerías y
sistema de diseño establecidos. Si todavía no existe un entorno, elige el
framework más apropiado para el proyecto (para una app web/móvil de tiempo real
como esta, React + un backend con websockets/realtime es una opción natural) e
implementa allí los diseños.

El prototipo usa React 18 cargado por CDN y JSX transpilado en el navegador con
Babel Standalone — eso es **sólo para que el prototipo corra sin build step**.
En producción se debe usar un bundler real y, casi con seguridad, mover el estado
compartido a un backend en tiempo real (ver *State Management*).

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciados, estados y micro-
interacciones son finales y deben reproducirse con precisión. Los valores exactos
están en `prototypes/room.css` (sistema visual base) y `prototypes/sala-app.css`
(capa interactiva). Las únicas piezas deliberadamente "placeholder" son las
**imágenes** (mapas/escenas), representadas con marcos rayados — ahí va contenido
real subido por el Narrador.

## Screens / Views

### 1. Sala — Móvil · Partida (chat)
- **Propósito:** seguir e intervenir en la partida; es la vista por defecto.
- **Layout:** frame de teléfono de `372 × 760px` (en el prototipo; en producción
  es responsive a pantalla completa). De arriba a abajo:
  1. **Status bar** simulada (sólo decorativa en el prototipo — omitir en una app nativa real).
  2. **Room bar** (`.tw-roombar`): botón atrás, nombre de sala ("Runeways") + subtítulo con punto "en vivo", botón de miembros, botón de panel.
  3. **Thread** (`.tw-thread`): lista scrolleable de ítems del hilo (ver *Componentes del hilo*). Auto-scroll al final al llegar mensajes nuevos.
  4. **Composer** (`.tw-composer`): fila de chips de comando + input + botón enviar.
  5. **Seg bar** inferior (`.tw-segbar`): pestañas *Partida* / *Panel* (rotulada "Panel DM" para el Narrador).
- **Selector de rol** (`.sala-roleswitch`): flotante FUERA del frame en el prototipo, sólo para demostrar ambos roles. **No es parte del producto** — en la app real el rol lo determina la sesión del usuario.

### 2. Sala — Móvil · Panel
- **Jugador:** hoja de personaje (`PlayerPanelLive`) con pestañas *Personaje* / *Notas*.
- **Narrador:** panel de control (`NarratorPanelLive`) con pestañas *Eventos / NPCs / Recursos / Jugadores / Dados*.

### 3. Sala — Escritorio
- **Propósito:** misma funcionalidad en formato de dos columnas para pantallas ≥720px.
- **Layout** (`.tw-desktop`, `max-width: 1340px`, `max-height: 880px`, centrado):
  - **Top bar** (`.tw-d-top`): botón atrás · wordmark `TWELVES` (la "T" en acento) · meta de sala · avatares de presencia (`DM Z M K`) · selector de rol integrado · botón reiniciar · botón ajustes.
  - **Body** (`.tw-d-body`): dos columnas.
    - **Main izquierda** (`.tw-d-main`): thread (`.tw-d-thread`) sobre composer (`.tw-d-composer`). El contenido se acota a una columna central de `max-width: 720px` (`.tw-thread-inner`) que comparten chat y composer.
    - **Side derecha** (`.tw-d-side`): el mismo panel de Jugador o Narrador, fijo.
  - Bajo 720px de ancho se muestra `.sala-d-small` pidiendo ampliar la ventana (en producción esto se sustituye por la vista móvil real).

## Componentes del hilo (compartidos en ambos formatos)
Definidos en `prototypes/room-parts.jsx` y renderizados por `ThreadItems` en
`prototypes/sala-core.jsx`. Cada ítem del hilo tiene un `type`:

- **`day`** → `DayDiv`: separador de día/sesión ("HOY · SESIÓN 4").
- **`narration`** → `Narration`: texto de ambientación en cursiva, centrado, sin avatar.
- **`state`** → `StateDivider`: píldora central con icono ("Combate iniciado", "Modo Rol", "Secuencia").
- **`msg`** → `Msg`: mensaje de diálogo con avatar, nombre, etiqueta de rol opcional (NPC / Aparte), hora y cuerpo.
  - **Mensaje propio (`mine`)**: alineado a la **derecha**, en burbuja (`border-radius: 15px 15px 5px 15px`, fondo `--surface-2`), avatar oscuro a la derecha.
  - **Susurro (`whisper`)**: cuerpo en cursiva con color de acento.
- **`dice`** → `DiceCard`: tarjeta de tirada. Cabecera ("TIRADA · {atributo}" + actor), dado grande con el valor, fórmula (`1d8 +3 = 9`), detalle ("Dado 6 + 3 modificador"), etiqueta de resultado (Crítico / Éxito / Fallo) y total grande a la derecha.
  - **Regla de alineación (IMPORTANTE):** la tarjeta de tirada se alinea como las burbujas de chat. La tirada **del propio jugador que la ve** va a la **derecha** (clase `mine`); las de los **demás** (otros jugadores, y todo lo que ve el Narrador) van a la **izquierda**. `max-width: 460px` (móvil) / `540px` (escritorio, vía `.tw-desktop .tw-event`). En el prototipo "mine" se determina con `role === 'player' && actor === 'Zephandro'` (el personaje del jugador de demo); en producción es `actor === personajeDelUsuarioActual`.
- **`image`** → marco de imagen clicable que abre un **lightbox** (`Lightbox`). En el prototipo la imagen es un placeholder rayado con título y "Ampliar".
- **`loot`** → `LootCard`: inventario/botín/tienda. Lista de ítems (icono, nombre, cantidad y/o precio) + acción ("Recoger todo" / "Cerrar"). Variante tienda muestra precios con `◈`.
- **`request`** → tarjeta "Tirada solicitada" por el DM: el jugador ve un botón "Tirar 1d8"; los demás ven "Esperando a {target}…". Al resolver, pasa a "Tirada resuelta ✓".

### Composer (`ComposerInner` en sala-core.jsx)
- **Chips de comando** según rol:
  - Jugador: `/tirar`, `/susurrar`, `Acción`.
  - Narrador: `Pedir tirada`, `Imagen`, `Botín`, `Hablar como NPC`.
- **Input** con detección de comando: si empieza por `/` el texto se tiñe de acento (`.tw-input.iscmd`).
- **Banner "hablando como NPC"** (`.sala-speakas`): aparece cuando el Narrador elige interpretar un NPC; con botón para cancelar.
- **Comandos soportados** (parseo en `send()`):
  - `/tirar` o `/roll` `<fórmula>` (p. ej. `1d8+3`) → añade ítem `dice`.
  - `/susurrar` o `/w` `<texto>` → mensaje susurro propio.
  - `/aparte` o `/ooc` `<texto>` → mensaje fuera de personaje (etiqueta "Aparte").
  - Texto plano → mensaje normal del rol actual.

## Interactions & Behavior
- **Cambio de rol** (`switchRole`): resetea la vista a *Partida*, limpia "hablar como NPC" y reinicia las pestañas de panel.
- **Tiradas de dados** (`rollDice` en sala-core.jsx): parsea `NdM(+/−K)`. Resultado:
  - `crit` ("Crítico") si es un solo dado y saca el máximo de caras.
  - `ok` ("Éxito") si `total >= 10`.
  - en otro caso `fail` ("Fallo").
  - Hay animación de dado (`@keyframes dieRoll`, clase `.tw-die.rolled`).
- **Acciones del Narrador** (en `NarratorPanelLive` → handlers en sala-core.jsx):
  - `dmRequest(attr)` → inserta una solicitud de tirada y va a *Partida* + toast.
  - `dmImage(title, caption)` → comparte imagen (abre en el hilo).
  - `dmLoot()` / `dmShop()` → inserta botín / tienda.
  - `dmState(label, icon)` → inserta divisor de estado (Combate / Rol / Secuencia).
  - `speakNpc(name)` → activa el modo "hablar como NPC".
- **Hoja de personaje (Jugador):**
  - `Salud` (corazones `.heartt`) y `Suerte` (rombos `.luckt ◈`) son toggles clicables.
  - Pestaña *Notas*: añadir (Enter o botón) y borrar notas; persisten en estado.
  - Botón "Tirar dado" hace una tirada rápida `1d8+4`.
- **Lightbox** de imagen: overlay con animación de entrada (`lbIn` / `lbImg`); cerrar con la X.
- **Toast** (`flash`): notificación inferior efímera (1.9s).
- **Auto-scroll:** el hilo hace scroll al fondo cuando cambian los mensajes o la vista.
- **Animaciones de entrada** respetan `prefers-reduced-motion` (estado visible = base; sólo se anima la entrada si se permite movimiento).
- **Estados hover/active:** definidos exhaustivamente en sala-app.css (botones se oscurecen, chips marcan borde, `:active { transform: scale(.95) }`, etc.).

## State Management
En el prototipo todo el estado vive en el hook `useSala()` (sala-core.jsx) y se
persiste en `localStorage` bajo una clave (`STORE`). Variables clave:

- `role` — `'player'` | `'narrator'`.
- `view` — `'partida'` | `'panel'` (sólo móvil).
- `pTab` / `nTab` — pestaña activa del panel de Jugador / Narrador.
- `messages` — array ordenado de ítems del hilo (la fuente de verdad del chat).
- `input`, `speakAs`, `lightbox`, `toast` — UI efímera.
- `char` — hoja de personaje (atributos, `hearts[]`, `luck[]`).
- `notes`, `newNote` — notas de sesión.

**En producción:** `messages`, `char`, estado de la partida y presencia deben vivir
en un **backend en tiempo real** (websockets / suscripciones) compartido por todos
los participantes de la sala, no en `localStorage`. El rol del usuario viene de su
sesión/membresía en la sala, no de un selector en pantalla. `localStorage` puede
seguir usándose para preferencias locales y borrador del composer.

## Design Tokens
Definidos en `:root` en `prototypes/room.css`:

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#121212` | Texto/elementos primarios, botones oscuros |
| `--ink-2` | `#555` | Texto secundario |
| `--ink-faint` | `#a6a6a3` | Etiquetas, texto terciario |
| `--ink-ghost` | `#c9c9c5` | Texto deshabilitado |
| `--surface` | `#ffffff` | Fondo de tarjetas/paneles |
| `--surface-2` | `#f4f4f1` | Burbujas propias, fondos suaves |
| `--surface-3` | `#ecece8` | Fondos terciarios |
| `--border` | `#e4e4e0` | Bordes/divisores |
| `--border-2` | `#d8d8d3` | Bordes de tarjetas |
| `--accent` | `oklch(0.63 0.12 46)` | Terracota cálido — comandos, suerte, acentos |
| `--accent-soft` | `oklch(0.95 0.03 60)` | Fondo del banner NPC |
| `--good` | `#121212` | (resultado positivo, monocromo) |
| `--font` | `'Lexend', sans-serif` | Toda la tipografía |

- **Tipografía:** Lexend (Google Fonts), pesos 300–700. Etiquetas tipo "eyebrow":
  9px, `font-weight 600`, `letter-spacing 0.16em`, mayúsculas, color `--ink-faint`.
  Cuerpo de mensaje: 14px / 1.55. Nombres: 13px / 600.
- **Radios:** chips/botones `999px`; tarjetas de evento `14px`; inputs `13px`;
  burbuja propia `15px 15px 5px 15px`; frame móvil `38px`.
- **Sombras:** suaves y bajas en opacidad; ver `box-shadow` de `.tw-phone`,
  `.tw-desktop`, `.sala-toast`, `.tw-action:hover`.
- **Espaciado:** múltiplos de ~2–4px; `gap` de flex/grid para todo (no márgenes
  por elemento). Columna de chat de escritorio acotada a `720px`.
- **Estética:** minimalista, blanco y negro, con acento terracota MUY sutil
  (sólo comandos, suerte, punto "en vivo" y la "T" del wordmark).

## Assets
- **Tipografía:** Lexend vía Google Fonts (`<link>` en los HTML). Sustituir por la
  fuente equivalente del codebase si aplica.
- **Iconos:** SVG inline en el objeto `I` al inicio de `prototypes/room-parts.jsx`
  (flecha atrás, dado, imagen, cofre, tienda, máscara/NPC, miembros, panel, espadas,
  rayo, usuario, susurro, expandir, cerrar, más, engranaje, etc.). Reemplazar por la
  librería de iconos del codebase, conservando trazo fino y tamaños (~13–15px).
- **Imágenes de partida (mapas/escenas):** **placeholders rayados** en el prototipo.
  Representan imágenes reales subidas por el Narrador — implementar carga/almacenamiento real.
- **Emoji:** unos pocos como contenido de demo (🐀, 🗝, 🧪, ◈ para "suerte"/precio).
  No son parte del sistema visual; reemplazar por iconos/datos reales.

## Files
Todos en `prototypes/`:

| Archivo | Rol |
|---|---|
| `Sala Interactiva - Twelves.html` | Punto de entrada **móvil** (monta `SalaMobile`) |
| `Sala Desktop - Twelves.html` | Punto de entrada **escritorio** (monta `SalaDesktop`) |
| `room.css` | Sistema visual base: tokens, tipografía, frame móvil, tarjetas, hilo, dados, paneles |
| `sala-app.css` | Capa interactiva: escenario, estados hover/active, animaciones, layout de escritorio, burbujas/tiradas alineadas |
| `room-parts.jsx` | Componentes presentacionales + set de iconos `I` (Msg, DiceCard, LootCard, Narration, StateDivider, etc.) |
| `sala-panels.jsx` | `PlayerPanelLive` (hoja de personaje) y `NarratorPanelLive` (control del DM) |
| `sala-core.jsx` | Hook `useSala()` (estado + lógica), `rollDice()`, `ThreadItems`, `ComposerInner`, semilla del hilo |
| `sala-interactive.jsx` | Shell **móvil** (`SalaMobile`) |
| `sala-desktop.jsx` | Shell **escritorio** (`SalaDesktop`) |

**Orden de carga** (ver los `<script>` en cada HTML): React → ReactDOM → Babel →
`room-parts.jsx` → `sala-panels.jsx` → `sala-core.jsx` → shell (`sala-interactive.jsx`
o `sala-desktop.jsx`). Para ver los prototipos basta con abrir cualquiera de los dos
HTML en un navegador.
