/**
 * Camera pose helpers for <model-viewer>.
 *
 * Poses in lib/exhibition-models.ts are written the way model-viewer attributes are
 * ("-36deg 68deg 90%", "0m 3.4m 0m", "37deg"). To animate between them we parse the
 * numeric parts, resolve percentage radii into metres, interpolate, and format the
 * result back into attribute strings. Everything here is pure and SSR-safe.
 */

/** A pose written as model-viewer attribute strings (same shape as ModelView). */
export type CameraPose = { target: string; orbit: string; fov: string };

/** A length that may still be relative to model-viewer's framed camera distance. */
export type PoseLength = { value: number; unit: 'm' | '%' };

/** Orbit with angles in degrees; radius kept in its written unit. */
export type ParsedOrbit = { theta: number; phi: number; radius: PoseLength };

/** Fully numeric pose: angles and field of view in degrees, lengths in metres. */
export type ResolvedPose = { theta: number; phi: number; radius: number; x: number; y: number; z: number; fov: number };

const DEG_PER_RAD = 180 / Math.PI;
const tokens = (value: string) => value.trim().split(/\s+/).filter(Boolean);
const numberOf = (token: string) => {
  const parsed = Number.parseFloat(token);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** "12deg" | "0.2rad" | "12" → degrees. */
export function parseAngle(token: string): number {
  const value = numberOf(token);
  return /rad$/i.test(token.trim()) ? value * DEG_PER_RAD : value;
}

/** "3.4m" | "340cm" | "90%" | "3.4" → length in metres or percent. */
export function parseLength(token: string): PoseLength {
  const trimmed = token.trim();
  const value = numberOf(trimmed);
  if (trimmed.endsWith('%')) return { value, unit: '%' };
  if (/mm$/i.test(trimmed)) return { value: value / 1000, unit: 'm' };
  if (/cm$/i.test(trimmed)) return { value: value / 100, unit: 'm' };
  return { value, unit: 'm' };
}

export function parseOrbit(orbit: string): ParsedOrbit {
  const [theta = '0deg', phi = '75deg', radius = '100%'] = tokens(orbit);
  return { theta: parseAngle(theta), phi: parseAngle(phi), radius: parseLength(radius) };
}

export function parseTarget(target: string): [number, number, number] {
  const [x = '0m', y = '0m', z = '0m'] = tokens(target);
  return [parseLength(x).value, parseLength(y).value, parseLength(z).value];
}

export function parseFov(fov: string): number {
  return parseAngle(tokens(fov)[0] ?? '30deg');
}

/**
 * Resolve a pose into numbers. `percentBase` is the distance in metres that "100%"
 * resolves to for this model (measure it from `getCameraOrbit()` after load).
 */
export function resolvePose(pose: CameraPose, percentBase: number): ResolvedPose {
  const orbit = parseOrbit(pose.orbit);
  const [x, y, z] = parseTarget(pose.target);
  const radius = orbit.radius.unit === '%' ? (orbit.radius.value / 100) * percentBase : orbit.radius.value;
  return { theta: orbit.theta, phi: orbit.phi, radius, x, y, z, fov: parseFov(pose.fov) };
}

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
/** Smooth start and stop, no overshoot. */
export const smoothstep = (t: number) => { const v = clamp01(t); return v * v * (3 - 2 * v); };
/** Flatter at both ends than smoothstep: rests longer, then crosses more quickly. */
export const smootherstep = (t: number) => { const v = clamp01(t); return v * v * v * (v * (v * 6 - 15) + 10); };
export const easeInOutCubic = (t: number) => { const v = clamp01(t); return v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };

export function lerpPose(from: ResolvedPose, to: ResolvedPose, t: number): ResolvedPose {
  return {
    theta: lerp(from.theta, to.theta, t),
    phi: lerp(from.phi, to.phi, t),
    radius: lerp(from.radius, to.radius, t),
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    z: lerp(from.z, to.z, t),
    fov: lerp(from.fov, to.fov, t),
  };
}

export type PathPosition = {
  /** Index of the segment's starting pose. */
  index: number;
  /** Eased 0–1 position inside the segment. */
  local: number;
  /** Index of the pose the camera is closest to (for captions). */
  nearest: number;
};
export type PathSample = PathPosition & { pose: ResolvedPose };

/**
 * Where a 0–1 progress value sits on a path through `count` poses.
 * `hold` (0–0.45) keeps the camera resting on each pose for part of its segment so
 * the named views read clearly between moves.
 */
export function pathPosition(count: number, progress: number, hold = .18, ease: (t: number) => number = smoothstep): PathPosition {
  if (count <= 1) return { index: 0, local: 0, nearest: 0 };
  const segments = count - 1;
  const scaled = clamp01(progress) * segments;
  const index = Math.min(Math.floor(scaled), segments - 1);
  const keep = Math.min(.45, Math.max(0, hold));
  const local = ease((scaled - index - keep) / (1 - keep * 2));
  return { index, local, nearest: local < .5 ? index : index + 1 };
}

/** Sample a path through several poses with a single 0–1 progress value. */
export function samplePath(poses: ResolvedPose[], progress: number, hold = .18, ease: (t: number) => number = smoothstep): PathSample {
  if (poses.length === 0) throw new Error('samplePath needs at least one pose');
  const position = pathPosition(poses.length, progress, hold, ease);
  const to = poses[Math.min(position.index + 1, poses.length - 1)];
  return { ...position, pose: lerpPose(poses[position.index], to, position.local) };
}

const fixed = (value: number, digits: number) => Number(value.toFixed(digits)).toString();

/** Format back into model-viewer attribute strings (metres and degrees). */
export function formatPose(pose: ResolvedPose): CameraPose {
  return {
    orbit: `${fixed(pose.theta, 3)}deg ${fixed(pose.phi, 3)}deg ${fixed(pose.radius, 4)}m`,
    target: `${fixed(pose.x, 4)}m ${fixed(pose.y, 4)}m ${fixed(pose.z, 4)}m`,
    fov: `${fixed(pose.fov, 3)}deg`,
  };
}

/** Offset a written pose's orbit angles (degrees) while keeping its radius unit, e.g. "90%". */
export function offsetOrbit(orbit: string, thetaOffset: number, phiOffset: number): string {
  const parsed = parseOrbit(orbit);
  const radius = `${fixed(parsed.radius.value, 4)}${parsed.radius.unit}`;
  return `${fixed(parsed.theta + thetaOffset, 3)}deg ${fixed(parsed.phi + phiOffset, 3)}deg ${radius}`;
}

/** Scale a written pose's orbit radius, keeping its unit ("90%" × 1.1 → "99%"). */
export function scaleOrbitRadius(orbit: string, factor: number): string {
  const parsed = parseOrbit(orbit);
  return `${fixed(parsed.theta, 3)}deg ${fixed(parsed.phi, 3)}deg ${fixed(parsed.radius.value * factor, 4)}${parsed.radius.unit}`;
}
