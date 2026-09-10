#include <uv_vertex>
// Consistent world-scale grain, with a reproducible phase for every placed part.
mat4 surfaceTransform = modelMatrix;
#ifdef USE_INSTANCING
  surfaceTransform = modelMatrix * instanceMatrix;
#endif
vec3 surfacePosition = (surfaceTransform * vec4(position, 1.0)).xyz;
vec3 surfaceDirection = abs(normalize(mat3(surfaceTransform) * normal));
vec2 surfaceUv = surfaceDirection.y > max(surfaceDirection.x, surfaceDirection.z)
  ? surfacePosition.xz : surfaceDirection.x > surfaceDirection.z
  ? surfacePosition.zy : surfacePosition.xy;
vec3 surfaceOrigin = surfaceTransform[3].xyz;
vec2 surfacePhase = fract(sin(vec2(dot(surfaceOrigin, vec3(127.1,311.7,74.7)), dot(surfaceOrigin,vec3(269.5,183.3,246.1)))) * 43758.5453);
surfaceUv += surfacePhase;
vSurfaceUv = surfaceUv;
#ifdef USE_MAP
  vMapUv = (mapTransform * vec3(surfaceUv,1.0)).xy;
#endif
#ifdef USE_ROUGHNESSMAP
  vRoughnessMapUv = (roughnessMapTransform * vec3(surfaceUv,1.0)).xy;
#endif
#ifdef USE_NORMALMAP
  vNormalMapUv = (normalMapTransform * vec3(surfaceUv,1.0)).xy;
#endif
