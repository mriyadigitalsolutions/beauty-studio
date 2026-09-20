'use client';

import { useId } from 'react';
import {
  DISSOLVE_BAND,
  HAIR_STROKES,
  STAGE,
  maskEdgeY,
  shinPointAt,
  type HairStroke,
} from './laser-geometry';
import { LEG_AFTER, LEG_BEFORE, type SceneImage } from './scene-assets';
import type { ScenePhotos } from './useSceneImage';
import styles from './LaserReveal.module.css';

/** How hard feTurbulence pushes the dissolve band around. */
const EDGE_ROUGHNESS = 20;

export interface LaserStageProps {
  photos: ScenePhotos;
  alt: string;
  /** `full` plays the reveal; `final` is the settled photograph after it. */
  variant?: 'full' | 'final';
}

/** The hidden `<picture>` that does the format and width negotiation for us. */
function Negotiator({ image, photos, sizes }: { image: SceneImage; photos: ScenePhotos; sizes: string }) {
  return (
    <picture>
      {image.sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={sizes} />
      ))}
      <img
        className={styles.negotiator}
        src={image.src}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="low"
        onLoad={(event) => photos.reportLoaded(image, event.currentTarget.currentSrc || image.src)}
        onError={photos.reportFailed}
      />
    </picture>
  );
}

const SIZES = '(max-width: 47.99rem) 82vw, 31rem';

function Hair({ hair, id }: { hair: HairStroke; id: number }) {
  const radians = (hair.angle * Math.PI) / 180;
  return (
    <line
      data-hair={id}
      x1={hair.x}
      y1={hair.y}
      x2={hair.x + Math.sin(radians) * hair.length}
      y2={hair.y + Math.cos(radians) * hair.length}
    />
  );
}

/**
 * One frame of the scene: the untreated photograph, the treated one under a
 * mask whose edge is roughened by feTurbulence, the hair strokes and the
 * applicator. Nothing here moves on its own — `LaserReveal` hands the whole
 * group to the scene timeline, and the start state comes from CSS (story 33).
 */
export function LaserStage({ photos, alt, variant = 'full' }: LaserStageProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const maskId = `laser-mask-${uid}`;
  const fadeId = `laser-fade-${uid}`;
  const edgeId = `laser-edge-${uid}`;
  const glowId = `laser-glow-${uid}`;
  const start = shinPointAt(0);
  const images = variant === 'final' ? [LEG_AFTER] : [LEG_BEFORE, LEG_AFTER];

  return (
    <figure
      className={styles.stage}
      data-laser-photo={photos.state}
      style={{
        aspectRatio: `${STAGE.width} / ${STAGE.height}`,
        backgroundColor: LEG_BEFORE.placeholder,
        backgroundImage: `url("${LEG_BEFORE.blurDataUri}")`,
      }}
    >
      {photos.state !== 'idle' &&
        images.map((image) => (
          <Negotiator key={image.id} image={image} photos={photos} sizes={SIZES} />
        ))}

      <svg
        className={styles.canvas}
        viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={alt}
        data-laser-canvas={variant}
      >
        <defs>
          {/* The living edge: noise displaces the fade, so the skin opens with
              a dissolving border instead of a straight line. */}
          <filter id={edgeId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.09 0.17"
              numOctaves={4}
              seed={9}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={EDGE_ROUGHNESS}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <linearGradient
            id={fadeId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={maskEdgeY(0) - DISSOLVE_BAND}
            x2={0}
            y2={maskEdgeY(0)}
            data-laser-fade
          >
            <stop offset="0" stopColor="rgb(var(--white-rgb))" stopOpacity="1" />
            <stop offset="1" stopColor="rgb(var(--white-rgb))" stopOpacity="0" />
          </linearGradient>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect
              x={-80}
              y={-120}
              width={STAGE.width + 160}
              height={STAGE.height + 260}
              fill={`url(#${fadeId})`}
              filter={`url(#${edgeId})`}
            />
          </mask>
          <radialGradient id={glowId}>
            <stop offset="0" stopColor="rgb(var(--lilac-rgb))" stopOpacity="0.85" />
            <stop offset="0.55" stopColor="rgb(var(--rose-rgb))" stopOpacity="0.35" />
            <stop offset="1" stopColor="rgb(var(--rose-rgb))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {variant === 'full' && (
          <image
            data-laser-layer="before"
            href={photos.hrefs[LEG_BEFORE.id]}
            x={0}
            y={0}
            width={STAGE.width}
            height={STAGE.height}
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        <g mask={variant === 'full' ? `url(#${maskId})` : undefined} data-laser-layer="after">
          <image
            href={photos.hrefs[LEG_AFTER.id]}
            x={0}
            y={0}
            width={STAGE.width}
            height={STAGE.height}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>

        {variant === 'full' && (
          <>
            <g className={styles.hairs} data-laser-hairs>
              {HAIR_STROKES.map((hair) => (
                <Hair key={hair.id} hair={hair} id={hair.id} />
              ))}
            </g>

            {/*
             * A drawn applicator, not a cut-out of the photographed hand: see
             * the note in LaserReveal.tsx. It rides the dissolve edge, and the
             * photographed hand stays where it belongs — in the final frame.
             */}
            <g className={styles.applicator} data-laser-applicator>
              <g transform={`translate(${start.x} ${start.y})`} data-laser-applicator-body>
                <g transform={`rotate(${start.angle})`}>
                  <ellipse cx={0} cy={4} rx={132} ry={94} fill={`url(#${glowId})`} data-laser-glow />
                  <g transform="rotate(-36)">
                    <path d="M -34 -4 L 34 -4 L 52 44 L -52 44 Z" className={styles.beam} />
                    {/* The applicator, and the hand that holds it: the brief
                        asks for a hand travelling down the leg, and the
                        photographed one cannot be cut out (see LaserReveal). */}
                    <rect x={-25} y={-140} width={50} height={134} rx={25} className={styles.grip} />
                    <g className={styles.hand} data-laser-hand>
                      <path
                        d="M 30 -126 Q 74 -140 96 -118 L 128 -70 Q 140 -50 128 -36 L 96 -30 Z"
                        className={styles.forearm}
                      />
                      <rect x={6} y={-124} width={84} height={96} rx={34} className={styles.palm} />
                      <rect x={-34} y={-118} width={92} height={19} rx={9.5} className={styles.finger} />
                      <rect x={-38} y={-96} width={96} height={19} rx={9.5} className={styles.finger} />
                      <rect x={-36} y={-74} width={94} height={19} rx={9.5} className={styles.finger} />
                      <rect x={-30} y={-52} width={86} height={18} rx={9} className={styles.finger} />
                      <path
                        d="M 4 -30 Q -26 -26 -34 -44 Q -40 -60 -26 -66"
                        className={styles.thumb}
                      />
                    </g>
                    <rect x={-31} y={-20} width={62} height={34} rx={16} className={styles.head} />
                    <rect x={-22} y={-10} width={44} height={14} rx={7} className={styles.window} />
                    <path d="M -14 -2 L -8 -14 M 14 -2 L 8 -14" className={styles.spark} />
                  </g>
                </g>
              </g>
            </g>
          </>
        )}
      </svg>
    </figure>
  );
}
