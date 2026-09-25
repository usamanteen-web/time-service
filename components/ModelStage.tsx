'use client';

import { createElement, useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useInView } from 'framer-motion';
import type { ModelViewerElement } from '@google/model-viewer';
import type { exhibitionModels } from '@/lib/exhibition-models';
import { formatPose, parseOrbit, resolvePose, type CameraPose, type ResolvedPose } from '@/lib/camera-pose';
import { useMotionPreference } from './useMotionPreference';

export type StageModel = (typeof exhibitionModels)[number];
export type ModelStageStatus = 'poster' | 'loading' | 'ready' | 'error';

/** Handed to a controller once the model has loaded and its framing has been measured. */
export type ModelStageApi = {
  element: ModelViewerElement;
  /** The stage wrapper — observe it to pause work while it is off screen. */
  root: HTMLDivElement;
  /** Metres that a "100%" orbit radius resolves to for this model. */
  percentBase: number;
  initialPose: CameraPose;
  /** Parse attribute strings into numbers (percent radii become metres). */
  resolve: (pose: CameraPose) => ResolvedPose;
  /** Move the camera goal; model-viewer eases towards it (interpolation-decay). */
  apply: (pose: CameraPose | ResolvedPose, options?: { jump?: boolean }) => void;
  /** Current camera orbit in radians / metres (model-viewer's own getter). */
  orbit: () => { theta: number; phi: number; radius: number };
};

/** Return a cleanup function. Memoise it (useCallback) so it is not restarted every render. */
export type ModelStageController = (api: ModelStageApi) => void | (() => void);

type Props = {
  model: StageModel;
  /** Visually hidden sentence describing the decorative model. */
  description: string;
  controller?: ModelStageController;
  /** Defaults to the model's first named view. */
  initialPose?: CameraPose;
  className?: string;
  posterSizes?: string;
  posterPriority?: boolean;
  /** Camera easing time in ms — larger feels heavier. */
  interpolationDecay?: number;
  onStatusChange?: (status: ModelStageStatus) => void;
  /** Overlays such as captions, drawn above the canvas. */
  children?: ReactNode;
};

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
/** model-viewer only renders (and so only reports its camera) while on screen. */
function whenVisible(element: Element) {
  let observer: IntersectionObserver | undefined;
  const promise = new Promise<void>(resolve => {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer?.disconnect(); resolve(); }
    });
    observer.observe(element);
  });
  return { promise, cancel: () => observer?.disconnect() };
}
const isResolved = (pose: CameraPose | ResolvedPose): pose is ResolvedPose => typeof (pose as ResolvedPose).theta === 'number';

/** Wait until model-viewer reports a settled camera distance after its load-time jump. */
async function measureRadius(el: ModelViewerElement) {
  await el.updateComplete;
  let last = 0;
  for (let frame = 0; frame < 45; frame++) {
    await nextFrame();
    const radius = el.getCameraOrbit().radius;
    if (Number.isFinite(radius) && radius > 0 && Math.abs(radius - last) < 1e-4) return radius;
    last = radius;
  }
  return last;
}

/**
 * A decorative, lazily loaded <model-viewer>. The poster shows immediately; the
 * viewer module is imported on the client once the stage is near the viewport,
 * and any failure simply leaves the poster in place. No camera-controls — the page
 * keeps its scroll and touch gestures — and the camera is driven by `controller`.
 */
export default function ModelStage({model, description, controller, initialPose, className = '', posterSizes = '(max-width: 1023px) 100vw, 44vw', posterPriority = false, interpolationDecay = 180, onStatusChange, children}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const viewer = useRef<ModelViewerElement>(null);
  const pose = initialPose ?? model.views[0];
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const reduced = useMotionPreference();
  const near = useInView(root, { margin: '320px 0px', once: true });
  const [moduleReady, setModuleReady] = useState(false);
  const [status, setStatus] = useState<ModelStageStatus>('poster');
  const [api, setApi] = useState<ModelStageApi | null>(null);
  const statusCallback = useRef(onStatusChange);
  statusCallback.current = onStatusChange;

  useEffect(() => { statusCallback.current?.(status); }, [status]);

  // Import the web component only on the client, and only when it will be seen.
  useEffect(() => {
    if (!near) return;
    let alive = true;
    const load = () => {
      import('@google/model-viewer')
        .then(() => { if (alive) { setModuleReady(true); setStatus(current => current === 'poster' ? 'loading' : current); } })
        .catch(() => { if (alive) setStatus('error'); });
    };
    const idle = 'requestIdleCallback' in window;
    const handle = idle ? window.requestIdleCallback(load, { timeout: 900 }) : window.setTimeout(load, 120);
    return () => {
      alive = false;
      if (idle) window.cancelIdleCallback(handle); else window.clearTimeout(handle);
    };
  }, [near]);

  // Load, measure the framing once, then expose the camera API.
  useEffect(() => {
    const el = viewer.current;
    const stage = root.current;
    if (!moduleReady || !el || !stage) return;
    let alive = true;
    let visible: ReturnType<typeof whenVisible> | undefined;
    const onProgress = (event: Event) => {
      const fraction = (event as CustomEvent<{ totalProgress: number }>).detail?.totalProgress ?? 0;
      stage.style.setProperty('--ac-stage-load', String(fraction));
    };
    const onError = () => { if (alive) { setApi(null); setStatus('error'); } };
    const onLoad = async () => {
      visible?.cancel();
      visible = whenVisible(stage);
      await visible.promise;
      if (!alive) return;
      const measured = await measureRadius(el);
      if (!alive || !(measured > 0)) return;
      const written = parseOrbit(poseRef.current.orbit).radius;
      const percentBase = written.unit === '%' && written.value > 0 ? measured / (written.value / 100) : measured;
      const resolve = (next: CameraPose) => resolvePose(next, percentBase);
      const apply: ModelStageApi['apply'] = (next, options) => {
        const formatted = formatPose(isResolved(next) ? next : resolve(next));
        if (el.cameraTarget !== formatted.target) el.cameraTarget = formatted.target;
        if (el.fieldOfView !== formatted.fov) el.fieldOfView = formatted.fov;
        if (el.cameraOrbit !== formatted.orbit) el.cameraOrbit = formatted.orbit;
        if (options?.jump) void el.updateComplete.then(() => el.jumpCameraToGoal());
      };
      const orbit = () => { const { theta, phi, radius } = el.getCameraOrbit(); return { theta, phi, radius }; };
      setApi({ element: el, root: stage, percentBase, initialPose: poseRef.current, resolve, apply, orbit });
      setStatus('ready');
    };
    el.addEventListener('progress', onProgress);
    el.addEventListener('load', onLoad);
    el.addEventListener('error', onError);
    if (el.loaded) void onLoad();
    return () => {
      alive = false;
      visible?.cancel();
      el.removeEventListener('progress', onProgress);
      el.removeEventListener('load', onLoad);
      el.removeEventListener('error', onError);
    };
  }, [moduleReady]);

  // Hand the camera to the controller; reduced motion keeps the first view still.
  useEffect(() => {
    if (!api) return;
    if (reduced || !controller) {
      api.apply(api.initialPose, { jump: true });
      return;
    }
    const cleanup = controller(api);
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, [api, controller, reduced]);

  return <div ref={root} className={`ac-stage ${className}`} data-status={status} data-model={model.id}>
    <Image className="ac-stage-poster" src={model.poster} alt="" fill sizes={posterSizes} priority={posterPriority}/>
    {moduleReady && status !== 'error' && createElement('model-viewer', {
      ref: viewer,
      className: 'ac-stage-viewer',
      src: `/models/${model.id}.glb`,
      alt: description,
      'aria-hidden': 'true',
      // model-viewer's shadow input layer is always tabbable (tabindex=0), even without
      // camera-controls. Inert keeps the decorative canvas out of the tab order.
      inert: true,
      'camera-orbit': pose.orbit,
      'camera-target': pose.target,
      'field-of-view': pose.fov,
      'min-camera-orbit': 'auto 10deg 1.2m',
      'max-camera-orbit': 'auto 100deg 200%',
      'min-field-of-view': '25deg',
      'max-field-of-view': '55deg',
      'interaction-prompt': 'none',
      'interpolation-decay': String(interpolationDecay),
      'shadow-intensity': '1',
      'shadow-softness': '0.8',
      exposure: '0.95',
      'tone-mapping': 'aces',
      'environment-image': 'neutral',
      loading: 'eager',
      reveal: 'auto',
    })}
    <span className="ac-stage-load" aria-hidden="true"/>
    <p className="sr-only">{description}</p>
    {children}
  </div>;
}
