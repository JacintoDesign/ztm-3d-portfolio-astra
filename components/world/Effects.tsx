"use client";
import {
  Bloom,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { EFFECTS } from "@/lib/world";
export default function Effects({ mobile }: { mobile: boolean }) {
  return (
    <EffectComposer multisampling={mobile ? 0 : EFFECTS.samples}>
      <Bloom
        intensity={mobile ? EFFECTS.mobileBloom : EFFECTS.bloom}
        luminanceThreshold={EFFECTS.threshold}
        luminanceSmoothing={EFFECTS.smoothing}
        mipmapBlur
        radius={EFFECTS.radius}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette
        offset={EFFECTS.vignetteOffset}
        darkness={EFFECTS.vignetteDarkness}
      />
    </EffectComposer>
  );
}
