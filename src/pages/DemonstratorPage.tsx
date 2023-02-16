import { useCallback, useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Affix, Button, Group } from "@mantine/core";
import useGlobalStore, { fileDataSelector, Line } from "../globalState";
import { DiagnosisResultModal, EEGPlotAnimation, ProgressBar, DetectionIndicator } from "../components";
import { ChannelPlacement } from "../assets/ChannelPlacement";
import { SPEED_ARRAY } from "../settings";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRightIcon, HomeIcon } from "@heroicons/react/24/solid";

export function DemonstratorPage() {
  const data = useGlobalStore(fileDataSelector);
  const navigate = useNavigate();

  useEffect(() => {
    if (data === undefined) navigate("/");
  }, [data]);

  if (data === undefined) return null;
  return <Demonstrator eegSegments={data.sampleSegments} predictions={data.predictions} />;
}

interface NavigationButtonProps {
  show: boolean;
  forward: boolean;
}
export const NavigationButtons = ({ show, forward }: NavigationButtonProps) => {
  const navigate = useNavigate();
  if (!show) {
    return null;
  }
  return (
    <>
      {forward && (
        <Affix position={{ top: 20, right: 20 }}>
          <ActionIcon
            variant="filled"
            color="blue"
            size="lg"
            onClick={() => navigate("/display-patterns", { state: { fromLastPage: true } })}
          >
            <ArrowRightIcon width="18" />
          </ActionIcon>
        </Affix>
      )}
      <Affix position={{ bottom: 20, right: 20 }}>
        <ActionIcon variant="filled" color="blue" size="lg" onClick={() => navigate("/", { state: { fromLastPage: true } })}>
          <HomeIcon width="18" />
        </ActionIcon>
      </Affix>
    </>
  );
};

interface DemonstratorProps {
  eegSegments: Line[][];
  predictions: number[];
}

export function Demonstrator({ eegSegments: eegSegments, predictions }: DemonstratorProps) {
  const location = useLocation();
  const fromLastPage = location?.state?.fromLastPage;
  const [showModal, handlers] = useDisclosure(false);
  const [positive, setPositive] = useState(false);
  const [speed, setSpeed] = useState(fromLastPage ? 0 : 1);
  const [progress, setProgress] = useState(fromLastPage ? 1 : 0);

  const completed = progress == 1;

  const onSegmentComplete = useCallback(
    (segmentIndex: number) => {
      const progress = Math.min(segmentIndex / (eegSegments.length - 1), 1);

      setProgress(progress);
      setPositive(predictions.includes(segmentIndex - 1));
    },
    [predictions]
  );

  const skipAnimation = useCallback(() => {
    setSpeed(0);
    setProgress(1);
    handlers.open();
  }, [handlers]);

  return (
    <main style={{ width: EEGPlotAnimation.WIDTH, paddingTop: "2rem" }}>
      <Group position="apart" align="flex-end" mb="md">
        <Group spacing="sm">
          {SPEED_ARRAY.map((s) => (
            <Button
              disabled={completed}
              key={s}
              onClick={() => setSpeed(s)}
              color={speed === s ? "blue" : "gray"}
              size="sm"
              radius="xs"
              compact
            >
              {s}x
            </Button>
          ))}
          <Button disabled={completed} onClick={skipAnimation} color="gray" size="sm" radius="xs" compact>
            Skip
          </Button>
        </Group>
      </Group>

      <EEGPlotAnimation eegSegments={eegSegments} speed={speed} onComplete={handlers.open} onSegmentComplete={onSegmentComplete} />

      <ProgressBar progress={progress} predictions={predictions} size={eegSegments.length} />

      <Group mt="xl" style={{ height: 350 }}>
        <Group position="apart" align="center" style={{ flex: 1, padding: "0 10vw" }}>
          <DetectionIndicator color={positive ? "red" : "#087f5b"} />
          <ChannelPlacement />
        </Group>
      </Group>
      <DiagnosisResultModal show={showModal} close={handlers.close} />
      <NavigationButtons show={completed && !showModal} forward={!!predictions?.length} />
    </main>
  );
}
