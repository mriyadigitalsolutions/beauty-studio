'use client';

import type { Dictionary } from '@/content';
import { SCENE_IDS, useScene } from '@/lib/motion';
import {
  BEAM,
  FOLLICLE_BULB,
  FOLLICLE_SHAFT,
  LABEL_X,
  SKIN_LAYERS,
  VIEW_BOX,
  type SkinLayerId,
} from './skin-geometry';
import styles from './SkinLayers.module.css';

export interface SkinLayersProps {
  dictionary: Dictionary;
}

const BEAM_LENGTH = BEAM.endY - BEAM.startY;

/** The colour of a layer is its §14 token — the drawing reads it, nothing else. */
const paint = (token: string) => `var(${token})`;

const FOLLICLE_TOKEN =
  SKIN_LAYERS.find((layer) => layer.id === 'follicle')?.token ?? BEAM.token;

/**
 * Step 7 of §4: the cross-section comes apart while the pulse travels down to
 * the root. Drawn as vectors in the palette of §14 — no photography, nothing
 * that could be mistaken for a claim about a particular device.
 */
export function SkinLayers({ dictionary }: SkinLayersProps) {
  const text = dictionary.sections.skinLayers;

  const ref = useScene<HTMLElement>(SCENE_IDS.skinLayers, ({ root, timeline }) => {
    const layer = (id: SkinLayerId) => root.querySelector<SVGGElement>(`[data-layer="${id}"]`);
    const labels = root.querySelectorAll<SVGGElement>('[data-layer-label]');
    const beam = root.querySelector<SVGLineElement>('[data-beam]');
    const spark = root.querySelector<SVGCircleElement>('[data-beam-spark]');

    for (const definition of SKIN_LAYERS) {
      const element = layer(definition.id);
      if (!element) continue;
      timeline.fromTo(
        element,
        { y: 0 },
        { y: definition.spread, ease: 'none', duration: 0.6 },
        0,
      );
    }

    if (labels.length) {
      timeline.fromTo(
        labels,
        { opacity: 0, x: -14 },
        { opacity: 1, x: 0, ease: 'none', duration: 0.3, stagger: 0.08 },
        0.1,
      );
    }

    if (beam) {
      timeline.fromTo(
        beam,
        { strokeDashoffset: BEAM_LENGTH },
        { strokeDashoffset: 0, ease: 'none', duration: 0.5 },
        0.35,
      );
    }

    if (spark) {
      timeline.fromTo(spark, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, ease: 'none', duration: 0.2 }, 0.8);
    }
  });

  return (
    <section
      id="skin-layers"
      ref={ref}
      className={styles.section}
      aria-labelledby="skin-layers-title"
    >
      <div className={`glassCard ${styles.card}`}>
        <div className={`contentWidth ${styles.grid}`}>
          <div className={styles.copy}>
            <p className="eyebrow">{text.eyebrow}</p>
            <h2 id="skin-layers-title">{text.title}</h2>
            <p className="lead">{text.lead}</p>
            <dl className={styles.notes}>
              {SKIN_LAYERS.map((definition) => (
                <div key={definition.id} className={styles.note}>
                  <dt>{text.layers[definition.id]}</dt>
                  <dd>{text.layerNotes[definition.id]}</dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className={styles.figure}>
            <svg
              className={styles.drawing}
              viewBox={`0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
              role="img"
              aria-label={text.title}
            >
              {SKIN_LAYERS.filter((definition) => definition.id !== 'follicle').map((definition) => (
                <g key={definition.id} data-layer={definition.id}>
                  <rect
                    className={styles.band}
                    data-token={definition.token}
                    data-paint="fill"
                    style={{ fill: paint(definition.token) }}
                    x={96}
                    y={definition.y}
                    width={VIEW_BOX.width - 116}
                    height={definition.height}
                    rx={14}
                  />
                  <g data-layer-label="" className={styles.label}>
                    <line
                      className={styles.leader}
                      x1={LABEL_X}
                      y1={definition.y + definition.height / 2}
                      x2={92}
                      y2={definition.y + definition.height / 2}
                    />
                    <text x={LABEL_X} y={definition.y + definition.height / 2 - 8}>
                      {text.layers[definition.id]}
                    </text>
                  </g>
                </g>
              ))}

              <g data-layer="follicle" className={styles.follicle}>
                <path
                  className={styles.shaft}
                  data-token={FOLLICLE_TOKEN}
                  data-paint="stroke"
                  style={{ stroke: paint(FOLLICLE_TOKEN) }}
                  d={`M ${FOLLICLE_SHAFT.x} ${FOLLICLE_SHAFT.topY}
                      C ${FOLLICLE_SHAFT.x - 16} ${FOLLICLE_SHAFT.topY + 90},
                        ${FOLLICLE_SHAFT.x + 16} ${FOLLICLE_SHAFT.bottomY - 90},
                        ${FOLLICLE_SHAFT.x} ${FOLLICLE_SHAFT.bottomY}`}
                />
                <circle
                  className={styles.bulb}
                  data-token={FOLLICLE_TOKEN}
                  data-paint="fill"
                  style={{ fill: paint(FOLLICLE_TOKEN) }}
                  cx={FOLLICLE_BULB.x} cy={FOLLICLE_BULB.y} r={FOLLICLE_BULB.r} />
                <g data-layer-label="" className={styles.label}>
                  <line
                    className={styles.leader}
                    x1={LABEL_X}
                    y1={FOLLICLE_BULB.y}
                    x2={FOLLICLE_BULB.x - FOLLICLE_BULB.r - 4}
                    y2={FOLLICLE_BULB.y}
                  />
                  <text x={LABEL_X} y={FOLLICLE_BULB.y - 8}>
                    {text.layers.follicle}
                  </text>
                </g>
              </g>

              <g className={styles.beamGroup}>
                <line
                  data-beam=""
                  data-token={BEAM.token}
                  data-paint="stroke"
                  className={styles.beam}
                  style={{ stroke: paint(BEAM.token) }}
                  x1={BEAM.x}
                  y1={BEAM.startY}
                  x2={BEAM.x}
                  y2={BEAM.endY}
                  strokeDasharray={BEAM_LENGTH}
                />
                <circle
                  data-beam-spark=""
                  className={styles.spark}
                  data-token={BEAM.token}
                  data-paint="fill"
                  style={{ fill: paint(BEAM.token) }}
                  cx={FOLLICLE_BULB.x}
                  cy={FOLLICLE_BULB.y}
                  r={FOLLICLE_BULB.r + 10}
                />
                <text className={styles.beamLabel} x={BEAM.x + 14} y={26}>
                  {text.beam}
                </text>
              </g>
            </svg>
            <figcaption className={styles.caption}>{text.caption}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
