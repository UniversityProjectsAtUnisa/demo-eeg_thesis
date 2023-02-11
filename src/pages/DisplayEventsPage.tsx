import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timeline, Text, Group, Affix, ActionIcon } from '@mantine/core';
import { LinePath } from '@visx/shape';
import { LEAD_NAMES, PLOT_LINE_COLOR, SAMPLING_RATE, SHAPE_RENDER_TYPE } from '../settings';
import useGlobalStore, { fileDataSelector, Point, Event } from '../globalState';
import { HomeIcon } from '@heroicons/react/24/solid';
import { formatSeconds } from '../utils';
import { scaleLinear } from '@visx/scale';
import { PlotLeadNames, PlotSignalsBaseline, PlotTimeAxis } from '../components';
import { PatternLines } from '@visx/pattern';
import BaseBrush from '@visx/brush/lib/BaseBrush';
import { Brush } from '@visx/brush';
import { BrushHandleRenderProps } from '@visx/brush/lib/BrushHandle';
import { Bounds } from '@visx/brush/lib/types';
import { Group as VisxGroup } from '@visx/group';

const SHAPE_RENDERING: SHAPE_RENDER_TYPE = 'geometricPrecision';
const STROKE_WIDTH = 1.7;

const WIDTH = 1320;
const LEFT_AXIS_WIDTH = 27;
const GRAPH_WIDTH = WIDTH - LEFT_AXIS_WIDTH;
const HEIGHT = 370;
const FULL_HEIGHT = HEIGHT * 2;

const BRUSH_HEIGHT = 75;
const BRUSH_INIT_DURATION = 5;

const Y_SCALE = HEIGHT / 17;
const HEIGHT_TRANSLATES = [HEIGHT / 2, HEIGHT / 2 * 3];

const xMap = (p: Point) => p.x;
const yMap = (p: Point) => p.y;

const PATTERN_ID = 'brush_pattern';
const SELECTED_BRUSH_STYLE = {
  fill: `url(#${PATTERN_ID})`,
  stroke: '#0000007b',
};

const BULLET_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  borderRadius: 50,
  backgroundColor: 'rgba(0,0,0,0)',
  border: 'none',
  cursor: 'pointer',
  outline: 'none',
};

export function DisplayEventsPage() {
  const navigate = useNavigate();
  const fileData = useGlobalStore(fileDataSelector);
  const transformedEvents = useMemo(() => (fileData ? fileData.events : []).map((e) => ({
    ...e,
    data: e.data.map((lead, leadIndex) => lead.map(p => ({
      x: p.x,
      y: p.y * Y_SCALE + HEIGHT_TRANSLATES[leadIndex],
    }))),
  })), [fileData]);

  useEffect(() => {
    if (fileData === undefined)
      navigate('/');
  }, [fileData]);

  if (fileData === undefined) return null;
  return (
    <div style={{ paddingTop: '2rem' }}>
      <DisplayEventsBody events={transformedEvents} />
      
      <Affix position={{ bottom: 20, right: 20 }}>
        <ActionIcon variant='filled' color='blue' size='lg' onClick={() => navigate('/')}>
          <HomeIcon width='18' />
        </ActionIcon>
      </Affix>
    </div>
  );
}

function DisplayEventsBody({ events }: { events: Event[] }) {
  const brushRef = useRef<BaseBrush | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bounds, setBounds] = useState<[number, number]>([0, BRUSH_INIT_DURATION]);
  const currEvent = useMemo(() => events[activeIndex], [activeIndex]);
  const boundedData = useMemo(() => {
    const [start, end] = bounds;
    const sliceStart = start * SAMPLING_RATE;
    const sliceEnd = end * SAMPLING_RATE;
    const slice = currEvent.data.map((lead) => lead.slice(sliceStart, sliceEnd));
    const xStep = GRAPH_WIDTH / slice[0].length;
    return slice.map(lead => lead.map((p, i) => ({ x: i * xStep, y: p.y })));
  }, [currEvent, bounds]);

  const xAxisScale = useMemo(() => (
    scaleLinear<number>({
      range: [0, GRAPH_WIDTH - 1],
      domain: bounds,
    })
  ), [bounds]);

  const xBrushAxisScale = useMemo(() => (
    scaleLinear<number>({
      range: [0, GRAPH_WIDTH - 1],
      domain: [0, currEvent.endSeconds - currEvent.startSeconds],
    })
  ), [currEvent]);

  const yBrushAxisScale = useMemo(() => (
    scaleLinear<number>({
      range: [0, BRUSH_HEIGHT],
      domain: [0, 8],
    })
  ), []);

  const initialBrushPosition = useMemo(() => ({
    start: { x: xBrushAxisScale(0) },
    end: { x: xBrushAxisScale(BRUSH_INIT_DURATION) },
  }), [xBrushAxisScale]);

  const onBrushChange = useCallback((domain: Bounds | null) => {
    if (!domain) return;
    const { x0, x1 } = domain;
    setBounds([Math.max(x0, 0), Math.min(x1, currEvent.endSeconds - currEvent.startSeconds)]);
  }, [currEvent]);

  const onEventChange = useCallback((i: number) => {
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
  }, [events]);

  return (
    <Group position='apart' align='flex-start' style={{ width: 1560, margin: '0 auto' }}>
      <Timeline color='orange' bulletSize={28}>
        {events.map((e, i) => (
          <Timeline.Item
            key={i}
            title={e.diagnosis.join(', ')}
            active={i === activeIndex}
            bullet={i !== activeIndex && <button style={BULLET_STYLE} onClick={() => onEventChange(i)} />}
          >
            <Text size='xs' color='dimmed'>{formatSeconds(e.startSeconds)} - {formatSeconds(e.endSeconds)}</Text>
          </Timeline.Item>
        ))}
      </Timeline>
      
      <div style={{ width: WIDTH }}>
        <div style={{ display: 'flex', userSelect: 'none' }}>
          <PlotLeadNames width={LEFT_AXIS_WIDTH} height={FULL_HEIGHT} names={LEAD_NAMES} />

          <svg width={GRAPH_WIDTH} height={FULL_HEIGHT}>
            <rect fill="#dee2e649" width='100%' height='100%' />
            <PlotSignalsBaseline count={2} />

            {boundedData.map((line, i) => (
              <LinePath
                key={`line-${i}`}
                fill='transparent'
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

        <svg width={GRAPH_WIDTH} height={BRUSH_HEIGHT} style={{ marginLeft: LEFT_AXIS_WIDTH, marginTop: 25 }} overflow='visible'>
          <rect fill="#dee2e634" width='100%' height='100%' />
          <PatternLines
            id={PATTERN_ID}
            height={8}
            width={8}
            stroke={PLOT_LINE_COLOR}
            strokeWidth={1}
            orientation={['diagonal']}
          />
          <Brush
            xScale={xBrushAxisScale}
            yScale={yBrushAxisScale}
            width={GRAPH_WIDTH}
            height={BRUSH_HEIGHT}
            handleSize={8}
            innerRef={brushRef}
            resizeTriggerAreas={['left', 'right']}
            brushDirection='horizontal'
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
        fill='#f2f2f2'
        d='M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12'
        stroke='#999999'
        strokeWidth='1'
        style={{ cursor: 'ew-resize' }}
      />
    </VisxGroup>
  );
}
