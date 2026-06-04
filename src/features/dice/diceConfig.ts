export const DICE_CONFIG = {
  PIXEL_SCALE: 100,
  // Tamaño del dado como FACTOR de sWorld (lado del área de juego), no un valor
  // fijo. Así el dado ocupa la misma fracción de pantalla en cualquier
  // resolución (antes era fijo y en móvil se veía enorme). Esta es la perilla
  // para ajustar el tamaño visual: subir = dados más grandes, bajar = más chicos.
  D12_SIZE_FACTOR: 0.045,
  SETTLE_THRESHOLD: 0.08,
  SETTLE_FRAMES: 5,
  CORRECTION_DURATION_MS: 250,
  KEYFRAME_INTERVAL_MS: 33,
  MAX_SIM_DURATION_MS: 4000,
  // Cámara casi cenital estilo Roll20: muy desde arriba, leve inclinación
  CAMERA_HEIGHT_FACTOR: 1.35,   // y = sWorld * factor
  CAMERA_Z_FACTOR: 0.30,        // z = sWorld * factor (leve tilt; 0 sería cenital puro)
  CAMERA_FOV_DEG: 40,           // fov más cerrado → menos distorsión de perspectiva
} as const

/**
 * Parámetros del lanzamiento de cada dado (cómo se "tiran" sobre la mesa).
 *
 * Casi todos los valores son FACTORES que se multiplican por `sWorld` (el lado
 * del área de juego en unidades de mundo). Usar factores en vez de valores
 * absolutos hace que la sensación del lanzamiento sea igual en cualquier
 * tamaño de pantalla. Un factor más grande = más "fuerza".
 *
 * Los dos dados se lanzan desde lados opuestos del cuadrado (die1 desde +Z,
 * die2 desde -Z) para que choquen en el centro.
 */
export const THROW_CONFIG = {
  /**
   * Dispersión lateral (eje X) del punto de aparición, como factor de sWorld.
   * El dado aparece en una X aleatoria dentro de ±(sWorld * SPREAD_FACTOR).
   * Mayor = los dados salen desde posiciones más separadas a izquierda/derecha.
   */
  SPREAD_FACTOR: 0.2,

  /**
   * Altura (eje Y) del punto de aparición, como factor de sWorld.
   * Es desde qué tan alto "caen" los dados al iniciar. Mayor = caen desde más arriba.
   */
  SPAWN_HEIGHT_FACTOR: 0.2,

  /**
   * Margen extra (en unidades de mundo) más allá de la pared para el punto de
   * aparición en el eje de lanzamiento (Z). Mantiene el dado justo fuera/encima
   * del borde al empezar. Es un valor absoluto pequeño, no un factor.
   */
  SPAWN_EDGE_MARGIN: 0.1,

  /**
   * FUERZA PRINCIPAL DEL TIRO: velocidad horizontal hacia el centro (eje Z),
   * como factor de sWorld. Este es el valor que más cambia la "potencia" del
   * lanzamiento. Bajarlo (p. ej. 0.9) = tiro más suave; subirlo = más violento.
   */
  THROW_SPEED_FACTOR: 0.7,

  /**
   * Velocidad inicial hacia abajo (eje Y) al lanzar, como factor de sWorld.
   * Mayor = los dados son empujados al suelo más rápido (caída más agresiva).
   */
  DOWN_SPEED_FACTOR: 0.4,

  /**
   * Variación lateral aleatoria de la velocidad (eje X), valor absoluto.
   * Cada dado recibe una velocidad X aleatoria en ±SIDE_SPEED_JITTER para que
   * el tiro no sea perfectamente recto. Mayor = trayectorias más torcidas.
   */
  SIDE_SPEED_JITTER: 0.2,

  /**
   * Velocidad angular (giro) máxima en cada eje, en rad/s (valor absoluto).
   * Cada eje recibe un giro aleatorio en ±SPIN_MAX. Mayor = los dados ruedan y
   * dan más vueltas antes de asentarse; menor = se detienen antes.
   */
  SPIN_MAX: 9,
} as const

// Dirección en el plano del suelo que corresponde a "arriba" en la pantalla.
// Con la cámara mirando desde +Z hacia el origen, el borde lejano (arriba) es -Z.
export const SCREEN_UP_GROUND = { x: 0, y: 0, z: -1 } as const
