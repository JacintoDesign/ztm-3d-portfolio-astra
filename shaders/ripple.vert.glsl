attribute vec3 center;
attribute float phase;
attribute float jitter;
attribute float identity;
uniform float time;
uniform float period;
uniform float diameter;
uniform float variation;
varying vec2 vUv;
varying float age;
varying float depth;
varying vec2 offset;
varying float reach;
// A bounded, sin-free hash keeps generation seeds stable at mobile precision.
float hash(float p) {
 p=fract(p*.1031);
 p*=p+33.33;
 p*=p+p;
 return fract(p);
}
void main(){
 vUv=uv;
 float elapsed=time+phase;
 float generation=mod(floor(elapsed/(period*2.)),1024.);
 age=mod(elapsed,period*2.);
 float seed=generation+identity;
 float angle=hash(seed)*6.2831853;
 float displacement=jitter*hash(seed+1.);
 offset=vec2(cos(angle),sin(angle))*displacement;
 reach=(.5-displacement)*mix(1.-variation,1.+variation,hash(seed+2.));
 vec3 p=center+vec3(position.x*diameter,0.,position.y*diameter);
 vec4 mv=viewMatrix*vec4(p,1.);
 depth=-mv.z;
 gl_Position=projectionMatrix*mv;
}
