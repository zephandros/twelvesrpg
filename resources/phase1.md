# Context — Navegación: engranaje + Cerrar Sesión

Se elimina el bottom nav (Salas / Ajustes) y el botón "Salir" del header. En su lugar:
- Header: ícono de engranaje (⚙) en la esquina superior derecha → navega a `/settings`
- Settings: botón "Cerrar Sesión" en rojo al final de todas las secciones
- Settings: botón `← Volver` al inicio para regresar a la pantalla anterior

---

# Plan — Navegación rediseñada

## 1. Instalar `lucide-react` (iconos)

```bash
pnpm add lucide-react
```

Usada para el ícono `<Settings size={20} />` en el header. Útil para futuros íconos en la app.

## 2. `src/components/Layout.tsx`

- Eliminar: `NavLink`, `signOut`, `auth`, bottom `<nav>`, botón "Salir"
- Añadir: `useNavigate`, ícono `<Settings>` de lucide-react como botón en el header
- El botón del engranaje llama `navigate('/settings')`

```tsx
import { Settings as SettingsIcon } from 'lucide-react'
// ...
<button onClick={() => navigate('/settings')} className="text-ink-faint hover:text-ink transition-colors p-1">
  <SettingsIcon size={18} />
</button>
```

## 3. `src/pages/Settings.tsx`

- Añadir al inicio: botón `{t('back')}` → `navigate(-1)`
- Añadir al final: botón "Cerrar Sesión" en rojo
  - Importar `signOut` de `firebase/auth` y `auth` de `@/lib/firebase`
  - Estilo: `text-red-500`, separado con un divisor visual

## 4. `src/locales/translations.csv`

Añadir una fila:
```
signOutButton|Cerrar Sesión|Sign Out
```

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/Layout.tsx` | Quitar nav + sign-out, añadir ícono engranaje |
| `src/pages/Settings.tsx` | Añadir back button + botón Cerrar Sesión en rojo |
| `src/locales/translations.csv` | Nueva key `signOutButton` |

---

## Verificación

1. Header muestra el ícono ⚙ en lugar de "Salir"
2. No hay bottom nav
3. Clic en ⚙ → navega a Settings
4. Settings muestra botón `← Volver` al inicio
5. Scroll al final de Settings → "Cerrar Sesión" en rojo
6. Clic en "Cerrar Sesión" → cierra sesión y redirige a /login

---

# Context — Internacionalización (i18n)

La app tiene ~48 strings hardcodeados en español. Se necesita un sistema i18n ligero que use un archivo pipe-delimitado (`translations.csv`) como fuente de verdad — fácil de editar por cualquier traductor. Para añadir un idioma nuevo basta agregar una columna al archivo.

---

# Plan — i18n

## 1. Archivo de traducciones (`src/locales/translations.csv`)

Formato: separador `|`, primera fila = encabezados, primera columna = key.

```
key|es|en
appName|TWELVES|TWELVES
appSubtitle|Sistema de rol|Role-playing system
back|← Volver|← Back
optional|(opcional)|(optional)
loading|...|...
copied|¡Copiado!|Copied!
copy|Copiar|Copy
navRooms|Salas|Rooms
navSettings|Ajustes|Settings
navSignOut|Salir|Sign out
loginTab|Iniciar sesión|Sign in
registerTab|Registrarse|Register
emailLabel|Correo electrónico|Email
passwordLabel|Contraseña|Password
signInButton|Entrar|Enter
registerButton|Crear cuenta|Create account
createButton|Crear|Create
joinButton|Unirse|Join
myRooms|Mis salas|My rooms
noMyRooms|No has creado ninguna sala.|You haven't created any rooms.
joinedRooms|Salas unidas|Joined rooms
noJoinedRooms|No te has unido a ninguna sala.|You haven't joined any rooms.
newRoomTitle|Nueva sala|New room
roomNameLabel|Nombre|Name
roomDescLabel|Descripción|Description
maxPlayersLabel|Máx. jugadores|Max. players
createRoomButton|Crear sala|Create room
createRoomError|Error al crear la sala|Error creating room
joinRoomTitle|Unirse a una sala|Join a room
roomCodeLabel|Código de sala|Room code
roomCodePlaceholder|XXXXXX|XXXXXX
joinRoomButton|Unirse|Join
invalidCodeError|Código inválido. Verifica e intenta de nuevo.|Invalid code. Please check and try again.
joinRoomError|Error al unirse a la sala|Error joining room
roomLabel|Sala|Room
roomPlaceholder|Vista de sala — Fase 2|Room view — Phase 2
appearanceSection|Apariencia|Appearance
lightMode|Claro|Light
darkMode|Oscuro|Dark
accountSection|Cuenta|Account
emailFieldLabel|Correo|Email
languageSection|Idioma|Language
```

## 2. Parser + tipos (`src/locales/index.ts`)

- Importa el CSV como raw string: `import raw from './translations.csv?raw'`
- Parsea línea por línea con `|` como separador
- Genera `Record<string, Record<string, string>>` — `{ es: { appName: 'TWELVES', ... }, en: { ... } }`
- Exporta `locales`, `type Locale = string`, `supportedLocales: string[]`
- Fallback: si una key no existe en el locale actual, usa español

## 3. Contexto (`src/contexts/LocaleContext.tsx`)

```ts
interface LocaleContextValue {
  locale: string
  setLocale: (l: string) => void
  t: (key: string) => string
}
```

- Inicializar desde `localStorage` (`twelves-locale`), default `'es'`
- `t(key)` devuelve `locales[locale][key] ?? locales['es'][key] ?? key`
- Exportar `useLocale()` hook

## 4. Actualizar `src/App.tsx`

```tsx
<ThemeProvider>
  <LocaleProvider>
    <BrowserRouter>...</BrowserRouter>
  </LocaleProvider>
</ThemeProvider>
```

## 5. Reemplazar strings en componentes

Patrón:
```tsx
const { t } = useLocale()
<button>{t('createButton')}</button>
```

Archivos: `Layout.tsx`, `Login.tsx`, `Home.tsx`, `CreateRoom.tsx`, `JoinRoom.tsx`, `Room.tsx`, `Settings.tsx`.

## 6. Toggle de idioma en `src/pages/Settings.tsx`

Sección "Idioma" dinámica — genera los botones desde `supportedLocales` con etiquetas:
```ts
const localeLabels: Record<string, string> = { es: 'Español', en: 'English' }
```

## 7. Actualizar memoria del proyecto

Actualizar `memory/project_design.md` con:
- Sistema de temas: ThemeContext, paletas, useRoomAmbiance
- Sistema i18n: LocaleContext, formato CSV pipe-delimitado, cómo añadir idiomas

---

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/locales/translations.csv` | Crear: fuente de verdad de traducciones |
| `src/locales/index.ts` | Crear: parser + tipos + fallback |
| `src/contexts/LocaleContext.tsx` | Crear: contexto + useLocale |
| `src/App.tsx` | Añadir LocaleProvider |
| `src/pages/Settings.tsx` | Toggle de idioma dinámico |
| `src/components/Layout.tsx` | Usar `t()` |
| `src/pages/Login.tsx` | Usar `t()` |
| `src/pages/Home.tsx` | Usar `t()` |
| `src/pages/CreateRoom.tsx` | Usar `t()` |
| `src/pages/JoinRoom.tsx` | Usar `t()` |
| `src/pages/Room.tsx` | Usar `t()` |

---

## Verificación

1. `pnpm exec tsc -b --noEmit` → sin errores
2. App carga en español por defecto
3. Settings → cambiar a English → UI cambia instantáneamente
4. Recargar → idioma persiste
5. Para añadir francés: agregar columna `fr` al CSV + `fr: 'Français'` en `localeLabels`

---

# Context — Sistema de Temas

Se necesita un sistema de temas con dos dimensiones ortogonales:
1. **Modo** (`light` / `dark`) — preferencia del usuario, persiste en localStorage
2. **Ambientación** — paleta de colores que el Narrador controla durante la partida, sincronizada por Firebase RTDB en Fase 2

Toda la UI usa tokens semánticos (`bg-surface`, `text-ink`, etc.) que Tailwind v4 resuelve como `var(--color-*)`. Sobreescribir esas variables con atributos en `<html>` es suficiente para cambiar el tema globalmente, con transiciones CSS. No hay que tocar los componentes existentes.

---

# Plan — Sistema de Temas

## 1. CSS: variables por tema (`src/index.css`)

Añadir después del bloque `@theme`:
- Transición global en `*, *::before, *::after` para `background-color`, `color`, `border-color` (0.4s ease)
- Un bloque por cada combinación `[data-mode][data-ambiance]` que sobreescriba las variables semánticas

Tokens a definir por cada combinación:
```
--color-ink         (texto principal)
--color-ink-light   (texto secundario)
--color-ink-faint   (texto terciario / placeholder)
--color-surface     (fondo principal)
--color-surface-2   (cards, inputs)
--color-border      (líneas divisoras)
--color-accent      (botón primario, indicador activo)
```

### Paletas

| Ambiance   | Mode  | surface        | ink         | accent           |
|------------|-------|----------------|-------------|------------------|
| default    | light | #ffffff        | #111111     | #111111          |
| default    | dark  | #111111        | #f0f0ee     | #f0f0ee          |
| sunset     | light | #fff8f3        | #1a0a00     | #e05c10          |
| sunset     | dark  | #0d0a1a        | #ffd4a8     | #f07030          |
| morning    | light | #fffef5        | #1a1400     | #c49000          |
| morning    | dark  | #0f0f00        | #fff3a0     | #d4b000          |
| night      | light | #f8f5ff        | #0a0015     | #6030c0          |
| night      | dark  | #05010f        | #d4c0ff     | #8050e0          |
| neon       | light | #f0f8ff        | #001020     | #0060e0          |
| neon       | dark  | #020408        | #00e8ff     | #ff00aa          |
| phosphor   | light | #f0fff0        | #001a00     | #007700          |
| phosphor   | dark  | #000500        | #00ff41     | #00cc33          |

El selector CSS por ambientación + modo:
```css
/* default dark */
[data-mode="dark"] { ... }

/* sunset light (sin [data-mode] o con [data-mode="light"]) */
[data-ambiance="sunset"] { ... }

/* sunset dark */
[data-mode="dark"][data-ambiance="sunset"] { ... }
```

Cuando `data-ambiance` no está presente → default.

## 2. Contexto React (`src/contexts/ThemeContext.tsx`)

```ts
type Mode = 'light' | 'dark'
type Ambiance = 'default' | 'sunset' | 'morning' | 'night' | 'neon' | 'phosphor'

interface ThemeContextValue {
  mode: Mode
  ambiance: Ambiance
  setMode: (m: Mode) => void
  setAmbiance: (a: Ambiance) => void  // Fase 2: llamado por el Narrador vía RTDB
}
```

- Al inicializar: leer `mode` de `localStorage` (`twelves-mode`), `ambiance` siempre empieza en `'default'`
- `setMode`: actualiza estado, localStorage y `document.documentElement.dataset.mode`
- `setAmbiance`: actualiza estado y `document.documentElement.dataset.ambiance`
- Aplicar atributos en el `useEffect` inicial para hidratar desde localStorage

Exportar también `useTheme()` hook.

## 3. Hook de ambientación por sala (`src/hooks/useRoomAmbiance.ts`)

Esqueleto para Fase 2 — suscribe a `rtdb` en `/sessions/{sessionId}/ambiance` y llama `setAmbiance`. En Fase 1 solo exportar el hook vacío para tenerlo listo.

## 4. Actualizar `src/App.tsx`

Envolver toda la app con `<ThemeProvider>`:
```tsx
<ThemeProvider>
  <BrowserRouter>...</BrowserRouter>
</ThemeProvider>
```

## 5. Toggle de modo en `src/pages/Settings.tsx`

Añadir sección "Apariencia" con botón/toggle `Claro / Oscuro` que llame a `setMode`.
Usar `useTheme()`.

## 6. Actualizar botón primario para usar `--color-accent`

En los componentes que tienen `bg-ink text-white` (botón primario), cambiar a `bg-accent text-surface` para que el acento cambie con el tema. Archivos: `Login.tsx`, `CreateRoom.tsx`, `JoinRoom.tsx`, `Home.tsx`, `Layout.tsx`.

---

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/index.css` | Añadir transición global + 12 bloques de variables |
| `src/contexts/ThemeContext.tsx` | Crear: contexto + provider + useTheme |
| `src/hooks/useRoomAmbiance.ts` | Crear: esqueleto para Fase 2 |
| `src/App.tsx` | Envolver con ThemeProvider |
| `src/pages/Settings.tsx` | Añadir toggle light/dark |
| `src/pages/Login.tsx` | `bg-ink` → `bg-accent` en botón |
| `src/pages/CreateRoom.tsx` | `bg-ink` → `bg-accent` en botón |
| `src/pages/JoinRoom.tsx` | `bg-ink` → `bg-accent` en botón |
| `src/pages/Home.tsx` | `bg-ink` → `bg-accent` en botón Crear |

---

## Verificación

1. `pnpm dev` — compilar sin errores
2. Ir a `/settings`, activar modo oscuro → toda la app cambia con transición suave
3. Cambiar de vuelta a claro → misma transición
4. Recargar página → el modo persiste (localStorage)
5. Abrir DevTools → en `<html>` se ven `data-mode="dark"` y `data-ambiance="default"`
6. Desde consola: `document.documentElement.dataset.ambiance = 'sunset'` → colores cambian en tiempo real con transición

---

# Context — Fase 1: Shell (completada)

Scaffold completo. Auth email/password, Home con salas, crear/unirse, routing protegido, Tailwind v4, Firebase, PWA.: construir el shell base de la PWA antes de tocar Babylon.js o módulos secundarios. El repo está vacío (solo `.gitignore` y `CLAUDE.md`). El objetivo es tener una app funcional desplegada en Firebase Hosting con autenticación email/contraseña, navegación principal y el flujo de salas básico (crear / unirse / listar).

**Decisiones confirmadas:**
- Un solo SPA (Vite + React + TypeScript)
- Auth: email + contraseña (Firebase Auth) — no Google
- Deploy en Firebase Hosting
- La app eventualmente reemplaza `www.twelvesrpg.com`
- Estilo visual: limpio y minimalista (blanco, tinta oscura, tipografía Lexend)

**Fuentes de diseño en `resources/`:**
- `twelves_character_sheet_mobile.html` — mockup con paleta y componentes de referencia
- `TWELVESRPG.md` — arquitectura de pantallas completa

---

# Plan — Fase 1: Shell de la App

## 1. Scaffold del proyecto

```bash
pnpm create vite . --template react-ts
pnpm add react-router-dom firebase react-markdown remark-gfm
pnpm add -D tailwindcss postcss autoprefixer vite-plugin-pwa
pnpm dlx tailwindcss init -p
```

## 2. Sistema de diseño (tokens extraídos del mockup)

Configurar en `tailwind.config.ts`:
```ts
colors: {
  ink: '#111',
  'ink-light': '#555',
  'ink-faint': '#aaa',
  surface: '#fff',
  'surface-2': '#f5f5f3',
  border: '#ddd',
}
fontFamily: { sans: ['Lexend', 'sans-serif'] }
```

Agregar en `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

## 3. Estructura de archivos

```
src/
  lib/
    firebase.ts          ← initializeApp, exporta auth + db + rtdb
  hooks/
    useAuth.ts           ← onAuthStateChanged → { user, loading }
  components/
    ProtectedRoute.tsx   ← redirige a /login si no autenticado
    Layout.tsx           ← nav bottom bar + outlet (mobile-first)
  pages/
    Login.tsx            ← form email + contraseña (signIn + signUp)
    Home.tsx             ← lista de salas + botones Crear / Unirse
    CreateRoom.tsx       ← form: nombre, descripción, max jugadores
    JoinRoom.tsx         ← input de código de sala
  App.tsx                ← rutas React Router v6
  main.tsx
content/
  rules/
    index.md
public/
  manifest.json
index.html
vite.config.ts           ← VitePWA plugin
firebase.json            ← SPA rewrite + hosting
.firebaserc
.env.example
```

## 4. Rutas

```
/           → Home (protegida) — lista salas del usuario
/login      → Login
/room/new   → CreateRoom (protegida)
/room/join  → JoinRoom (protegida)
/room/:id   → Sala (placeholder por ahora — Fase 2)
```

## 5. Configuración clave

**`src/lib/firebase.ts`** — `initializeApp` con config desde `import.meta.env.VITE_*`. Exportar `auth`, `db` (Firestore), `rtdb` (Realtime DB).

**`src/hooks/useAuth.ts`** — `useState<User | null>` + `useEffect(() => onAuthStateChanged(...))`. Retorna `{ user, loading }`.

**`src/pages/Login.tsx`** — dos modos: iniciar sesión / registrarse. Usar `signInWithEmailAndPassword` y `createUserWithEmailAndPassword`. Estilo: fondo blanco, formulario centrado, botón primario ink.

**`src/pages/Home.tsx`** — leer colección Firestore `rooms` donde `hostId == uid OR players array-contains uid`. Mostrar cards de salas. Botones flotantes "Crear sala" y "Unirse".

**`src/pages/CreateRoom.tsx`** — form simple → escribe doc en `rooms/{id}` con `hostId`, `name`, `description`, `maxPlayers`, `code` (nanoid 6 chars), `createdAt`.

**`src/pages/JoinRoom.tsx`** — input de código → query Firestore `where('code', '==', code)` → agrega uid a `players` array.

**`firebase.json`**:
```json
{ "hosting": { "public": "dist", "rewrites": [{ "source": "**", "destination": "/index.html" }] } }
```

**`vite.config.ts`** — `VitePWA({ registerType: 'autoUpdate', manifest: { name: 'Twelvesrpg', ... } })`.

## 6. Deploy (pendiente — post validación local)

El deploy a Firebase Hosting queda para cuando la app esté funcionando localmente. Se agrega `firebase.json` y `.firebaserc` al repo ahora, pero el deploy en sí es un paso posterior.

---

# Verificación (local)

1. `pnpm dev` → app en localhost, login con email funciona, redirige a Home.
2. Crear sala → aparece en Home con código generado.
3. Unirse con ese código → sala aparece en la lista.
4. Ruta `/room/:id` → muestra placeholder.
5. Sin sesión activa → rutas protegidas redirigen a `/login`.
6. `pnpm build` compila sin errores TypeScript strict.