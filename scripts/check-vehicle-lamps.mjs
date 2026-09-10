import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const require=createRequire(import.meta.url);
function load(file){
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,m={exports:{}};
  new Function('require','module','exports',code)(id=>id==='@/lib/world'?load('lib/world.ts'):require(id),m,m.exports);
  return m.exports;
}
const {TRAFFIC}=load('lib/world.ts'),{createVehicleLamps}=load('components/world/vehicle-lamps.ts');
for(const model of TRAFFIC.models){
  // Remove image references only: this Node check uses the actual mesh data without a DOM image decoder.
  const b=fs.readFileSync(path.join('public',model.file)),length=b.readUInt32LE(12),data=JSON.parse(b.subarray(20,20+length));
  delete data.images;delete data.textures;delete data.samplers;
  for(const m of data.materials){
    for(const k of Object.keys(m))if(k.endsWith('Texture'))delete m[k];
    if(m.pbrMetallicRoughness){delete m.pbrMetallicRoughness.baseColorTexture;delete m.pbrMetallicRoughness.metallicRoughnessTexture;}
  }
  let json=Buffer.from(JSON.stringify(data));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
  const head=Buffer.from(b.subarray(0,20)),binary=b.subarray(20+length);
  head.writeUInt32LE(20+json.length+binary.length,8);head.writeUInt32LE(json.length,12);
  const clean=Buffer.concat([head,json,binary]);
  const gltf=await new GLTFLoader().parseAsync(clean.buffer.slice(clean.byteOffset,clean.byteOffset+clean.byteLength),'');
  gltf.scene.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(gltf.scene),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),scale=model.length/Math.max(size.x,size.z),parts=[];
  gltf.scene.traverse(o=>{
    if(!o.isMesh)return;
    let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);g.translate(-center.x,-bounds.min.y,-center.z);g.scale(scale,scale,scale);
    if(size.z>size.x)g.rotateY(Math.PI/2);
    if(g.index){const indexed=g;g=g.toNonIndexed();indexed.dispose();}
    for(const k of Object.keys(g.attributes))if(!['position','normal'].includes(k))g.deleteAttribute(k);
    parts.push(g);
  });
  const body=mergeGeometries(parts),lamps=createVehicleLamps(body);
  assert.equal(lamps.attributes.position.count,96,'Four fitted lenses for '+model.file);
  const probeMaterial=new T.MeshBasicMaterial({side:T.DoubleSide}),probe=new T.Mesh(body,probeMaterial),ray=new T.Raycaster();
  probe.updateMatrixWorld(true);
  const pos=lamps.attributes.position,centres=[];
  for(let i=0;i<4;i++){
    const p=new T.Vector3();for(let j=0;j<24;j++)p.add(new T.Vector3().fromBufferAttribute(pos,i*24+j));p.divideScalar(24);
    const front=i<2,sign=front?1:-1;
    ray.ray.origin.set(sign*(model.length+1),p.y,p.z);ray.ray.direction.set(-sign,0,0);
    const hit=ray.intersectObject(probe,false)[0];
    assert.ok(hit && Math.abs(hit.point.x-p.x)<0.001,'Lens centre must touch the real body surface');
    centres.push(p.toArray().map(v=>+v.toFixed(3)));
  }
  console.log(path.basename(model.file),{fittedLenses:4,centres});
  parts.forEach(g=>g.dispose());body.dispose();lamps.dispose();probeMaterial.dispose();
}
