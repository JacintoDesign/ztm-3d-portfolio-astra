uniform vec3 tint;
uniform vec3 fogTint;
uniform float fogDensity;
uniform float life;
uniform float opacity;
uniform float thickness;
uniform float birth;
uniform float wobble;
varying vec2 vUv;
varying float age;
varying float depth;
varying vec2 offset;
varying float reach;
void main(){
 if(age>life)discard;
 float t=age/life;
 vec2 point=vUv-.5-offset;
 float angle=atan(point.y,point.x);
 float d=length(point)*(1.+wobble*cos(2.*angle+age)+wobble*.5*cos(3.*angle+age));
 float radius=t*reach;
 float ring=1.-smoothstep(radius*thickness*.5,radius*thickness*.5+fwidth(d),abs(d-radius));
 float alpha=ring*smoothstep(0.,birth,t)*pow(1.-t,2.)*opacity;
 float fog=1.-exp(-fogDensity*fogDensity*depth*depth);
 gl_FragColor=vec4(mix(tint,fogTint,fog),alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}
