# TWELVESRPG APP
Esta es una guía del flujo y posibles acciones de la app TWELVESRPG

## Login
El inicio de sesión. Correo y Contraseña para iniciar.

## Home
La vista principal, desde aquí se puede hacer lo siguiente:

- Crear Sala
- Unirse a una Sala
- Visualizar las Salas (Tanto Creadas como Unidas)
- Ver las preferencias (Settings)
- Ver la cuenta de Usuario
    
### Crear Sala
La sala se crea con un Nombre, Descripción y opcionalmente se puede establecer un número máximo de jugadores. Al crear la sala se genera un código que se podrá compartir con otros jugadores para que se unan.

En una sala, el usuario que creó la sala se le considera el Narrador o Director del Juego, también conocido como Dungeon Master (DM).

### Unirse a Sala
Para unirse a una sala hay que ingresar un código. Este código se genera cuando un jugador crea una sala.

## Sala
La Sala es donde se juega al juego. Consiste principalmente en un chat con 2 secciones principales:

- Partida
- Panel


#### Vista de los Jugadores

```
Desktop
-----------------------------
|               |           |
|               | Personaje |
|    Partida    | Notas     |
|               |           |
|               |           |
-----------------------------

Mobile
-------------
|           |
|  Partida  | 
|           | 
|           |
|           | 
-------------
-------------
|           |
| Personaje |
| Notas     |
|           |
|           |
-------------
```

#### Vista para el Narrador

```
Desktop
-----------------------------
|               | NPCS      |
|               | Eventos   |
|    Partida    | Recursos  |
|               | Jugadores |
|               | Dados     |
-----------------------------

Mobile
-------------
|           |
|  Partida  | 
|           | 
|           |
|           | 
-------------
-------------
| NPCS      |
| Eventos   |
| Recursos  |
| Jugadores |
| Dados     |
-------------
```
    
### Partida
La partida es donde ocurren todos los eventos. Consiste en un chat donde se van posteando todos los eventos que el DM va lanzando, donde se puede leer los diálogos de los NPCs. También puede mostrar inventarios, tiendas, botines de enemigos. Mostrar imágenes (Eventos que muestran un lightbox con una Imagen). En general la Partida es el juego.

### Panel
El Panel es un panel lateral de apoyo. Cambia dependiendo de si es el Narrador (el que creó la partida) o un Jugador.

Para el Jugador, el panel es el lugar donde gestionar...

- **Hoja de Personaje.** La hoja de personaje.
- **Notas.** Tomar notas

Para el Narrador, el panel es el lugar donde gestionar...

- **Recursos.** Imágenes, gifs, mapas, etc.
- **Eventos.** Pedir una tirada de dados. Mostrar una imagen. Abrir un inventario o una tienda.
- **NPCs.** Aquí se crean NPCs para que el DM pueda interpretar. Enemigos para combatir.
- **Estados.** El estado de la partida. Si están en Combate, en modo Rol o una Secuencia. Esto está por definirse.
- **Jugadores.** Una lista de los jugadores actuales, para revisar rápidamente sus hojas. 