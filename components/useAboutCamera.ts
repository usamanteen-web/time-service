'use client';

import { useCallback, useState } from 'react';
import type { MotionValue } from 'framer-motion';
import { clamp01 } from '@/lib/camera-pose';
import { aboutCameraViews, easeAboutProgress, sampleAboutCamera } from '@/lib/about-camera-path';
import type { ModelStageController } from './ModelStage';
import { useMotionPreference } from './useMotionPreference';

const SETTLED = .00002;

/** Keep the MARUN camera and its caption on the same eased scroll position. */
export function useAboutCamera(pageProgress: MotionValue<number>, _stageExit: MotionValue<number>) {
  const [scrolledView, setView] = useState(0);
  const reduced = useMotionPreference();

  const controller = useCallback<ModelStageController>(api => {
    const poses = aboutCameraViews.map(pose => api.resolve(pose));
    // The stage remains visible alongside the complete story on every layout.
    const desired = () => clamp01(pageProgress.get());
    let current = desired();
    let frame = 0;
    let previousTime = 0;
    let disposed = false;
    const rect = api.root.getBoundingClientRect();
    let visible = rect.bottom > 0 && rect.top < window.innerHeight;
    let caption = -1;

    const apply = (jump = false) => {
      const sample = sampleAboutCamera(poses, current);
      api.apply(sample.pose, { jump });
      if (caption !== sample.nearest) {
        caption = sample.nearest;
        setView(caption);
      }
    };

    const canRun = () => !disposed && visible && !document.hidden;
    const tick = (time: number) => {
      frame = 0;
      if (!canRun()) { previousTime = 0; return; }
      const target = desired();
      const elapsed = previousTime ? time - previousTime : 1000 / 60;
      previousTime = time;
      current = easeAboutProgress(current, target, elapsed);
      if (Math.abs(target - current) < SETTLED) current = target;
      apply();
      if (current !== target) frame = requestAnimationFrame(tick);
      else previousTime = 0;
    };
    const wake = () => {
      if (canRun() && !frame) frame = requestAnimationFrame(tick);
    };
    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    };
    const onVisibility = () => { if (document.hidden) pause(); else wake(); };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) wake(); else pause();
    });

    // Initial alignment happens once when the model becomes ready. Every later
    // move, including resize and fast reverse scrolling, follows the eased path.
    api.root.style.removeProperty('--ac-cut');
    apply(true);
    observer.observe(api.root);
    const stopPage = pageProgress.on('change', wake);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      pause();
      observer.disconnect();
      stopPage();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pageProgress]);

  // ModelStage itself stops this controller when reduced motion is requested.
  return { controller, view: reduced ? 0 : scrolledView, views: aboutCameraViews, initialPose: aboutCameraViews[0] };
}
