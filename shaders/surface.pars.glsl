varying vec2 vSurfaceUv;
uniform vec2 surfaceBroadScale;
uniform vec2 surfaceBroadAmplitude;
uniform float surfaceGrainSeed;
float surfaceHash(vec2 p) {
  return fract(sin(dot(p,vec2(127.1,311.7))+surfaceGrainSeed)*43758.5453);
}
float surfaceNoise(vec2 p) {
  vec2 cell=floor(p),f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(surfaceHash(cell),surfaceHash(cell+vec2(1.0,0.0)),f.x),mix(surfaceHash(cell+vec2(0.0,1.0)),surfaceHash(cell+vec2(1.0,1.0)),f.x),f.y);
}
