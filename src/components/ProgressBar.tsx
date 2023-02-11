export interface ProgressBarProps {
  progress: number;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => (
  <div className='pb-container'>
    <p style={{ width: '5ch', textAlign: 'right' }}>{Math.floor(progress * 100)}%</p>
    <div className='pb-track'>
      <div className='pb-thumb' style={{ transform: `scaleX(${progress})` }} />
    </div>
  </div>
);

export default ProgressBar;
