interface Diagnosis {
  threshold: number;
  prob: number;
  disease: string;
}

export interface DiagnosisProbsProps {
  width: number;
  diagnosis: Diagnosis[];
}

export function DiagnosisProbs({ width, diagnosis }: DiagnosisProbsProps) {
  return (
    <div style={{ display: 'flex', gap: 40, height: '100%' }}>
      <div className='bar-axis'>
        <div className='bar-axis-tick' style={{ marginTop: -8 }}>
          <p>1.0</p>
          <div className='bar-axis-line' />
        </div>
        <div className='bar-axis-tick'>
          <p>0.5</p>
          <div className='bar-axis-line' />
        </div>
        <div className='bar-axis-tick' style={{ marginBottom: -8 }}>
          <p>0.0</p>
          <div className='bar-axis-line' />
        </div>
      </div>
      <div className='probs-container' style={{ width }}>
        {diagnosis.map(d => <Bar key={d.disease} {...d} />)}
      </div>
    </div>
  );
}

const getBarColor = (th: number, p: number, name: string) => p >= th ? (name !== 'SR' ? '#C92A2A' : '#087f5b') : '#838383';
const Bar = ({ disease, threshold, prob }: Diagnosis) => (
  <div className='single-prob-container'>
    <div className='prob-bar'>
      <div className='filled-bar' style={{ transform: `scaleY(${prob})`, backgroundColor: getBarColor(threshold, prob, disease) }} />
      <hr className='th-line' style={{ bottom: `${threshold * 100}%` }} />
    </div>
    <p>{disease}</p>
  </div>
);

export default DiagnosisProbs;
