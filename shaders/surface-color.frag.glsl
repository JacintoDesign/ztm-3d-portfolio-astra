#include <map_fragment>
// Broad damp variation is evaluated in world space, with no repeating image tile.
float surfaceBroad = (surfaceNoise(vSurfaceUv/surfaceBroadScale.x)*2.0-1.0)*surfaceBroadAmplitude.x
  + (surfaceNoise(vSurfaceUv/surfaceBroadScale.y)*2.0-1.0)*surfaceBroadAmplitude.y;
diffuseColor.rgb *= 1.0+surfaceBroad;
