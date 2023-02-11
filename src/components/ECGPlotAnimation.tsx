import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Point, Line } from '../globalState';
import { LinePath } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { SEGMENT_LENGTH, SEGMENT_DURATION, SHAPE_RENDER_TYPE, LEAD_NAMES, PLOT_LINE_COLOR, IS_WEB } from '../settings';
import { PlotLeadNames, PlotSignalsBaseline, PlotTimeAxis } from './PlotComponents';
import { segmentsTransform } from '../utils';

export interface ECGPlotAnimationProps {
  ecgSegments: Line[][];
  speed: number;
  onSegmentComplete: (i: number) => void;
  onComplete: () => void;
}

const WIDTH = 1440;
const LEFT_AXIS_WIDTH = 27;
const GRAPH_WIDTH = WIDTH - LEFT_AXIS_WIDTH;
const HALF_WIDTH = GRAPH_WIDTH / 2;
const HEIGHT = IS_WEB ? 180 : 200;
const FULL_HEIGHT = HEIGHT * 2;

const SHAPE_RENDERING: SHAPE_RENDER_TYPE = 'optimizeSpeed';
const STROKE_WIDTH = 1.2;

const xMaps = [(p: Point) => p.x, (p: Point) => p.x + HALF_WIDTH];
const yMaps = [(p: Point) => p.y, (p: Point) => p.y + HEIGHT];

export function ECGPlotAnimation({ ecgSegments: rawEcgSegments, speed, onSegmentComplete, onComplete }: ECGPlotAnimationProps) {
  const [linesArray, setLines] = useState<Line[][][]>([[[], []]]);
  const [segIndex, setSegIndex] = useState(0);
  const i = useRef(0);
  const elapsed = useRef(0);
  const animationId = useRef(0);

  const ecgSegments = useMemo(() => (
    segmentsTransform(rawEcgSegments, GRAPH_WIDTH / SEGMENT_LENGTH / 2, HEIGHT / 15, HEIGHT / 2)
  ), [rawEcgSegments]);
  const xAxisScale = useMemo(() => (
    scaleLinear<number>({
      range: [0, GRAPH_WIDTH - 1],
      domain: [segIndex * SEGMENT_DURATION, (segIndex + 2) * SEGMENT_DURATION],
    })
  ), [segIndex]);

  const onSegmentEnd = useCallback((nextIndex: number) => {
    // reset -> animation, segment progress (i) and elapsed time
    window.cancelAnimationFrame(animationId.current);
    i.current = elapsed.current = animationId.current = 0;

    // update lines, increment segment index, execute complete callback
    const isLast = nextIndex >= ecgSegments.length;
    if (!isLast) {
      onSegmentComplete(nextIndex);
      setLines(currLines => [currLines.pop(), [[], []]]);
    } else {
      onComplete();
    }
    setSegIndex(nextIndex);
  }, [onComplete, onSegmentComplete, ecgSegments]);

  useEffect(() => {
    if (speed <= 0 || segIndex >= ecgSegments.length) return;

    const [lead1, lead2] = ecgSegments[segIndex];
    let previousTimeStamp: number | undefined;

    const animStep = (timestamp: number) => {
      if (previousTimeStamp === undefined) {
        previousTimeStamp = timestamp;
        animationId.current = window.requestAnimationFrame(animStep);
        return;
      }

      if (i.current >= lead1.length) {
        onSegmentEnd(segIndex + 1);
        return;
      }
      
      const dx = Math.floor((timestamp - previousTimeStamp) * speed);
      elapsed.current += dx;
      previousTimeStamp = timestamp;
      
      const sliceStop = i.current + dx + 1;
      const newLine1 = lead1.slice(i.current, sliceStop);
      const newLine2 = lead2.slice(i.current, sliceStop);
      i.current = sliceStop - 1;
      
      animationId.current = window.requestAnimationFrame(animStep);
      setLines((currLines) => {
        const [oldLines1, oldLines2] = currLines.pop();
        oldLines1.push(newLine1);
        oldLines2.push(newLine2);
        return [...currLines, [oldLines1, oldLines2]];
      });
    };
    
    animationId.current = window.requestAnimationFrame(animStep);
    return () => window.cancelAnimationFrame(animationId.current);
  }, [ecgSegments, segIndex, speed, onSegmentEnd]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', userSelect: 'none', touchAction: 'none' }}>
      <div style={{ display: 'flex' }}>
        <PlotLeadNames width={LEFT_AXIS_WIDTH} height={FULL_HEIGHT} names={LEAD_NAMES} />

        <svg width={GRAPH_WIDTH} height={FULL_HEIGHT}>
          <rect fill="#dee2e649" width='100%' height='100%' />

          <PlotSignalsBaseline count={2} />
          <line x1='50%' x2='50%' y1='0%' y2='100%' stroke='#00000022' strokeWidth={2} />

          {linesArray.map((seg, segIndex) => seg.map((lead, leadIndex) => lead.map((line, i) => (
            <LinePath
              key={`line-${segIndex}-${i}-${leadIndex}`}
              data={line}
              x={xMaps[segIndex]}
              y={yMaps[leadIndex]}
              fill='transparent'
              stroke={PLOT_LINE_COLOR}
              strokeWidth={STROKE_WIDTH}
              shapeRendering={SHAPE_RENDERING}
            />
          ))))}

          {segIndex > 0 && <rect fill="#00000037" width='50%' height='100%' />}
        </svg>
      </div>
      
      <PlotTimeAxis top={0} left={LEFT_AXIS_WIDTH} scale={xAxisScale} />
    </div>
  );
}

ECGPlotAnimation.WIDTH = WIDTH;
ECGPlotAnimation.HEIGHT = HEIGHT;
