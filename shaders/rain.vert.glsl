attribute vec3 seed;
uniform float time;
uniform vec3 volume;
uniform vec2 streak;
uniform vec3 eye;
uniform float follow;
uniform float yaw;
uniform float fallSpeed;
uniform float wind;
varying vec2 vUv;
varying float vDepth;
void main(){
 vUv=uv;
 vec3 p=seed*volume;
 p.x=mod(p.x+time*wind-eye.x*follow,volume.x)-volume.x*.5+eye.x*follow;
 p.y=mod(p.y-time*fallSpeed,volume.y);
 p.z=mod(p.z-eye.z*follow,volume.z)-volume.z*.5+eye.z*follow;
 vec2 vertex=position.xy*streak;
 vertex.x-=vertex.y*wind/fallSpeed;
 p+=vec3(cos(yaw)*vertex.x,vertex.y,-sin(yaw)*vertex.x);
 vec4 mv=viewMatrix*vec4(p,1.);
 vDepth=-mv.z;
 gl_Position=projectionMatrix*mv;
}
