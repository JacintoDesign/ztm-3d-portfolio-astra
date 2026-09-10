attribute vec3 seed;
uniform float time;
uniform float rise;
uniform float reduced;
uniform float yaw;
varying vec2 vUv;
varying float life;
varying float depth;
void main(){vUv=uv;life=fract(seed.y+time*rise*(1.-reduced));vec3 p=vec3(3.02,life*2.,seed.z);p.x+=sin(life*6.+seed.x)*life*.35;p+=vec3(cos(yaw)*position.x,position.y,-sin(yaw)*position.x)*(.36+life);vec4 mv=viewMatrix*vec4(p,1.);depth=-mv.z;gl_Position=projectionMatrix*mv;}
