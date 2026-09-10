uniform vec3 tint;
uniform vec3 fogTint;
uniform float fogDensity;
uniform float opacity;
varying vec2 vUv;
varying float life;
varying float depth;
void main(){float d=length((vUv-.5)*2.);float alpha=pow(max(0.,1.-d),2.)*sin(life*3.14159265)*opacity;float fog=1.-exp(-fogDensity*fogDensity*depth*depth);gl_FragColor=vec4(mix(tint,fogTint,fog),alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}
