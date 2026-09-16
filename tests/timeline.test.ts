import { describe, expect, it } from 'vitest';
import {
  FILM_STOPS,
  MOBILE_SCENE_SCALE,
  scenarioLengthVh,
  stopAnchors,
} from '@/lib/motion/timeline';
import { SCENE_IDS, SCENE_SEQUENCE, isFlashScene, type SceneId } from '@/lib/motion/scene-ids';

/*
 * The assembled film, checked where it is decided rather than where it is
 * drawn: the stops a visitor can be taken to are the steps of §4 in the order
 * §4 lists them, and the §10 scenario is a number, not a guess in a component.
 */

describe('the stops of the assembled film', () => {
  it('follows the order of the thirteen steps', () => {
    const position = (id: SceneId) => SCENE_SEQUENCE.indexOf(id);
    const positions = FILM_STOPS.map((stop) => position(stop.id));

    expect(positions).not.toContain(-1);
    expect([...positions]).toEqual([...positions].sort((a, b) => a - b));
  });

  it('never stops on a seam — a flash is a cut, not a place', () => {
    for (const stop of FILM_STOPS) expect(isFlashScene(stop.id)).toBe(false);
  });

  it('leaves no act of the film unreachable', () => {
    /* A flash is a cut: between two cuts lies one act. Every act must have a
       stop, or part of the film can only be reached by scrolling past it. */
    const acts: SceneId[][] = [];
    let act: SceneId[] = [];
    for (const id of SCENE_SEQUENCE) {
      if (isFlashScene(id)) {
        acts.push(act);
        act = [];
      } else {
        act.push(id);
      }
    }
    acts.push(act);
    expect(acts).toHaveLength(6); // §4: thirteen steps, five cuts

    const reachable = new Set(FILM_STOPS.map((stop) => stop.id));
    for (const act of acts) {
      expect(act.some((id) => reachable.has(id))).toBe(true);
    }
  });

  it('carries one anchor per stop and no duplicates', () => {
    const anchors = stopAnchors();
    expect(anchors).toHaveLength(FILM_STOPS.length);
    expect(new Set(anchors).size).toBe(anchors.length);
    for (const anchor of anchors) expect(anchor).toMatch(/^[a-z-]+$/);
  });
});

describe('the mobile scenario (§10)', () => {
  it('leaves the desktop scenario untouched', () => {
    expect(scenarioLengthVh(SCENE_IDS.handReveal, 140, true)).toBe(140);
    expect(scenarioLengthVh(SCENE_IDS.skinLayers, 100, true)).toBe(100);
  });

  it('halves the scroll height of Laser Reveal below the breakpoint', () => {
    expect(scenarioLengthVh(SCENE_IDS.handReveal, 140, false)).toBe(70);
    expect(scenarioLengthVh(SCENE_IDS.hairDissolve, 80, false)).toBe(40);
    expect(MOBILE_SCENE_SCALE).toBe(0.5);
  });

  it('keeps every other scene as long as it was', () => {
    expect(scenarioLengthVh(SCENE_IDS.cards, 100, false)).toBe(100);
    expect(scenarioLengthVh(SCENE_IDS.cta, 100, false)).toBe(100);
  });
});
