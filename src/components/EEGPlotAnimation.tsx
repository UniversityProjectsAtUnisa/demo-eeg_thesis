import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Point, Line } from "../globalState";
import { LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import { SEGMENT_LENGTH, SEGMENT_DURATION, SHAPE_RENDER_TYPE, LEAD_NAMES, PLOT_LINE_COLOR, IS_WEB, SAMPLING_RATE } from "../settings";
import { PlotLeadNames, PlotSignalsBaseline, PlotTimeAxis } from "./PlotComponents";
import { segmentsTransform } from "../utils";

export interface EEGPlotAnimationProps {
  eegSegments: Line[][];
  speed: number;
  onSegmentComplete: (i: number) => void;
  onComplete: () => void;
  completed: boolean;
}

const WIDTH = 1440;
const LEFT_AXIS_WIDTH = 70;
const GRAPH_WIDTH = WIDTH - LEFT_AXIS_WIDTH;
const HALF_WIDTH = GRAPH_WIDTH / 2;
const FULL_HEIGHT = IS_WEB ? 400 : 500;
const SPEED_MODIFIER = SAMPLING_RATE / 256;

const SHAPE_RENDERING: SHAPE_RENDER_TYPE = "optimizeSpeed";
const STROKE_WIDTH = 1.2;

const xMaps = [(p: Point) => p.x, (p: Point) => p.x + HALF_WIDTH];

export function EEGPlotAnimation({ eegSegments: rawEegSegments, speed, onSegmentComplete, onComplete, completed }: EEGPlotAnimationProps) {
  const [linesArray, setLines] = useState<Line[][][]>([rawEegSegments[0].map(() => [])]);
  const [segIndex, setSegIndex] = useState(0);
  const i = useRef(0);
  const elapsed = useRef(0);
  const animationId = useRef(0);

  const HEIGHT = FULL_HEIGHT / rawEegSegments[0].length;

  const yMaps = useMemo(() => rawEegSegments[0].map((_, i) => (p: Point) => p.y + HEIGHT * i), [rawEegSegments]);

  const eegSegments = useMemo(
    () => segmentsTransform(rawEegSegments, GRAPH_WIDTH / SEGMENT_LENGTH / 2, HEIGHT / 15, HEIGHT / 2),
    [rawEegSegments]
  );
  const xAxisScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [0, GRAPH_WIDTH - 1],
        domain: [segIndex * SEGMENT_DURATION, (segIndex + 2) * SEGMENT_DURATION],
      }),
    [segIndex]
  );

  const onSegmentEnd = useCallback(
    (nextIndex: number) => {
      // reset -> animation, segment progress (i) and elapsed time
      window.cancelAnimationFrame(animationId.current);
      i.current = elapsed.current = animationId.current = 0;

      // update lines, increment segment index, execute complete callback
      const isLast = nextIndex >= eegSegments.length;
      if (!isLast) {
        onSegmentComplete(nextIndex);
        setLines((currLines) => [currLines.pop(), eegSegments[0].map(() => [])]);
      } else {
        onComplete();
      }
      setSegIndex(nextIndex);
    },
    [onComplete, onSegmentComplete, eegSegments]
  );

  const endingLines = useMemo(() => {
    const leads1 = eegSegments[eegSegments.length - 1].map((lead) => [lead]);
    const leads2 = eegSegments[eegSegments.length - 2].map((lead) => [lead]);
    return [leads2, leads1];
  }, [completed, eegSegments]);

  useEffect(() => {
    if (completed) {
      setLines(endingLines);
    }
    if (speed <= 0 || segIndex >= eegSegments.length) return;

    const leads = eegSegments[segIndex];
    let previousTimeStamp: number | undefined;

    const animStep = (timestamp: number) => {
      if (previousTimeStamp === undefined) {
        previousTimeStamp = timestamp;
        animationId.current = window.requestAnimationFrame(animStep);
        return;
      }

      if (i.current >= leads[0].length) {
        onSegmentEnd(segIndex + 1);
        return;
      }

      const dx = Math.floor((timestamp - previousTimeStamp) * SPEED_MODIFIER * speed);
      elapsed.current += dx;
      previousTimeStamp = timestamp;

      const sliceStop = i.current + dx + 1;
      const newLines = leads.map((lead) => lead.slice(i.current, sliceStop));
      i.current = sliceStop - 1;

      animationId.current = window.requestAnimationFrame(animStep);
      setLines((currLines) => {
        const oldLines = currLines.pop();
        newLines.forEach((newLine, i) => oldLines[i].push(newLine));
        return [...currLines, oldLines];
      });
    };

    animationId.current = window.requestAnimationFrame(animStep);
    return () => window.cancelAnimationFrame(animationId.current);
  }, [eegSegments, segIndex, speed, onSegmentEnd, completed]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <div style={{ display: "flex" }}>
        <PlotLeadNames width={LEFT_AXIS_WIDTH} height={FULL_HEIGHT} names={LEAD_NAMES} />

        <svg width={GRAPH_WIDTH} height={FULL_HEIGHT}>
          <rect fill="#dee2e649" width="100%" height="100%" />

          <PlotSignalsBaseline count={rawEegSegments[0].length} />
          <line x1="50%" x2="50%" y1="0%" y2="100%" stroke="#00000022" strokeWidth={2} />

          {linesArray.map((seg, segIndex) =>
            seg.map((lead, leadIndex) =>
              lead.map((line, i) => (
                <LinePath
                  key={`line-${segIndex}-${i}-${leadIndex}`}
                  data={line}
                  x={xMaps[segIndex]}
                  y={yMaps[leadIndex]}
                  fill="transparent"
                  stroke={PLOT_LINE_COLOR}
                  strokeWidth={STROKE_WIDTH}
                  shapeRendering={SHAPE_RENDERING}
                />
              ))
            )
          )}

          {segIndex > 0 && <rect fill="#00000037" width="50%" height="100%" />}
        </svg>
      </div>

      <PlotTimeAxis top={0} left={LEFT_AXIS_WIDTH} scale={xAxisScale} />
    </div>
  );
}

EEGPlotAnimation.WIDTH = WIDTH;
