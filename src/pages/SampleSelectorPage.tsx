import { useCallback, useState } from 'react';
import { Container, Group, Text, Title } from '@mantine/core';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { ArrowUpTrayIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useGlobalStore, { loadFileSelector } from '../globalState';
import { useNavigate } from 'react-router-dom';
import { UnisaHeader } from '../components';

export function SampleSelectorPage() {
  const [loading, setLoading] = useState(false);
  const loadFile = useGlobalStore(loadFileSelector);
  const navigate = useNavigate();

  const onFileDrop = useCallback(async (files: FileWithPath[]) => {
    setLoading(true);
    const f = files[0];
    try {
      await loadFile(f);
      navigate('/demonstrator');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <UnisaHeader height={60} />

      <Container size='md'>
        <Title style={{ marginBottom: 45 }} mt='xl'>ECG arrhythmia detection demo</Title>
        <Dropzone
          multiple={false}
          onDrop={onFileDrop}
          loading={loading}
        >
          <Group position='center' spacing='xl' style={{ minHeight: 550, pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <ArrowUpTrayIcon width='50' color='#1864ab' />
            </Dropzone.Accept>

            <Dropzone.Reject>
              <XMarkIcon width='50' color='#c92a2a' />
            </Dropzone.Reject>
            
            <Dropzone.Idle>
              <DocumentIcon width='50' color='#343a40' />
            </Dropzone.Idle>

            <div>
              <Text size='xl' inline>
                Drag ECG sample file here or click to select the file
              </Text>
              <Text size='sm' color='dimmed' inline mt={7}>
                Attach one json file. The file must contain an Holter ECG recording with lead I and V1
              </Text>
            </div>
          </Group>
        </Dropzone>
      </Container>
    </>
  );
}

export default SampleSelectorPage;
