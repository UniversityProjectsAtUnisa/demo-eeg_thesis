import { Line } from './globalState';

export const emptyPromise = () => new Promise(r=>r(null));

export function segmentsTransform(sampleSegments: Line[][], xScale: number, yScale: number, yTranslate: number) {
  return sampleSegments.map(seg => seg.map(lead => lead.map(p => ({
    x: p.x * xScale,
    y: p.y * yScale + yTranslate,
  }))));
}

export async function normalizeSegments(sampleSegments: number[][][]) {
  const leadCount = sampleSegments[0].length;
  const leadsTot = new Array(leadCount).fill(0);
  let n = 0;

  // Compute mean for each lead
  for (let segIndex=0; segIndex < sampleSegments.length; segIndex++) {
    for (let leadIndex=0; leadIndex < leadCount; leadIndex++) {
      const leadData = sampleSegments[segIndex][leadIndex];
      for (let i=0; i < leadData.length; i++) {
        leadsTot[leadIndex] += leadData[i];
        n++;
      }
    }
    await emptyPromise();  // free js (avoid ui freeze)
  }
  if (n % leadCount !== 0) throw `Invalid n counter in function "normalize"`;
  n /= leadCount;
  const means = leadsTot.map(tot => tot / n);

  // Compute standard deviation for each lead
  const accumulator = new Array(leadCount).fill(0);
  for (let segIndex=0; segIndex < sampleSegments.length; segIndex++) {
    for (let leadIndex=0; leadIndex < leadCount; leadIndex++) {
      const leadData = sampleSegments[segIndex][leadIndex];
      for (let i=0; i < leadData.length; i++) {
        accumulator[leadIndex] += Math.pow(leadData[i] - means[leadIndex], 2);
      }
    }
    await emptyPromise();  // free js (avoid ui freeze)
  }
  const stds = accumulator.map(a => Math.sqrt(a / n));

  return sampleSegments.map(seg => seg.map((lead, leadIndex) => {
    const mu = means[leadIndex];
    const std = stds[leadIndex];
    return lead.map(val => (val - mu) / std);
  }));
}

export const padNumber = (n: number, l: number) => (''+n).padStart(l, '0');
export const formatSeconds = (s: number) => `${padNumber(Math.floor(s / 60), 2)}:${padNumber(Math.round(s) % 60, 2)}`;
