import { Alert, Button, Group, List, Modal, Title } from '@mantine/core';
import { ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { DISEASES_NAME_MAP } from '../settings';
import useGlobalStore, { fileDataSelector } from '../globalState';
import { useMemo } from 'react';

export interface DiagnosisResultModelProps {
  show: boolean;
}

export function DiagnosisResultModal({ show }: DiagnosisResultModelProps) {
  const { events } = useGlobalStore(fileDataSelector);
  const found = useMemo(() => {
    return [...new Set(events.flatMap(e => e.diagnosis))];
  }, [events]);

  return (
    <Modal title={<Title>Diagnosis result</Title>} opened={show} size={540} onClose={()=>{}} withCloseButton={false}>
      {found.length > 0 ? <DangerBody found={found} /> : <RegularBody />}
    </Modal>
  );
}

function DangerBody({ found }: { found: string[] }) {
  const navigate = useNavigate();

  return (
    <>
      <Alert icon={<ExclamationTriangleIcon />} title={`${found.length} arrhythmia found!`} color='yellow'>
        <List>
          {found.map(d => <List.Item key={d}>{DISEASES_NAME_MAP[d]}</List.Item>)}
        </List>
      </Alert>

      <Group position='right' mt='md'>
        <Button size='sm' color='orange' onClick={() => navigate('/display-events')}>Display events</Button>
        <Button size='sm' color='gray' onClick={() => navigate('/')}>Load new sample</Button>
      </Group>
    </>
  );
}

function RegularBody() {
  const navigate = useNavigate();

  return (
    <>
      <Alert icon={<ShieldCheckIcon />} title={`Nothing found!`} color='green'>
        No irregular patterns were detected
      </Alert>

      <Group position='right' mt='md'>
        <Button size='sm' color='gray' onClick={() => navigate('/')}>Load new sample</Button>
      </Group>
    </>
  );
}

export default DiagnosisResultModal;
