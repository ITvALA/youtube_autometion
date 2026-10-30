import React from "react";
import {Composition, CalculateMetadataFunction} from "remotion";
import {Main, Plan} from "./Video";
import demo from "../../data/demo_plan.json";

const FPS = 30;
const calc: CalculateMetadataFunction<Plan> = ({props}) => ({
  durationInFrames: Math.max(30, props.scenes.reduce((a, s) => a + Math.round(s.durationSec * FPS), 0)),
  width: props.theme.format.width,
  height: props.theme.format.height,
  fps: FPS,
});

export const Root: React.FC = () => (
  <Composition id="Main" component={Main} durationInFrames={300} fps={FPS} width={1080} height={1920}
    defaultProps={demo as unknown as Plan} calculateMetadata={calc} />
);
