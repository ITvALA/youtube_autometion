import React from "react";
import {Composition, CalculateMetadataFunction} from "remotion";
import {Main, Plan} from "./Video";
import demo from "../../data/demo_plan.json";
import {CharacterDemoVertical} from "./components/Character";
import {PuppetStory, DEMO_SCENES, totalFrames} from "./components/PuppetKit";
import {PuppetWarStory, PUPPET_WAR_STORY_FRAMES} from "./components/PuppetWarStory";

const FPS = 30;
const calc: CalculateMetadataFunction<Plan> = ({props}) => ({
  durationInFrames: Math.max(30, props.scenes.reduce((a, s) => a + Math.round(s.durationSec * FPS), 0)),
  width: 1080,
  height: 1920,
  fps: FPS,
});

export const Root: React.FC = () => (
  <>
    <Composition
      id="Main"
      component={Main}
      durationInFrames={300}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={demo as unknown as Plan}
      calculateMetadata={calc}
    />
    <Composition
      id="CharacterDemo"
      component={CharacterDemoVertical}
      durationInFrames={300}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="PuppetStory"
      component={PuppetStory}
      durationInFrames={totalFrames(DEMO_SCENES)}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="PuppetWarStory"
      component={PuppetWarStory}
      durationInFrames={PUPPET_WAR_STORY_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
