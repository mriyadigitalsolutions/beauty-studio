'use client';

import { useEffect, useState } from 'react';
import { FlashTransition } from '@/components/FlashTransition/FlashTransition';
import { OFFSTAGE_SCENE_IDS } from './scene-ids';
import { useScene } from './useScene';
import type { SceneBuild } from './types';

/*
 * A scene that exists only to be measured. It is mounted in development when
 * the page is opened with `?motion-fixture=1`, and it is compiled out of the
 * production export entirely (`MotionProvider` guards it on NODE_ENV).
 *
 * Why it is here at all: `useScene` is the seam the sections build on, and a
 * mechanism no one exercises is only a claim. Both parts below register under
 * the *same* id — as step 9 of §4 is carried by two sections — so the fixture
 * also proves that the second one does not evict the first and that the seam
 * after the step lights once, not once per part.
 *
 * The id is deliberately offstage, not `cards`: sharing a film id made the
 * fixture's result depend on how many sections happened to be registered next
 * to it, so the page growing could turn its test red without anything being
 * broken. Offstage, it carries its own seam and its own flash overlay.
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
  const ref = useScene<HTMLDivElement>(OFFSTAGE_SCENE_IDS.fixtureStep, part(index), {
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
      {/* The step's own seam cover: offstage scenes get no overlay from the
          provider, which mounts the five of the film and nothing else. */}
      <FlashTransition id={OFFSTAGE_SCENE_IDS.fixtureFlash} />
    </div>
  );
}
