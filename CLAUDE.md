# Twelvesrpg — Contexto de proyecto para Claude Code

## Qué es este proyecto

Twelvesrpg es un sistema de juego de rol de mesa (TTRPG) indie desarrollado por una sola persona.
El proyecto tiene varios componentes que convergen en una app interactiva central.

**Sitio existente**: www.twelvesrpg.com — sitio estático con MkDocs en GitHub Pages con dominio personalizado.
Contiene las reglas base del sistema (jugables sin setting específico) y el setting "Kovalet"
(mundo, habitantes, mecánicas exclusivas).

**Producto nuevo (este repo)**: la app interactiva central que unifica todo.

El desarrollador es programador con conocimientos de diseño. No hay equipo, no hay artista.

---

## El producto central: Twelvesrpg App

Una PWA mobile-first (con opción Capacitor para iOS y Android nativa) que integra:

1. **Mesa de dados 3D** — mecánica central del juego. Dados 3D con física real simulada.
2. **Hoja de personaje digital** — versión interactiva de la hoja física, con cálculos automáticos y sync en Firebase.
3. **Reglas in-app** — las reglas del juego.
4. **Herramientas de sesión** — iniciativa, contador de rondas, notas de partida.

La arquitectura visual clave: el canvas 3D de Babylon.js es una **capa transparente superpuesta**
sobre la web app. Los dados se ven flotando encima del contenido, no dentro de un iframe.

---

## Stack tecnológico — decisiones tomadas y sus razones

### Frontend
- **React + Vite + TypeScript** — base del SPA
- **Babylon.js 7.x** — motor 3D para los dados. Se eligió sobre Three.js por:
  - Integración nativa con Havok Physics (física AAA, el mismo motor de Halo/Forza)
  - PBR materials y sombras dinámicas out-of-the-box
  - Inspector visual para debug
  - Soporte WebGPU completo
- **@babylonjs/havok** — física de cuerpos rígidos para dados realistas
- **Capacitor** — empaqueta la misma PWA como APK/IPA nativa para App Store y Google Play

### Overlay técnico (dados sobre la web)
```css
#dice-canvas {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 100;
  pointer-events: none; /* usuarios interactúan con la web debajo */
}
```
```javascript
const engine = new Engine(canvas, true, {
  alpha: true,              /* fondo completamente transparente */
  preserveDrawingBuffer: true
});
scene.clearColor = new Color4(0, 0, 0, 0);
```
`pointer-events` se activa temporalmente solo cuando el usuario lanza los dados.

### Backend
- **Firebase Firestore** — datos persistentes (personajes, campañas, configuración)
- **Firebase Realtime Database** — eventos instantáneos (tiradas de dado en tiempo real a todos los observadores)
- **Firebase Auth** — autenticación de usuarios
- Razón sobre Supabase: menor latencia para eventos de juego en tiempo real, SDK nativo + web, sin necesidad de SQL para este caso de uso.

---

## Convenciones de desarrollo

- **Idioma del código**: inglés (variables, funciones, comentarios)
- **Idioma del contenido**: español (reglas, lore, UI de usuario final)
- **TypeScript strict mode**: siempre activado
- **Estilo**: Prettier + ESLint, 2 espacios de indentación
- **CSS**: Tailwind CSS para la UI de la app
- **Commits**: conventional commits (`feat:`, `fix:`, `chore:`, `content:`)

---

## Fases de desarrollo (orden recomendado)

### Fase 1 — Shell de la app (prioridad máxima)
- Setup del monorepo con Vite
- Navegación principal (React Router)
- Firebase Auth básico (login con Google)
- Módulo "Reglas in-app"
- Deploy básico como PWA

### Fase 2 — Mesa de dados 3D
- Integrar Babylon.js con canvas overlay transparente
- Dos dados de doce caras (d12) con física Havok funcionando
- Lanzamiento de los dados a través de un evento remoto.
- Sync del resultado vía Firebase Realtime DB a todos los clientes

### Fase 3 — Hoja de personaje digital
- Formulario React con campos del sistema Twelvesrpg
- Guardado en Firestore por usuario
- Cálculos automáticos de stats derivados
- Exportar como PDF

### Fase 4 — Kovalet y herramientas de sesión
- Kovalet browser: navegación del lore del setting
- Herramientas: iniciativa, contador de rondas, notas
- Soporte para múltiples settings (diseñado para expandir más allá de Kovalet)

### Fase 5 — Capacitor (nativa)
- Empaquetar para iOS y Android
- Vibración del teléfono al lanzar dados
- Push notifications para invitaciones a sesión

---

## Modelo de datos Firebase (referencia)

```
/users/{uid}
  - displayName, email, createdAt

/characters/{characterId}
  - userId: string
  - name: string
  - setting: "kovalet" | "base"
  - stats: { ... }   ← definidos por el sistema Twelvesrpg
  - updatedAt: timestamp

/sessions/{sessionId}
  - name: string
  - hostId: string
  - players: [uid]
  - setting: string
  - createdAt: timestamp

/sessions/{sessionId}/rolls/{rollId}   ← en Realtime DB para baja latencia
  - playerId: string
  - values: number[]   ← resultado de cada dado
  - diceType: "d6" | "d20" | etc.
  - timestamp: serverTimestamp
```

---

## Lo que NO hacer

- No duplicar el contenido de reglas: existe en `/content/`, se importa desde ahí.
- No construir el módulo de dados antes de tener la shell básica funcionando (riesgo técnico).
- No empezar por los módulos secundarios (Kovalet, herramientas) antes de tener Firebase Auth.
- No hardcodear texto en español dentro de componentes React; extraer a archivos de contenido.

---

## Recursos clave

- Babylon.js docs: https://doc.babylonjs.com/
- Havok Physics (Babylon.js): https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin
- Firebase docs: https://firebase.google.com/docs
- Capacitor docs: https://capacitorjs.com/docs
- Referencia de dados de referencia (open source, Babylon.js): https://github.com/3d-dice/dice-box
