import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Timeline, Text, Group, Affix, ActionIcon } from "@mantine/core";
import { LinePath } from "@visx/shape";
import { LEAD_NAMES, PLOT_LINE_COLOR, SAMPLING_RATE, SEGMENT_DURATION, SHAPE_RENDER_TYPE } from "../settings";
import useGlobalStore, { fileDataSelector, Point, Event } from "../globalState";
import { HomeIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { formatSeconds } from "../utils";
import { scaleLinear } from "@visx/scale";
import { PlotLeadNames, PlotSignalsBaseline, PlotTimeAxis } from "../components";
import { PatternLines } from "@visx/pattern";
import BaseBrush from "@visx/brush/lib/BaseBrush";
import { Brush } from "@visx/brush";
import { BrushHandleRenderProps } from "@visx/brush/lib/BrushHandle";
import { Bounds } from "@visx/brush/lib/types";
import { Group as VisxGroup } from "@visx/group";

const SHAPE_RENDERING: SHAPE_RENDER_TYPE = "geometricPrecision";
const STROKE_WIDTH = 1.7;

const WIDTH = 1320;
const LEFT_AXIS_WIDTH = 70;
const GRAPH_WIDTH = WIDTH - LEFT_AXIS_WIDTH;
const FULL_HEIGHT = 740;

const FULL_Y_SCALE = FULL_HEIGHT / 17;

const BRUSH_HEIGHT = 75;
const BRUSH_INIT_DURATION = 5;

const xMap = (p: Point) => p.x;
const yMap = (p: Point) => p.y;

const PATTERN_ID = "brush_pattern";
const SELECTED_BRUSH_STYLE = {
  fill: `url(#${PATTERN_ID})`,
  stroke: "#0000007b",
};

const BULLET_STYLE: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  borderRadius: 50,
  backgroundColor: "rgba(0,0,0,0)",
  border: "none",
  cursor: "pointer",
  outline: "none",
};

export function DisplayEventsPage() {
  const location = useLocation();
  const initialPred = location?.state?.pred;
  const navigate = useNavigate();
  const fileData = useGlobalStore(fileDataSelector);
  const HEIGHT_TRANSLATES = useCallback(
    (i: number) => ((FULL_HEIGHT / fileData?.sampleSegments?.[0].length ?? 1) * (2 * i + 1)) / 2,
    [fileData]
  );

  const events = useMemo(() => {
    const predictions = fileData ? fileData.predictions : [];

    const predGroups: number[][] = [];

    let start: number | null = null;
    for (let i = 0; i < predictions.length - 1; i++) {
      if (start !== null && predictions[i] + 1 !== predictions[i + 1]) {
        predGroups.push(predictions.slice(start, i + 1));
        start = null;
      } else if (start === null && predictions[i] + 1 === predictions[i + 1]) {
        start = i;
      } else if (start === null && predictions[i] + 1 !== predictions[i + 1]) {
        predGroups.push([predictions[i]]);
      }
    }
    predGroups.push(predictions.slice(start ?? predictions.length - 1));

    console.log({ predictions }, { predGroups });

    return predGroups.map((predGroup) => {
      const data = predGroup.map((pred) =>
        fileData.sampleSegments[pred].map((lead, leadIdx) =>
          lead.map((p) => ({
            x: p.x,
            y: p.y * (FULL_Y_SCALE / fileData.sampleSegments[0].length) + HEIGHT_TRANSLATES(leadIdx),
          }))
        )
      );
      return {
        data: data[0].map((lead, i) => [].concat(...data.map((seg) => seg[i]))),
        startSeconds: Math.min(...predGroup) * SEGMENT_DURATION,
        endSeconds: (Math.max(...predGroup) + 1) * SEGMENT_DURATION,
      };
    });
  }, [fileData]);

  const initialIndex = useMemo(
    () =>
      !initialPred
        ? 0
        : events.findIndex((e) => e.startSeconds <= initialPred * SEGMENT_DURATION && e.endSeconds >= initialPred * SEGMENT_DURATION),
    [initialPred, events]
  );

  useEffect(() => {
    if (fileData === undefined) navigate("/");
  }, [fileData]);

  if (fileData === undefined) return null;
  return (
    <div style={{ paddingTop: "2rem" }}>
      <DisplayEventsBody events={events} initialIndex={initialIndex} />

      <Affix position={{ top: 20, right: 20 }}>
        <ActionIcon variant="filled" color="blue" size="lg" onClick={() => navigate("/demonstrator", { state: { fromLastPage: true } })}>
          <ArrowLeftIcon width="18" />
        </ActionIcon>
      </Affix>

      <Affix position={{ bottom: 20, right: 20 }}>
        <ActionIcon variant="filled" color="blue" size="lg" onClick={() => navigate("/")}>
          <HomeIcon width="18" />
        </ActionIcon>
      </Affix>
    </div>
  );
}

function DisplayEventsBody({ events, initialIndex }: { events: Event[]; initialIndex: number }) {
  const brushRef = useRef<BaseBrush | null>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [bounds, setBounds] = useState<[number, number]>([0, BRUSH_INIT_DURATION]);
  const currEvent = useMemo(() => events[activeIndex], [activeIndex]);
  const boundedData = useMemo(() => {
    const [start, end] = bounds;
    const sliceStart = start * SAMPLING_RATE;
    const sliceEnd = end * SAMPLING_RATE;
    const slice = currEvent.data.map((lead) => lead.slice(sliceStart, sliceEnd));
    const xStep = GRAPH_WIDTH / slice[0].length;
    return slice.map((lead) => lead.map((p, i) => ({ x: i * xStep, y: p.y })));
  }, [currEvent, bounds]);

  const xAxisScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [0, GRAPH_WIDTH - 1],
        domain: bounds,
      }),
    [bounds]
  );

  const xBrushAxisScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [0, GRAPH_WIDTH - 1],
        domain: [0, currEvent.endSeconds - currEvent.startSeconds],
      }),
    [currEvent]
  );

  const yBrushAxisScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [0, BRUSH_HEIGHT],
        domain: [0, 8],
      }),
    []
  );

  const initialBrushPosition = useMemo(
    () => ({
      start: { x: xBrushAxisScale(0) },
      end: { x: xBrushAxisScale(BRUSH_INIT_DURATION) },
    }),
    [xBrushAxisScale]
  );

  const onBrushChange = useCallback(
    (domain: Bounds | null) => {
      if (!domain) return;
      const { x0, x1 } = domain;
      setBounds([Math.max(x0, 0), Math.min(x1, currEvent.endSeconds - currEvent.startSeconds)]);
    },
    [currEvent]
  );

  const onEventChange = useCallback(
    (i: number) => {
      setActiveIndex(i);

      const nextEvent = events[i];
      const nextBrushScale = scaleLinear<number>({
        range: [0, GRAPH_WIDTH - 1],
        domain: [0, nextEvent.endSeconds - nextEvent.startSeconds],
      });
      const newExtent = {
        x0: nextBrushScale(0),
        x1: nextBrushScale(BRUSH_INIT_DURATION),
        y0: 0,
        y1: BRUSH_HEIGHT,
      };
      brushRef.current.updateBrush((prev) => ({
        ...prev,
        start: { y: newExtent.y0, x: newExtent.x0 },
        end: { y: newExtent.y1, x: newExtent.x1 },
        extent: newExtent,
      }));
    },
    [events]
  );

  return (
    <Group position="apart" align="flex-start" style={{ width: 1560, margin: "0 auto" }}>
      <Timeline color="orange" bulletSize={28}>
        {events.map((e, i) => (
          <Timeline.Item
            key={i}
            title={`${formatSeconds(e.startSeconds)} - ${formatSeconds(e.endSeconds)}`}
            active={i === activeIndex}
            bullet={i !== activeIndex && <button style={BULLET_STYLE} onClick={() => onEventChange(i)} />}
          >
            <Text size="xs" color="dimmed">
              {e.endSeconds - e.startSeconds} seconds
            </Text>
          </Timeline.Item>
        ))}
      </Timeline>

      <div style={{ width: WIDTH }}>
        <div style={{ display: "flex", userSelect: "none" }}>
          <PlotLeadNames width={LEFT_AXIS_WIDTH} height={FULL_HEIGHT} names={LEAD_NAMES} />

          <svg width={GRAPH_WIDTH} height={FULL_HEIGHT}>
            <rect fill="#dee2e649" width="100%" height="100%" />
            <PlotSignalsBaseline count={currEvent.data.length} />

            {boundedData.map((line, i) => (
              <LinePath
                key={`line-${i}`}
                fill="transparent"
                stroke={PLOT_LINE_COLOR}
                strokeWidth={STROKE_WIDTH}
                data={line}
                shapeRendering={SHAPE_RENDERING}
                x={xMap}
                y={yMap}
              />
            ))}
          </svg>
        </div>

        <PlotTimeAxis top={-2} left={LEFT_AXIS_WIDTH} scale={xAxisScale} />

        <svg width={GRAPH_WIDTH} height={BRUSH_HEIGHT} style={{ marginLeft: LEFT_AXIS_WIDTH, marginTop: 25 }} overflow="visible">
          <rect fill="#dee2e634" width="100%" height="100%" />
          <PatternLines id={PATTERN_ID} height={8} width={8} stroke={PLOT_LINE_COLOR} strokeWidth={1} orientation={["diagonal"]} />
          <Brush
            xScale={xBrushAxisScale}
            yScale={yBrushAxisScale}
            width={GRAPH_WIDTH}
            height={BRUSH_HEIGHT}
            handleSize={8}
            innerRef={brushRef}
            resizeTriggerAreas={["left", "right"]}
            brushDirection="horizontal"
            initialBrushPosition={initialBrushPosition}
            onChange={onBrushChange}
            selectedBoxStyle={SELECTED_BRUSH_STYLE}
            useWindowMoveEvents
            renderBrushHandle={(props) => <BrushHandle {...props} />}
          />
        </svg>
      </div>
    </Group>
  );
}

function BrushHandle({ x, height, isBrushActive }: BrushHandleRenderProps) {
  if (!isBrushActive) return null;
  return (
    <VisxGroup left={x + 4} top={(height - 15) / 2}>
      <path
        fill="#f2f2f2"
        d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
        stroke="#999999"
        strokeWidth="1"
        style={{ cursor: "ew-resize" }}
      />
    </VisxGroup>
  );
}
