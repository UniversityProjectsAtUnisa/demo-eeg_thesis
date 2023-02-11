import { AxisBottom, AxisScale } from '@visx/axis';
import { useMemo } from 'react';
import { formatSeconds } from '../utils';

const Y_TICKS_STYLE = { transform: 'translateY(3px)', fontWeight: 600 };
export function PlotLeadNames({ width, height, names }: { width: number, height: number, names: string[] }) {
  const [startY, dist] = useMemo(() => {
    const dist = height / names.length;
    const startY = dist / 2;
    return [startY, dist];
  }, [height]);
  
  return (
    <svg width={width} height={height}>
      {names.map((n, i) => (
        <text key={n} x='0' y={startY + dist * i} style={Y_TICKS_STYLE}>{n}</text>
      ))}
    </svg>
  );
}

const AXIS_COLOR = '#000000';
export function PlotTimeAxis({ top, left, scale }: { top: number, left: number, scale: AxisScale<number> }) {
  const width = scale.range()[1];
  return (
    <svg width={width} height={20} overflow='visible' style={{ userSelect: 'none' }}>
      <AxisBottom
        top={top}
        left={left + 1}
        scale={scale}
        numTicks={6}
        stroke={AXIS_COLOR}
        tickStroke={AXIS_COLOR}
        tickFormat={formatSeconds}
      />
    </svg>
  );
}

export function PlotSignalsBaseline({ count }: { count: number }) {
  const yArray = useMemo(() => {
    const dist = 100 / count;
    const startY = dist / 2;
    return [...Array(count).keys()].map(i => `${startY + dist * i}%`);
  }, [count]);

  return (
    <>{yArray.map(y => <line key={y} x1='0' x2='100%' y1={y} y2={y} stroke='#00000022' strokeWidth={2} />)}</>
  );
}
