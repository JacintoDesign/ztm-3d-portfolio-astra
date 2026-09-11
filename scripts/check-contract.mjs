import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),cache=new Map();
function load(name){const full=path.resolve('lib',name+'.ts');if(cache.has(full))return cache.get(full).exports;const source=fs.readFileSync(full,'utf8'),js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;const compiledModule={exports:{}};cache.set(full,compiledModule);const localRequire=(id)=>id.startsWith('.')?load(path.basename(id)):require(id);new Function('require','module','exports',js)(localRequire,compiledModule,compiledModule.exports);return compiledModule.exports;}
const {getContent,parseContent}=load('content'),content=getContent();
const source=fs.readFileSync('CONTENT.md','utf8');
const projectBlock=source.slice(source.indexOf('## Projects')).match(/### 01 — [\s\S]*?(?=### 02 —)/)[0];
assert.equal(parseContent(source.replace(projectBlock,'')).projects.length,content.projects.length-1);
assert.equal(parseContent(source.replace('## Contact',projectBlock.replace('### 01 —','### 99 —')+'\n## Contact')).projects.length,content.projects.length+1);
assert.equal(parseContent(source.replace(projectBlock,projectBlock.replace(content.projects[0].name,'A long replacement project title'))).projects[0].name,'A long replacement project title');
let audioCreated=0;globalThis.AudioContext=class {constructor(){audioCreated++;throw new Error('Audio must not start in a muted test');}};
load('audio').unlockAudio(true);assert.equal(audioCreated,0);
delete globalThis.AudioContext;
assert.equal(content.projects.length,10);assert.equal(content.channels.length,6);assert.equal(content.about.stories.length,5);
for(const project of content.projects){assert.ok(project.name);assert.ok(project.description);assert.ok(project.tech.length);assert.match(project.url,/^https:\/\//);assert.match(project.github,/^https:\/\/github.com\//);assert.ok(fs.existsSync(path.join('public',project.screenshot.replace(/^\//,''))));}
assert.equal(content.channels[0].url,'mailto:contact@jacinto.design');assert.equal(content.about.course.url,'https://academy.zerotomastery.io/a/aff_s02b4247/external?affcode=441520_7lacw2wa');assert.equal(content.about.now.url,'https://zerotomastery.io/courses/claude-code-bootcamp/');
const {moveAxis,addCollider,colliders}=load('collisions');
assert.equal(moveAxis(0,0,100,'x'),3.6);assert.equal(moveAxis(0,0,-100,'z'),-21);assert.equal(moveAxis(0,0,100,'z'),21.4);
addCollider('test-wall',2,0,1,1);assert.equal(moveAxis(0,0,3,'x'),1.18);assert.equal(moveAxis(0,2,3,'x'),3);assert.equal(moveAxis(3,0,0,'x'),2.82);
addCollider('test-wall',2,0,1,1);assert.equal(colliders.filter(c=>c.id==='test-wall').length,1);
const store=load('store');assert.equal(store.getState().muted,true);assert.equal(store.canControl(store.getState()),false);store.update({entered:true,mode:'play'});assert.equal(store.canControl(store.getState()),true);store.openOverlay('contact');assert.equal(store.canControl(store.getState()),false);store.closeTop();assert.equal(store.getState().mode,'play');store.travel('work');assert.equal(store.canControl(store.getState()),false);store.openOverlay('about');store.closeTop();assert.equal(store.getState().mode,'locked');store.release();assert.equal(store.getState().mode,'play');
store.pageProject(-1,4);assert.equal(store.getState().project,3);assert.equal(store.getState().manualPaging,true);store.pageProject(1,4);assert.equal(store.getState().project,0);
const {registerStation,nearestStation}=load('stations'),{BOARD,CART,MAIL}=load('world');
const unregister=[registerStation({id:'work',x:BOARD.position[0],z:BOARD.position[2],radius:BOARD.radius,label:'Projects',open:()=>{}}),registerStation({id:'about',x:CART.x,z:CART.z,radius:CART.radius,label:'About',open:()=>{}}),registerStation({id:'contact',x:MAIL.x,z:MAIL.z,radius:MAIL.radius,label:'Contact',open:()=>{}})];
for(const mobile of [false,true])for(const destination of ['about','work','contact']){Object.assign(store.pose,store.targetPose(destination,mobile));assert.equal(nearestStation()?.id,destination,`${destination} nearest facing station (${mobile?'mobile':'desktop'})`);}
store.pose.x=0;store.pose.z=0;store.pose.yaw=0;assert.equal(nearestStation(),null);unregister.forEach(fn=>fn());
const {LAYOUT}=load('world');
for(const [width,height] of [[320,932],[391,844],[768,1024],[1440,900]]){
  globalThis.window={};globalThis.innerWidth=width;globalThis.innerHeight=height;
  const target=store.targetPose('work',width<820);
  assert.ok(target.x>=LAYOUT.bounds.minX&&target.x<=LAYOUT.bounds.maxX);
  assert.ok(target.z>=LAYOUT.bounds.minZ&&target.z<=LAYOUT.bounds.maxZ);
  assert.ok(Math.abs(target.yaw-Math.atan2(BOARD.position[0]-target.x,BOARD.position[2]-target.z))<1e-10);
}
delete globalThis.window;delete globalThis.innerWidth;delete globalThis.innerHeight;
const {stepWalking}=load('navigation');
function resetWalk(){store.clearInput();Object.assign(store.pose,{x:0,z:0,yaw:0,pitch:0});store.update({mode:'play',reduced:false});}
resetWalk();store.input.keys.add('w');for(let i=0;i<120;i++)stepWalking(1/120);assert.ok(store.pose.z>2.2&&store.pose.z<2.6);assert.equal(store.pose.velocityZ,2.6);
resetWalk();store.update({reduced:true});store.input.keys.add('w');store.input.keys.add('d');stepWalking(1);assert.ok(Math.abs(Math.hypot(store.pose.x,store.pose.z)-2.6)<1e-10);
resetWalk();store.update({reduced:true});store.input.keys.add('w');store.input.stickY=1;stepWalking(1);assert.equal(store.pose.z,2.6);
store.openOverlay('contact');const frozen=[store.pose.x,store.pose.z];store.input.keys.add('w');stepWalking(1);assert.deepEqual([store.pose.x,store.pose.z],frozen);
resetWalk();store.update({reduced:true});store.input.stickY=.5;stepWalking(1);assert.equal(store.pose.z,1.3);
resetWalk();store.update({reduced:true});store.input.keys.add('w');for(let i=0;i<1000;i++)stepWalking(1/60);assert.equal(store.pose.z,21.4);
const {trafficX}=load('traffic');
const {TRAFFIC,FLICKER}=load('world');
const {flickerAt}=load('flicker');
for(let lane=0;lane<2;lane++){
  for(let index=0;index<3;index++){assert.equal(trafficX(0,lane,index,true),trafficX(10000,lane,index,true));}
  for(const time of [0,1,60,3600]){
    const positions=[0,1,2].map(i=>trafficX(time,lane,i,false)).sort((a,b)=>a-b);
    for(let i=0;i<3;i++){const gap=(positions[(i+1)%3]-positions[i]+TRAFFIC.loop)%TRAFFIC.loop;assert.ok(gap>60);}
  }
}
const period=FLICKER.sequence.length*FLICKER.step+FLICKER.hold;
assert.equal(flickerAt(3),1);assert.equal(flickerAt(FLICKER.step*2.5),.2);
assert.ok(Math.abs(flickerAt(FLICKER.step*2.5)-flickerAt(period+FLICKER.step*2.5))<1e-10);
console.log('Contract checks passed: content, local screenshots, bounds, sliding collision, mode gating, muted default, paging all guided station poses, movement speed, diagonal normalization, mixed keyboard/touch intent and overlay freeze.');
