import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DISEASES_NAME_MAP, DISEASES_DESC_MAP } from '../settings';

export interface CurrentDiagnosisProps {
  diagnosis: { disease: string, active: boolean }[];
}

export function CurrentDiagnosis({ diagnosis }: CurrentDiagnosisProps) {
  return (
    <div>
      <h3 style={{ marginBottom: 10 }}>Current Diagnosis</h3>
      <Group spacing='xs'>
        {diagnosis.map(d => (
          <ClassStatus key={d.disease} name={d.disease} active={d.active} />
        ))}
      </Group>
    </div>
  );
}

const getClassName = (a: boolean, name: string) => a ? (name !== 'SR' ? 'red-glow' : 'green-glow') : '';

function ClassStatus({ name, active }: { name: string, active: boolean }) {
  const [opened, handlers] = useDisclosure(false);

  return (
    <>
      <Stack align='center' spacing='xs' style={{ width: 53 }}>
        <Button variant='subtle' compact onClick={handlers.open} title='show description' color='dark'>
          <p style={{ color: 'black' }}>{name}</p>
        </Button>
        <div
          className={getClassName(active, name)}
          style={{ width: 30, height: 30, borderRadius: 20, backgroundColor: '#838383' }}
        />
      </Stack>
  
      <Modal title={<h3>{DISEASES_NAME_MAP[name]}</h3>} opened={opened} onClose={handlers.close} size={'60ch'} padding='xl'>
        <hr />
        <Text mt='sm' style={{ fontSize: 15 }}>{DISEASES_DESC_MAP[name]}</Text>

        <Button size='sm' style={{ width: '100%' }} color='gray' mt='md' onClick={handlers.close}>Close</Button>
      </Modal>
    </>
  );
}

export default CurrentDiagnosis;
