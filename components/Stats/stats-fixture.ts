'use client';

import { useEffect, useState } from 'react';
import type { StatItem } from '@/config/studio.config';
import { locales } from '@/content';

/**
 * A way to see the counters actually count without inventing a single number
 * in the code: `?stats-fixture=1200,8,340` in development renders one counter
 * per number of the query. The studio config keeps its placeholders — the
 * owner's facts are the owner's (§8) — and `e2e/sections.spec.ts` uses this
 * to check that the run-up happens once (story 44).
 */

export const STATS_FIXTURE_PARAM = 'stats-fixture';

export function parseStatsFixture(search: string, label: string): StatItem[] {
  const raw = new URLSearchParams(search).get(STATS_FIXTURE_PARAM);
  if (!raw) return [];
  return raw
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value))
    .map((value, index) => ({
      id: `fixture-${index}`,
      value,
      label: Object.fromEntries(locales.map((locale) => [locale, label])) as StatItem['label'],
    }));
}

/** Null unless the page was opened with the fixture, and never in production. */
export function useStatsFixture(label: string): StatItem[] | null {
  const [stats, setStats] = useState<StatItem[] | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    /* Read after mount: the server cannot know the query, and the markup has
       to match on hydration. */
    const parsed = parseStatsFixture(window.location.search, label);
    setStats(parsed.length ? parsed : null);
  }, [label]);

  return stats;
}
