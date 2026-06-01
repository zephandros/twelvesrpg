// Simula el pipeline completo (faceBasis + computeTargetQ + cámara) para
// determinar qué número VE la cámara cuando pedimos cada resultado N.
const PHI = (1 + Math.sqrt(5)) / 2
const INV = 1 / PHI

const V = [
  [-1,-1,-1], [-1,-1, 1], [-1, 1,-1], [-1, 1, 1],
  [ 1,-1,-1], [ 1,-1, 1], [ 1, 1,-1], [ 1, 1, 1],
  [ 0,-INV,-PHI], [ 0,-INV, PHI], [ 0, INV,-PHI], [ 0, INV, PHI],
  [-INV,-PHI, 0], [-INV, PHI, 0], [ INV,-PHI, 0], [ INV, PHI, 0],
  [-PHI, 0,-INV], [-PHI, 0, INV], [ PHI, 0,-INV], [ PHI, 0, INV],
]
const FACES = [
  [0,8,4,14,12],[0,8,10,2,16],[0,12,1,17,16],[1,9,11,3,17],
  [1,9,5,14,12],[2,10,6,15,13],[3,11,7,15,13],[7,15,6,18,19],
  [7,11,9,5,19],[4,18,6,10,8],[4,14,5,19,18],[2,13,3,17,16],
]
const FACE_NUMBER = [1, 5, 6, 3, 4, 9, 12, 7, 8, 10, 2, 11]
const NUMBER_FACE = []; FACE_NUMBER.forEach((n,fi)=>NUMBER_FACE[n]=fi)

const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]]
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
const len=a=>Math.hypot(...a)
const norm=a=>{const l=len(a);return [a[0]/l,a[1]/l,a[2]/l]}

// faceBasis normals (outward via cross + flip), matching runtime
const normals = FACES.map(f=>{
  const pts=f.map(i=>V[i])
  const c=[0,1,2].map(k=>pts.reduce((s,p)=>s+p[k],0)/5)
  const e1=sub(pts[1],pts[0]), e2=sub(pts[2],pts[0])
  let n=cross(e1,e2); n=norm(n)
  if(dot(n,c)<0) n=[-n[0],-n[1],-n[2]]
  return n
})

// quaternion helpers
const qAxis=(axis,angle)=>{const h=angle/2,s=Math.sin(h);return [axis[0]*s,axis[1]*s,axis[2]*s,Math.cos(h)]}
const qMul=(a,b)=>[ // a*b (Babylon multiply: this=a, other=b -> returns a*b)
  a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
  a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
  a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
  a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2],
]
const qRot=(q,v)=>{ // rotate vector v by quaternion q
  const [x,y,z,w]=q
  const ix=w*v[0]+y*v[2]-z*v[1]
  const iy=w*v[1]+z*v[0]-x*v[2]
  const iz=w*v[2]+x*v[1]-y*v[0]
  const iw=-x*v[0]-y*v[1]-z*v[2]
  return [
    ix*w+iw*-x+iy*-z-iz*-y,
    iy*w+iw*-y+iz*-x-ix*-z,
    iz*w+iw*-z+ix*-y-iy*-x,
  ]
}

const up=[0,1,0]
const SCREEN_UP_GROUND=[0,0,-1]

// replicate computeTargetQ
function computeTargetQ(N){
  const fi=NUMBER_FACE[N]
  const localN=normals[fi]
  const d=Math.max(-1,Math.min(1,dot(localN,up)))
  const angle=Math.acos(d)
  let align
  if(angle<0.001) align=[0,0,0,1]
  else if(angle>Math.PI-0.001){
    const perp = Math.abs(localN[0])<0.9 ? norm(cross(localN,[1,0,0])) : norm(cross(localN,[0,0,1]))
    align=qAxis(perp,Math.PI)
  } else {
    align=qAxis(norm(cross(localN,up)),angle)
  }
  // yaw (does not affect which face is up; included for completeness)
  return align // yaw irrelevant for top-face determination
}

// camera direction (from origin toward camera) — what the camera sees as "top"
const camDir = norm([0, 1.35, 0.30])

console.log('N -> número visible por la cámara:')
for(let N=1;N<=12;N++){
  const q=computeTargetQ(N)
  // visible face = world normal most aligned with camDir
  let best=-1,bd=-Infinity
  normals.forEach((ln,fi)=>{
    const wn=qRot(q,ln)
    const d=dot(wn,camDir)
    if(d>bd){bd=d;best=fi}
  })
  const visible=FACE_NUMBER[best]
  const tag = visible===N ? 'OK' : (visible===13-N ? 'OPUESTO' : '???')
  console.log(`  N=${N}  visible=${visible}  [${tag}]`)
}
