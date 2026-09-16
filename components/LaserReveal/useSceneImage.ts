'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { SceneImage } from './scene-assets';

export type PhotoState = 'idle' | 'loading' | 'ready' | 'failed';

/** How early the photographs start loading, as a share of the viewport. */
const APPROACH_MARGIN = '75% 0px';
/** Settle time after `load`: the scroll runtime pins the scenes on that event,
 *  and until it has, the section still sits a screen away from where it will
 *  end up. Watching before then would fetch the photos on the first screen. */
const SETTLE_MS = 250;

export interface ScenePhotos {
  state: PhotoState;
  /** The variant the browser picked for each image, once it has picked one. */
  hrefs: Readonly<Record<string, string>>;
  reportLoaded(image: SceneImage, href: string): void;
  reportFailed(): void;
}

/**
 * Loads the scene photographs as the visitor comes near the section, never on
 * the first screen (story 30), and reports whether they arrived at all.
 *
 * Negotiation is left to the browser: a real `<picture>` is rendered, and the
 * variant it chose is read back from `currentSrc` and handed to the SVG, which
 * cannot do `srcset` itself. The second request is served from cache.
 */
export function useScenePhotos(
  count: number,
  anchor: RefObject<HTMLElement | null>,
): ScenePhotos {
  const [state, setState] = useState<PhotoState>('idle');
  const [hrefs, setHrefs] = useState<Record<string, string>>({});
  const loaded = useRef(new Set<string>());

  useEffect(() => {
    const element = anchor.current;
    if (!element) return;
    const begin = () => setState((current) => (current === 'idle' ? 'loading' : current));
    if (typeof IntersectionObserver === 'undefined') {
      begin(); // no observer: load straight away rather than never
      return;
    }

    let observer: IntersectionObserver | null = null;
    let timer: number | undefined;

    const watch = () => {
      timer = window.setTimeout(() => {
        observer = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            begin();
            observer?.disconnect();
          },
          { rootMargin: APPROACH_MARGIN },
        );
        observer.observe(element);
      }, SETTLE_MS);
    };

    if (document.readyState === 'complete') watch();
    else window.addEventListener('load', watch, { once: true });

    return () => {
      window.removeEventListener('load', watch);
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [anchor]);

  const reportLoaded = useCallback(
    (image: SceneImage, href: string) => {
      loaded.current.add(image.id);
      setHrefs((current) =>
        current[image.id] === href ? current : { ...current, [image.id]: href },
      );
      if (loaded.current.size >= count) setState((current) => (current === 'failed' ? current : 'ready'));
    },
    [count],
  );

  const reportFailed = useCallback(() => setState('failed'), []);

  return { state, hrefs, reportLoaded, reportFailed };
}
