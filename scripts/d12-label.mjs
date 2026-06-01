// Deriva qué número (1-12) pintar en cada cara geométrica para que el dado
// cumpla el layout real de un d12:
//   opuestos suman 13 (1-12, 2-11, 3-10, 4-9, 5-8, 6-7)
//   vecinos de la cara "1" en orden cíclico: 4, 6, 5, 10, 2
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

const sub = (a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]]
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
const norm=a=>{const l=Math.hypot(...a);return [a[0]/l,a[1]/l,a[2]/l]}

const centers=FACES.map(f=>{const c=[0,0,0];f.forEach(i=>{c[0]+=V[i][0];c[1]+=V[i][1];c[2]+=V[i][2]});return c.map(x=>x/5)})
const normals=centers.map(norm)

// opposite face = most antiparallel normal
const opposite=normals.map((n,i)=>{
  let best=-1,bd=Infinity
  normals.forEach((m,j)=>{if(j!==i){const d=dot(n,m);if(d<bd){bd=d;best=j}}})
  return best
})

// adjacency = share an edge (2 vertices)
const neighbors=FACES.map((f,i)=>{
  const set=new Set(f)
  const adj=[]
  FACES.forEach((g,j)=>{if(j!==i){const shared=g.filter(v=>set.has(v)).length;if(shared===2)adj.push(j)}})
  return adj
})

// cyclic order of neighbors around face f, by angle in the face plane
function cyclic(f){
  const n=normals[f], c=centers[f]
  let ref=norm(sub(centers[neighbors[f][0]],c))
  // remove component along n
  ref=norm([ref[0]-dot(ref,n)*n[0],ref[1]-dot(ref,n)*n[1],ref[2]-dot(ref,n)*n[2]])
  const b=cross(n,ref)
  return neighbors[f].slice().sort((p,q)=>{
    const vp=sub(centers[p],c), vq=sub(centers[q],c)
    const ap=Math.atan2(dot(vp,b),dot(vp,ref))
    const aq=Math.atan2(dot(vq,b),dot(vq,ref))
    return ap-aq
  })
}

const label=new Array(12).fill(0)
const f1=0
label[f1]=1
label[opposite[f1]]=12
const order=cyclic(f1)           // 5 neighbors of face 0 in cyclic order
const seq=[4,6,5,10,2]           // requested neighbor numbers of "1"
order.forEach((face,k)=>{
  label[face]=seq[k]
  label[opposite[face]]=13-seq[k]
})

// verify
const ok = label.every((x,i)=>x+label[opposite[i]]===13) && new Set(label).size===12
console.log('FACE_NUMBER =', JSON.stringify(label))
console.log('opposite    =', JSON.stringify(opposite))
console.log('valid sums-to-13 & permutation:', ok)
console.log('neighbors of face labeled 1 (cyclic):', order.map(f=>label[f]).join(' '))
