import { useCallback, useEffect, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Button, Group } from '@mantine/core';
import useGlobalStore, { fileDataSelector, Line } from '../globalState';
import { CurrentDiagnosis, DiagnosisProbs, DiagnosisResultModal, ECGPlotAnimation, ProgressBar } from '../components';
import LeadPlacement from '../assets/LeadPlacement';
import { DISEASES, SPEED_ARRAY } from '../settings';
import { useNavigate } from 'react-router-dom';

export function DemonstratorPage() {
  const data = useGlobalStore(fileDataSelector);
  const navigate = useNavigate();

  useEffect(() => {
    if (data === undefined)
      navigate('/');
  }, [data]);

  if (data === undefined) return null;
  return <Demonstrator ecgSegments={data.sampleSegments} thresholds={data.thresholds} predictions={data.predictions} />
}

interface DemonstratorProps {
  ecgSegments: Line[][];
  thresholds: number[];
  predictions: number[][];
}

export function Demonstrator({ ecgSegments, thresholds, predictions }: DemonstratorProps) {
  const [completed, handlers] = useDisclosure(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [totDiagnosis, setTotDiagnosis] = useState(DISEASES.map(d => ({ disease: d, active: false })));
  const [diagnosis, setDiagnosis] = useState(DISEASES.map((d, i) => ({ disease: d, threshold: thresholds[i], prob: 0 })));

  const onSegmentComplete = useCallback((segmentIndex: number) => {
    const segmentPredictions = predictions[segmentIndex];
    const progress = Math.min(segmentIndex / predictions.length, 1);

    setProgress(progress);
    setTotDiagnosis((totD) => totD.map((d, i) => ({
      ...d, active: d.active || segmentPredictions[i] >= thresholds[i],
    })));
    setDiagnosis(d => d.map((v, i) => ({
      ...v,
      prob: segmentPredictions[i],
    })));
  }, [predictions, thresholds]);

  const skipAnimation = useCallback(() => {
    setSpeed(0);
    handlers.open();
  }, [handlers]);

  return (
    <main style={{ width: ECGPlotAnimation.WIDTH, paddingTop: '2rem' }}>
      <Group position='apart' align='flex-end' mb='md'>
        <CurrentDiagnosis diagnosis={totDiagnosis} />

        <Group spacing='sm'>
          {SPEED_ARRAY.map(s => (
            <Button key={s} onClick={() => setSpeed(s)} color={speed === s ? 'blue' : 'gray'} size='sm' radius='xs' compact>
              {s}x
            </Button>
          ))}
          <Button onClick={skipAnimation} color='gray' size='sm' radius='xs' compact>Skip</Button>
        </Group>
      </Group>

      <ECGPlotAnimation
        ecgSegments={ecgSegments}
        speed={speed}
        onComplete={handlers.open}
        onSegmentComplete={onSegmentComplete}
      />

      <ProgressBar progress={progress} />

      <Group mt='xl' style={{ height: 350 }}>
        <DiagnosisProbs width={450} diagnosis={diagnosis} />
        <Group position='center' align='center' style={{ flex: 1 }}>
          <LeadPlacement />
        </Group>
      </Group>

      <DiagnosisResultModal show={completed} />
    </main>
  );
}
