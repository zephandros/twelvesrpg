# Dice Simulation — Implementation Spec
# Sistema: 2 dados de 12 caras (2d12). No hay otro caso en la app.

## Overview

Simulación 3D de exactamente **2 dados de 12 caras (dodecaedros regulares)** usando
Babylon.js + Havok. El resultado es siempre dos números entre 1 y 12.
La animación es idéntica para todos los clientes conectados a la sesión.

Referencia visual: Roll20 3D dice roller.

---

## 1. Pre-computación del resultado

El resultado se calcula **antes** de la animación. La simulación es puramente cosmética.

```typescript
// Siempre 2 dados, siempre d12
interface RollResult {
  die1: number; // 1–12
  die2: number; // 1–12
}

function rollD12(): number {
  return Math.floor(Math.random() * 12) + 1;
}

const result: RollResult = { die1: rollD12(), die2: rollD12() };
const simulation = buildSimulation(result, seed);
broadcastSimulation(simulation);
```

---

## 2. Área de simulación

### Forma y tamaño
- Cuadrado centrado en el origen del mundo `(0, 0, 0)`
- Lado `S` = `Math.min(window.innerWidth, window.innerHeight)` en píxeles
- Convertido a unidades de mundo: `S_world = S / PIXEL_SCALE`
- Pantalla vertical → S = ancho de pantalla
- Pantalla horizontal → S = altura de pantalla
- Recalcular en `window.resize`

### Límites físicos (invisibles)
- Suelo en `y = 0`: impostor estático, muy delgado
- Cuatro paredes en `x = ±S_world/2` y `z = ±S_world/2`
- Propiedades de todos los límites:
  - `mass: 0`
  - `restitution: 0.35` (rebote moderado — el d12 es más redondo que un d6)
  - `friction: 0.55`

---

## 3. Cámara

```typescript
const camera = new ArcRotateCamera("cam", 0, 0, 0, Vector3.Zero(), scene);
camera.setPosition(new Vector3(0, S_world * 0.9, S_world * 0.7));
camera.setTarget(Vector3.Zero());
camera.fov = (60 * Math.PI) / 180;
camera.inputs.clear(); // cámara fija, sin control del usuario
```

Vista diagonal desde arriba-frente, similar a Roll20. No se mueve durante la simulación.

---

## 4. Lanzamiento

### Dos dados, dos lados opuestos
Los 2 dados se lanzan desde **lados opuestos** del cuadrado para que choquen en el centro.
Esto genera interacción física entre ellos y se ve mejor visualmente.

```typescript
// Die 1 viene del lado +Z
// Die 2 viene del lado -Z
// (el eje de oposición puede rotarse aleatoriamente cada tirada)

interface DieSimParams {
  spawnPosition: { x: number; y: number; z: number };
  linearVelocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
  initialRotation: { x: number; y: number; z: number; w: number }; // quaternion
  targetFace: number; // 1–12, la cara que debe quedar arriba
}
```

### Valores de spawn
```typescript
const half = S_world / 2;
const spread = S_world * 0.2; // dispersión lateral aleatoria

// Die 1: viene de +Z
die1.spawnPosition = { x: random(-spread, spread), y: S_world * 0.3, z: half + 0.1 };
die1.linearVelocity = { x: random(-0.3, 0.3), y: -S_world * 0.2, z: -S_world * 1.4 };

// Die 2: viene de -Z (opuesto)
die2.spawnPosition = { x: random(-spread, spread), y: S_world * 0.3, z: -(half + 0.1) };
die2.linearVelocity = { x: random(-0.3, 0.3), y: -S_world * 0.2, z: S_world * 1.4 };

// Angular velocity: aleatorio fuerte para ambos
die.angularVelocity = {
  x: random(-18, 18),
  y: random(-18, 18),
  z: random(-18, 18),
};
```

---

## 5. Geometría del dado (dodecaedro regular)

### Creación con Babylon.js (sin modelo externo)
```typescript
const die = MeshBuilder.CreatePolyhedron("d12", {
  type: 3,    // type 3 = dodecaedro regular en Babylon.js
  size: D12_SIZE, // ajustar según escala de la escena
}, scene);
```

Babylon.js incluye el dodecaedro nativo. No se necesita un .glb externo para la geometría base.
Si se desea un modelo con aristas más redondeadas (más realista), se puede importar un .glb
y reemplazar el mesh, manteniendo toda la lógica de normales igual.

### Propiedades físicas del d12
El dodecaedro es más esférico que un cubo. Esto afecta el comportamiento:
- Rueda más y por más tiempo antes de detenerse
- `restitution` del dado: `0.4` (rebota más que un d6)
- `friction` del dado: `0.3` (desliza más)
- El threshold de detección de reposo debe ser más tolerante

```typescript
new PhysicsImpostor(die, PhysicsImpostor.ConvexHullImpostor, {
  mass: 1,
  restitution: 0.4,
  friction: 0.3,
}, scene);
```

Usar **ConvexHullImpostor** (no BoxImpostor). Esto permite que Havok calcule
la colisión real sobre la geometría del dodecaedro.

---

## 6. Normales de cara del dodecaedro (para detección de cara arriba)

Un dodecaedro regular tiene 12 caras pentagonales. Sus normales de cara son los vértices
de un icosaedro regular (los dos poliedros son duales entre sí).

`φ = (1 + √5) / 2 ≈ 1.6180` (número áureo)
Magnitud de cada normal sin normalizar: `√(1 + φ²) ≈ 1.9021`

```typescript
// Normales de cara del dodecaedro en espacio local (normalizadas)
// Estos son los vectores matemáticos. El mapeo face → número (1-12)
// depende de la orientación del modelo específico (ver sección de calibración).

const PHI = (1 + Math.sqrt(5)) / 2;
const M = Math.sqrt(1 + PHI * PHI); // ≈ 1.9021

const D12_FACE_NORMALS_RAW = [
  new Vector3(0,      1,     PHI),   // índice 0
  new Vector3(0,      1,    -PHI),   // índice 1
  new Vector3(0,     -1,     PHI),   // índice 2
  new Vector3(0,     -1,    -PHI),   // índice 3
  new Vector3(1,     PHI,    0),     // índice 4
  new Vector3(1,    -PHI,    0),     // índice 5
  new Vector3(-1,    PHI,    0),     // índice 6
  new Vector3(-1,   -PHI,    0),     // índice 7
  new Vector3(PHI,   0,      1),     // índice 8
  new Vector3(PHI,   0,     -1),     // índice 9
  new Vector3(-PHI,  0,      1),     // índice 10
  new Vector3(-PHI,  0,     -1),     // índice 11
].map(v => v.normalize());

// Una vez calibrado el modelo, este mapa asocia número → normal
// Ejemplo (debe verificarse con el modelo real):
const D12_FACE_NORMALS: Record<number, Vector3> = {
  1:  D12_FACE_NORMALS_RAW[0],
  2:  D12_FACE_NORMALS_RAW[1],
  // ... completar tras calibración
};
```

### Calibración del mapeo cara → número
El índice de la normal no corresponde automáticamente al número impreso en la cara.
Depende de cómo Babylon.js genera el dodecaedro internamente (o del modelo .glb si se usa uno).

**Procedimiento de calibración (hacerlo una sola vez al inicio del proyecto):**

```typescript
// 1. Crear un dado estático con cada cara mirando hacia arriba
// 2. Imprimir qué índice de normal apunta más hacia Vector3.Up()
// 3. Inspeccionar visualmente qué número se ve en esa cara
// 4. Completar el mapa D12_FACE_NORMALS

function calibrateD12(dieMesh: AbstractMesh): void {
  for (let i = 0; i < 12; i++) {
    const normal = D12_FACE_NORMALS_RAW[i];
    // Orientar el dado para que normal[i] apunte hacia arriba
    // Renderizar → anotar qué número se ve → completar el mapa
    console.log(`Normal index ${i}: ${normal}`);
  }
}
```

**Solo necesita hacerse una vez.** Una vez mapeado, el mapa es constante.

---

## 7. Algoritmo de corrección de cara (Face Rigging)

La física no garantiza que el dado caiga en la cara correcta.
La corrección se aplica al final de la animación, de forma imperceptible.

```
Fase 1 — Física libre (0ms → ~2200ms)
  Havok simula tumbling, rebotes y colisiones entre los 2 dados.
  El d12 rueda más que un d6 — darle más tiempo.

Fase 2 — Detección de reposo (desde ~1500ms, cada frame)
  Por cada dado:
    velocidadLineal = impostor.getLinearVelocity().length()
    velocidadAngular = impostor.getAngularVelocity().length()
    Si ambas < SETTLE_THRESHOLD durante 5 frames consecutivos → dado en reposo
  
  SETTLE_THRESHOLD = 0.08  (más tolerante que d6 por su tendencia a rodar)
  Ambos dados deben estar en reposo para iniciar corrección.

Fase 3 — Corrección de cara (250ms, imperceptible)
  1. Detectar cara actual:
       getTopFace(dieMesh) → número 1-12
  2. Si cara actual === targetFace → no se necesita corrección.
  3. Si no coincide:
       a. Obtener quaternion objetivo: la rotación que pone targetFace mirando hacia +Y
       b. Deshabilitar PhysicsImpostor
       c. Lerp de quaternion actual a quaternion objetivo en 250ms
       d. Asentar posición en y = DIE_RADIUS (para que quede sobre el suelo)

Fase 4 — Resultado visible
  Dados estáticos mostrando las caras correctas. Mostrar UI del resultado.
```

```typescript
function getTopFace(dieMesh: AbstractMesh): number {
  const worldUp = Vector3.Up();
  let topFace = 1;
  let maxDot = -Infinity;

  for (const [faceStr, localNormal] of Object.entries(D12_FACE_NORMALS)) {
    const worldNormal = Vector3.TransformNormal(
      localNormal,
      dieMesh.getWorldMatrix()
    );
    const dot = Vector3.Dot(worldNormal, worldUp);
    if (dot > maxDot) {
      maxDot = dot;
      topFace = Number(faceStr);
    }
  }
  return topFace;
}

function getQuaternionForFaceUp(targetFace: number): Quaternion {
  // Rotación que lleva la normal de targetFace a apuntar hacia +Y
  const faceNormal = D12_FACE_NORMALS[targetFace];
  return Quaternion.FromUnitVectorsToRef(faceNormal, Vector3.Up(), new Quaternion());
}
```

---

## 8. Sincronización (host → clientes vía keyframes)

**El host corre la física real. Los clientes reproducen keyframes grabados.**
Esto garantiza que todos ven exactamente la misma animación independientemente
del hardware o navegador.

```typescript
interface Keyframe {
  t: number;                              // tiempo en ms
  px: number; py: number; pz: number;    // posición
  qx: number; qy: number; qz: number; qw: number; // quaternion
}

interface RollEvent {
  result: RollResult;                     // { die1: number, die2: number }
  params: [DieSimParams, DieSimParams];   // parámetros de lanzamiento (2 dados fijos)
  keyframes: [Keyframe[], Keyframe[]];    // keyframes grabados (uno por dado)
  timestamp: number;                      // para sincronizar inicio de reproducción
}
```

### Ruta Firebase
```
/sessions/{sessionId}/currentRoll  ← RollEvent completo
```

### Flujo
```
Host:
  1. Calcula result = { die1, die2 }
  2. Genera DieSimParams para ambos dados (posiciones opuestas)
  3. Corre simulación Havok (visible o en background, da igual)
  4. Graba keyframe cada 33ms (30 fps) para cada dado
  5. Aplica corrección de cara si es necesario (también grabada en keyframes)
  6. Escribe RollEvent en Firebase cuando la animación termina

Clientes (incluido host para mostrar):
  1. onValue() detecta el nuevo RollEvent en Firebase
  2. Inician reproducción simultánea (sincronizados por timestamp)
  3. Interpolan posición y quaternion entre keyframes (lerp)
  4. Duración total = keyframes[0].length * 33ms
  5. Al terminar, muestran UI del resultado

Tamaño estimado: ~60-90 keyframes por dado × 2 dados × ~56 bytes/keyframe ≈ 10KB por tirada
```

---

## 9. Materiales y renderizado

### Sin sombras
```typescript
// No crear ShadowGenerator
// No asignar mesh.receiveShadows ni mesh.castShadows
```

### Iluminación
```typescript
const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
hemi.intensity = 0.85;

const dir = new DirectionalLight("dir", new Vector3(-1, -1.5, -0.5), scene);
dir.intensity = 0.45;
// dir NO tiene shadow generator
```

### Material del dado
```typescript
const mat = new PBRMaterial("d12mat", scene);
mat.roughness = 0.35;
mat.metallic = 0.0;
// albedoTexture: atlas de 12 caras con números del 1 al 12
// Fondo del dado: blanco o color del setting
// Números: negro, fuente sans-serif bold de alta legibilidad
```

### Textura (atlas de 12 caras)
Un dodecaedro tiene 12 caras pentagonales. El UV mapping de `CreatePolyhedron` de Babylon.js
asigna cada cara de forma independiente. Usar un atlas donde cada región corresponde a una cara.
Alternativa: usar `DynamicTexture` para pintar los números proceduralmente durante la inicialización.

---

## 10. Estructura de archivos

```
apps/web/src/features/dice/
├── DiceCanvas.tsx          ← componente React: canvas overlay transparente
├── DiceEngine.ts           ← setup de escena Babylon.js, cámara, luces
├── DiceSimulation.ts       ← física Havok, grabación de keyframes, corrección de cara
├── DicePlayback.ts         ← reproducción de keyframes para clientes no-host
├── DiceSync.ts             ← Firebase: leer/escribir RollEvent en /currentRoll
├── d12Normals.ts           ← mapa calibrado de cara → normal para dodecaedro
└── types.ts                ← RollResult, RollEvent, DieSimParams, Keyframe
```

---

## 11. Constantes clave (ajustar en pruebas)

```typescript
export const DICE_CONFIG = {
  PIXEL_SCALE: 100,           // píxeles por unidad de mundo
  D12_SIZE: 0.5,              // radio del dado en unidades de mundo
  SETTLE_THRESHOLD: 0.08,     // velocidad mínima para considerar "en reposo"
  SETTLE_FRAMES: 5,           // frames consecutivos bajo threshold para confirmar reposo
  CORRECTION_DURATION_MS: 250,// duración del lerp de corrección de cara
  KEYFRAME_INTERVAL_MS: 33,   // 30fps para grabación de keyframes
  MAX_SIM_DURATION_MS: 4000,  // timeout máximo de simulación (forzar corrección)
} as const;
```
