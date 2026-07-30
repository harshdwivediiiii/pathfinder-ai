"use client";

const NOISE_TEXTURE_URL = "https://grainy-gradients.vercel.app/noise.svg";

export default function NoiseTexture({ className = "", opacity = "opacity-[0.02]" }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${opacity} mix-blend-soft-light ${className}`}
      style={{
        backgroundImage: `url('${NOISE_TEXTURE_URL}')`,
      }}
    />
  );
}
