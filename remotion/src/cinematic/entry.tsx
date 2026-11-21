// Standalone entry: renders only the paper-cut film (no other compositions, no Google-font fetches).
//   npx remotion render src/cinematic/entry.tsx PaperFilm out/paperfilm.mp4 --props=../data/demo_paperfilm.json
import React from "react";
import {Composition, CalculateMetadataFunction, registerRoot} from "remotion";
import {PaperFilm, totalFramesPF} from "./PaperFilm";
import {CinematicArc, totalFramesCA} from "./CinematicArc";
import {LibraryPreview} from "./paper/library/LibraryPreview";
import {PaperScene3DDemo} from "./paper/demo/PaperScene3DDemo";
import type {PFProps} from "./types";
import demo from "../../../data/demo_paperfilm.json";

const FPS = 30;
const calcPF: CalculateMetadataFunction<PFProps> = ({props}) => ({durationInFrames: totalFramesPF(props.scenes, FPS), width: 1080, height: 1920, fps: FPS});
const calcCA: CalculateMetadataFunction<PFProps> = ({props}) => ({durationInFrames: totalFramesCA(props.scenes, FPS), width: 1080, height: 1920, fps: FPS});

registerRoot(() => (
  <>
    <Composition id="PaperFilm" component={PaperFilm} durationInFrames={totalFramesPF((demo as unknown as PFProps).scenes, FPS)} fps={FPS} width={1080} height={1920} defaultProps={demo as unknown as PFProps} calculateMetadata={calcPF} />
    <Composition id="CinematicArc" component={CinematicArc} durationInFrames={totalFramesCA((demo as unknown as PFProps).scenes, FPS)} fps={FPS} width={1080} height={1920} defaultProps={demo as unknown as PFProps} calculateMetadata={calcCA} />
    <Composition id="LibraryPreview" component={LibraryPreview} durationInFrames={240} fps={FPS} width={1080} height={1920} />
    <Composition id="PaperScene3DDemo" component={PaperScene3DDemo} durationInFrames={150} fps={FPS} width={1080} height={1920} />
  </>
));
