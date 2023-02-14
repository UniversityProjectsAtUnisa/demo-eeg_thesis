import { useCallback, useEffect, useMemo, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Button, Group } from "@mantine/core";
import useGlobalStore, { fileDataSelector, Line } from "../globalState";
import { CurrentDiagnosis, DiagnosisProbs, DiagnosisResultModal, EEGPlotAnimation, ProgressBar } from "../components";
import ChannelPlacement from "../assets/ChannelPlacement";
import { SPEED_ARRAY } from "../settings";
import { useNavigate } from "react-router-dom";

export function DemonstratorPage() {
  const data = useGlobalStore(fileDataSelector);
  const navigate = useNavigate();

  useEffect(() => {
    if (data === undefined) navigate("/");
  }, [data]);

  if (data === undefined) return null;
  return <Demonstrator eegSegments={data.sampleSegments} predictions={data.predictions} />;
}

interface DemonstratorProps {
  eegSegments: Line[][];
  predictions: number[];
}

export function Demonstrator({ eegSegments: eegSegments, predictions }: DemonstratorProps) {
  const [completed, handlers] = useDisclosure(false);
  const [positive, setPositive] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);

  const onSegmentComplete = useCallback(
    (segmentIndex: number) => {
      const progress = Math.min(segmentIndex / (eegSegments.length - 1), 1);

      setProgress(progress);
      setPositive(predictions.includes(segmentIndex));
    },
    [predictions]
  );

  const skipAnimation = useCallback(() => {
    setSpeed(0);
    handlers.open();
  }, [handlers]);

  return (
    <main style={{ width: EEGPlotAnimation.WIDTH, paddingTop: "2rem" }}>
      <Group position="apart" align="flex-end" mb="md">
        <Group spacing="sm">
          {SPEED_ARRAY.map((s) => (
            <Button key={s} onClick={() => setSpeed(s)} color={speed === s ? "blue" : "gray"} size="sm" radius="xs" compact>
              {s}x
            </Button>
          ))}
          <Button onClick={skipAnimation} color="gray" size="sm" radius="xs" compact>
            Skip
          </Button>
        </Group>
      </Group>

      <EEGPlotAnimation eegSegments={eegSegments} speed={speed} onComplete={handlers.open} onSegmentComplete={onSegmentComplete} />

      <ProgressBar progress={progress} />

      <Group mt="xl" style={{ height: 350 }}>
        <Group position="apart" align="center" style={{ flex: 1, padding: "0 10vw" }}>
          <div style={{ height: 100, width: 100, backgroundColor: positive ? "red" : "green", borderRadius: 10 }} />
          <ChannelPlacement />
        </Group>
      </Group>
      <DiagnosisResultModal show={completed} />
    </main>
  );
}
