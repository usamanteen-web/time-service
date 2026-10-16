import { clamp01, type CameraPose, type PathSample, type ResolvedPose } from './camera-pose';

/**
 * An authored tour of MARUN, rather than a set of variations on its hero view.
 * The office table is at (4.25, .85, -1.25), the upper floor at y≈3 and the front
 * lightboxes at z≈2.72 in the exported GLB. Close views use metres so they stay
 * focused on the same architectural detail at every viewport size.
 */
export const aboutCameraViews: (CameraPose & { id: string; label: string })[] = [
  { id: 'overview', label: 'Overview', target: '0m 2.4m 0m', orbit: '-34deg 67deg 100%', fov: '35deg' },
  { id: 'brand', label: 'MARUN identity', target: '-0.1m 3.65m 2.72m', orbit: '0deg 83deg 10m', fov: '39deg' },
  { id: 'reception', label: 'The welcome', target: '-8.6m 0.85m 1.8m', orbit: '-20deg 78deg 7m', fov: '43deg' },
  // Align with the authored V3 Meeting Frost camera, between the entrance piers.
  // The previous rightward angle sighted directly through the planted column.
  { id: 'meeting', label: 'Meeting suite', target: '4.48m 1.25m -1.317m', orbit: '0.24deg 85.14deg 4.727m', fov: '44deg' },
  { id: 'architecture', label: 'Two levels, one space', target: '0m 2.4m 0m', orbit: '20deg 53deg 70%', fov: '37deg' },
  { id: 'staircase', label: 'The connection', target: '-2.2m 2.65m -0.8m', orbit: '-16deg 34deg 10m', fov: '43deg' },
  { id: 'upper-lounge', label: 'Upper-level lounge', target: '3.3m 3.3m -0.75m', orbit: '42deg 45deg 8m', fov: '43deg' },
  { id: 'layout', label: 'The complete composition', target: '0m 2.2m 0m', orbit: '90deg 28deg 80%', fov: '36deg' },
  { id: 'reverse', label: 'Another perspective', target: '0m 2.3m -0.5m', orbit: '150deg 63deg 95%', fov: '35deg' },
  { id: 'side-identity', label: 'Identity in the round', target: '-6.7m 3.55m -1m', orbit: '225deg 77deg 13m', fov: '39deg' },
  { id: 'finale', label: 'The full experience', target: '0m 2.4m 0m', orbit: '320deg 68deg 105%', fov: '35deg' },
];

/** Frame-rate independent, non-overshooting progress easing, including after a tab pause. */
export function easeAboutProgress(current: number, target: number, elapsedMs: number): number {
  const amount = 1 - Math.exp(-Math.min(64, Math.max(0, elapsedMs)) / 190);
  return clamp01(current + (clamp01(target) - current) * amount);
}

const channels: (keyof ResolvedPose)[] = ['theta', 'phi', 'radius', 'x', 'y', 'z', 'fov'];

/** Shape-preserving cubic tangent: continuous velocity without overshooting a focus point. */
function tangent(values: number[], index: number) {
  if (index === 0) return values[1] - values[0];
  if (index === values.length - 1) return values[index] - values[index - 1];
  const before = values[index] - values[index - 1];
  const after = values[index + 1] - values[index];
  return before * after <= 0 ? 0 : 2 * before * after / (before + after);
}

export function sampleAboutCamera(poses: ResolvedPose[], progress: number): PathSample {
  if (!poses.length) throw new Error('The About camera needs at least one view');
  if (poses.length === 1) return { pose: poses[0], index: 0, local: 0, nearest: 0 };
  const scaled = clamp01(progress) * (poses.length - 1);
  const index = Math.min(Math.floor(scaled), poses.length - 2);
  const local = scaled - index;
  const t2 = local * local;
  const t3 = t2 * local;
  const pose = { ...poses[index] };
  for (const key of channels) {
    const values = poses.map(point => point[key]);
    const from = values[index];
    const to = values[index + 1];
    pose[key] = (2 * t3 - 3 * t2 + 1) * from
      + (t3 - 2 * t2 + local) * tangent(values, index)
      + (-2 * t3 + 3 * t2) * to
      + (t3 - t2) * tangent(values, index + 1);
  }
  // The camera pulls back/up before passing around the building. No hidden cuts,
  // per-segment holds or angle wrapping interrupt the visitor's continuous tour.
  return { pose, index, local, nearest: Math.min(Math.round(scaled), poses.length - 1) };
}
