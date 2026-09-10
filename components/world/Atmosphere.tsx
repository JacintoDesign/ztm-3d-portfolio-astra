"use client";
import { Environment } from "@react-three/drei";
import { ATMOSPHERE, BOARD, BEND, C, CONVENIENCE, LIGHT, LAYOUT, NEON, SIGN } from "@/lib/world";
export default function Atmosphere({ mobile }: { mobile: boolean }) {
  return (
    <>
      <color attach="background" args={[C.void]} />
      <fogExp2 attach="fog" args={[C.fogColor, ATMOSPHERE.fog]} />
      <hemisphereLight args={[C.sky, C.ground, ATMOSPHERE.hemisphere * LIGHT.streetTrim]} />
      <Environment resolution={ATMOSPHERE.environmentResolution} frames={1}>
        <color attach="background" args={[C.environment]} />
      </Environment>
      {NEON.filter((n,i) => n.power > 0 && i !== CONVENIENCE.signIndex)
        .map((sign) => (
          <pointLight
            key={sign.z}
            position={[
              sign.side * (LAYOUT.width / 2 - SIGN.projectionMax - LIGHT.signClearance),
              sign.y,
              sign.z,
            ]}
            color={sign.color}
            intensity={sign.power * LIGHT.streetTrim * LIGHT.neonTrim}
            distance={sign.reach}
            decay={LIGHT.decay}
          />
        ))}
      <pointLight
        position={[CONVENIENCE.front + LIGHT.signClearance, CONVENIENCE.head, (CONVENIENCE.start+CONVENIENCE.end)/2]}
        color={C.signWhite}
        intensity={CONVENIENCE.power * LIGHT.streetTrim}
        distance={CONVENIENCE.reach}
        decay={LIGHT.decay}
      />
      <pointLight
        position={LIGHT.gate.position}
        color={C.signWhite}
        intensity={LIGHT.gate.power * LIGHT.streetTrim * LIGHT.neonTrim}
        distance={LIGHT.gate.distance}
        decay={LIGHT.decay}
      />
      <pointLight
        position={[
          BOARD.position[0] - LIGHT.title.clearance * Math.sin(BEND.angle),
          BOARD.titleBase + BOARD.titleHeight / 2,
          BOARD.position[2] - LIGHT.title.clearance * Math.cos(BEND.angle),
        ]}
        color={C.neonMagenta}
        intensity={LIGHT.title.power}
        distance={LIGHT.title.distance}
        decay={LIGHT.title.decay}
      />
      <pointLight
        position={LIGHT.mail.position}
        color={C.signWhite}
        intensity={LIGHT.mail.power}
        distance={LIGHT.mail.distance}
        decay={LIGHT.decay}
      />
      {mobile && <pointLight position={LIGHT.cart.position} color={C.vendGlow} intensity={LIGHT.cart.mobilePower} />}
      {!mobile && (
        <>
          <rectAreaLight
            position={LIGHT.cart.position}
            rotation={[-Math.PI / 2, 0, 0]}
            width={LIGHT.cart.width}
            height={LIGHT.cart.height}
            color={C.vendGlow}
            intensity={LIGHT.cart.power}
          />
          <rectAreaLight
            position={
              [
                ...BOARD.position.slice(0, 1),
                BOARD.base + BOARD.height / 2,
                BOARD.position[2],
              ] as [number, number, number]
            }
            rotation={[0, Math.PI + BEND.angle, 0]}
            width={BOARD.width}
            height={BOARD.height}
            color={C.signWhite}
            intensity={LIGHT.screen.power}
          />
        </>
      )}
    </>
  );
}
