import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  return {
    // Keep development assets isolated from `next build`, which clears `.next`.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? "next-dev" : ".next",
  };
}
