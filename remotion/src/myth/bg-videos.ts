/**
 * OPTIONAL real video backgrounds.
 *
 * 1. Put short LOOPING clips (mp4, 1080p, 6-20 s, no sound needed) into  remotion/public/bg/
 *    free sources: pexels.com/videos , pixabay.com/videos , mixkit.co   (search: "fire", "clouds timelapse",
 *    "forest mist", "river", "temple", "diya", "smoke", "night sky", "storm clouds")
 * 2. List the file names below. Each video then picks one of them (seeded) for its scenes of that kind.
 *    The world (trees, temple, ground, characters) is still drawn on top, the clip replaces the sky/backdrop.
 *
 * Leave every list empty ([]) and the engine uses its own animated sky (clouds, god-rays, fog, birds ...).
 * You can also set  bgVideo: 'bg/fire.mp4'  on a single scene.
 */
import type { BgKind } from './mindspark-myth-engine';

export const BG_VIDEOS: Partial<Record<BgKind, string[]>> = {
  // forest:      ['bg/forest-mist.mp4', 'bg/forest-sun.mp4'],
  // pond:        ['bg/river.mp4'],
  // temple:      ['bg/diya-smoke.mp4'],
  // battlefield: ['bg/fire-smoke.mp4', 'bg/storm-clouds.mp4'],
  // sky:         ['bg/clouds-timelapse.mp4'],
  // palace:      ['bg/gold-particles.mp4'],
};
