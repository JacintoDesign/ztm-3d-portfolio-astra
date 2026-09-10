uniform vec3 tint;
uniform vec3 fogTint;
uniform float fogDensity;
uniform float opacity;
varying vec2 vUv;
varying float vDepth;
void main(){
 float a=sin(vUv.x*3.14159265)*sin(vUv.y*3.14159265)*opacity;
 if(a<.01)discard;
 float fog=1.-exp(-fogDensity*fogDensity*vDepth*vDepth);
 gl_FragColor=vec4(mix(tint,fogTint,fog),a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}
