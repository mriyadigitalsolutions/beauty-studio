'use client';

import { useEffect, useState } from 'react';
import { SCENE_IDS } from './scene-ids';
import { useScene } from './useScene';
import type { SceneBuild } from './types';

/*
 * A scene that exists only to be measured. It is mounted in development when
 * the page is opened with `?motion-fixture=1`, and it is compiled out of the
 * production export entirely (`MotionProvider` guards it on NODE_ENV).
 *
 * Why it is here at all: `useScene` is the seam ticket 03–05 build on, and
 * until a section calls it the pin-and-scrub path is only a claim. Both parts
 * below register under the *same* scene id — step 9 of §4 carries two sections
 * — so the fixture also proves that the second one does not evict the first.
 */

const FIXTURE_LENGTH_VH = 120;

function part(index: number): SceneBuild {
  return ({ root, timeline }) => {
    const target = root.querySelector<HTMLElement>('[data-fixture-target]');
    if (!target) return;

    root.dataset.progress = '0';
    timeline.to(target, {
      x: 240,
      ease: 'none',
      duration: 1,
      onUpdate: () => {
        root.dataset.progress = timeline.progress().toFixed(3);
      },
    });
    root.dataset.fixtureBuilt = String(index);
  };
}

function FixturePart({ index }: { index: number }) {
  const ref = useScene<HTMLDivElement>(SCENE_IDS.cards, part(index), {
    lengthVh: FIXTURE_LENGTH_VH,
  });

  return (
    <div
      ref={ref}
      data-fixture-part={index}
      style={{ height: '100vh', display: 'grid', placeItems: 'center' }}
    >
      <span
        data-fixture-target=""
        style={{ display: 'block', width: '2rem', height: '2rem', opacity: 0 }}
      />
    </div>
  );
}

export function SceneFixture() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    /* Read after mount: the server cannot know the query and the markup must
       match on hydration. */
    setActive(new URLSearchParams(window.location.search).has('motion-fixture'));
  }, []);

  if (!active) return null;

  return (
    <div data-fixture="motion" aria-hidden="true">
      <div style={{ height: '120vh' }} />
      <FixturePart index={0} />
      <FixturePart index={1} />
      <div style={{ height: '150vh' }} />
    </div>
  );
}
