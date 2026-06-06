// Headless Havok test mirroring the REAL dice app: capped play box + dice sized
// by sWorld (uncapped) + throw force scaled by sWorld. Probes tunneling.
// Run: node scripts/physics-test.mjs [sWorld]
import { readFileSync } from 'node:fs'
import { NullEngine, Scene, Vector3, MeshBuilder, PhysicsAggregate, PhysicsShapeType, HavokPlugin, FreeCamera, Quaternion } from '@babylonjs/core'
import HavokPhysics from '@babylonjs/havok'

const wasmBinary = readFileSync('node_modules/.pnpm/@babylonjs+havok@1.3.12/node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm')
const havok = await HavokPhysics({ wasmBinary })
const engine = new NullEngine()
const scene = new Scene(engine)
scene.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, havok))
new FreeCamera('cam', new Vector3(0, 5, -10), scene)

const sWorld = Number(process.argv[2] ?? 13.5) // large screen by default
const D12_SIZE_FACTOR = 0.045

// Capped play box (matches PLAY_AREA_MAX_W_PX=375, H_PX=512 / PIXEL_SCALE=100).
const halfX = Math.min(1.875, sWorld / 2)
const halfZ = Math.min(2.56, sWorld / 2)

// FINAL MODEL: dice + walls + throw all scale with the BOX (its depth), not sWorld.
const areaScale = halfZ * 2
const dieSize = areaScale * D12_SIZE_FACTOR
const wallT = dieSize * 2
const wallH = areaScale * 1.5

console.log(`sWorld=${sWorld} dieSize(radius)=${dieSize.toFixed(3)} wallT=${wallT.toFixed(3)} box halfX=${halfX} halfZ=${halfZ}`)

const opts = { mass: 0, restitution: 0.35, friction: 0.55 }
function addStatic(name, w, h, d, x, y, z) {
  const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene)
  m.position.set(x, y, z)
  new PhysicsAggregate(m, PhysicsShapeType.BOX, opts, scene)
}
const floorT = 0.05
const spanX = halfX * 2 + wallT * 2
const spanZ = halfZ * 2 + wallT * 2
addStatic('floor', spanX, floorT, spanZ, 0, -floorT / 2, 0)
addStatic('wallN', spanX, wallH, wallT, 0, wallH / 2, halfZ + wallT / 2)
addStatic('wallS', spanX, wallH, wallT, 0, wallH / 2, -(halfZ + wallT / 2))
addStatic('wallE', wallT, wallH, spanZ, halfX + wallT / 2, wallH / 2, 0)
addStatic('wallW', wallT, wallH, spanZ, -(halfX + wallT / 2), wallH / 2, 0)

// Two dice from opposite Z edges, thrown toward center (mirrors buildSimParams).
const spawnY = areaScale * 0.2
const inset = dieSize + 0.1
const throwSpeed = areaScale * 0.7
const downSpeed = areaScale * 0.4
function makeDie(name, zSign) {
  const die = MeshBuilder.CreatePolyhedron(name, { type: 2, size: dieSize }, scene)
  die.position.set(0, spawnY, zSign * (halfZ - inset))
  die.rotationQuaternion = Quaternion.Identity()
  const agg = new PhysicsAggregate(die, PhysicsShapeType.CONVEX_HULL, { mass: 1, restitution: 0.4, friction: 0.3 }, scene)
  agg.body.setLinearVelocity(new Vector3(0, -downSpeed, -zSign * throwSpeed))
  agg.body.setAngularVelocity(new Vector3(5, 5, 5))
  return die
}
const d1 = makeDie('die1', 1)
const d2 = makeDie('die2', -1)

const physicsEngine = scene.getPhysicsEngine()
let escaped = false
for (let step = 0; step < 300; step++) {
  physicsEngine._step(1 / 60)
  for (const [n, d] of [['d1', d1], ['d2', d2]]) {
    const outX = Math.abs(d.position.x) > halfX + wallT // past the wall (not just touching)
    const outZ = Math.abs(d.position.z) > halfZ + wallT
    const outY = d.position.y < -1
    if (outX || outZ || outY) {
      console.log(`ESCAPED step ${step} ${n}: x=${d.position.x.toFixed(2)} y=${d.position.y.toFixed(2)} z=${d.position.z.toFixed(2)}`)
      escaped = true
    }
  }
  if (escaped) break
}
console.log(`d1 final: x=${d1.position.x.toFixed(2)} y=${d1.position.y.toFixed(2)} z=${d1.position.z.toFixed(2)}`)
console.log(`d2 final: x=${d2.position.x.toFixed(2)} y=${d2.position.y.toFixed(2)} z=${d2.position.z.toFixed(2)}`)
console.log(escaped ? '>>> A DIE ESCAPED THE BOX (tunneling / no collision)' : '>>> both dice stayed inside the box (collision OK)')
engine.dispose()
process.exit(0)
