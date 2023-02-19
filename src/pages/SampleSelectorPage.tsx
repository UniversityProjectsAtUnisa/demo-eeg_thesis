import { useCallback, useState } from "react";
import { Container, Group, Text, Title } from "@mantine/core";
import { Dropzone, FileWithPath } from "@mantine/dropzone";
import { ArrowUpTrayIcon, DocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import useGlobalStore, { loadFileSelector } from "../globalState";
import { useNavigate } from "react-router-dom";
import { UnisaHeader } from "../components";

export function SampleSelectorPage() {
  const [loading, setLoading] = useState(false);
  const loadFile = useGlobalStore(loadFileSelector);
  const navigate = useNavigate();

  const onFileDrop = useCallback(async (files: FileWithPath[]) => {
    setLoading(true);
    const f = files[0];

    try {
      await loadFile(f);
      navigate("/demonstrator");
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <UnisaHeader height={60} />

      <Container size="md">
        <Title style={{ marginBottom: 45 }} mt="xl">
          EEG seizure prediction demo
        </Title>
        <Dropzone
          multiple={false}
          onDrop={onFileDrop}
          loading={loading}
          accept={{
            "application/json": [],
          }}
        >
          <Group position="center" spacing="xl" style={{ minHeight: 550, pointerEvents: "none" }}>
            <Dropzone.Accept>
              <ArrowUpTrayIcon width="50" color="#1864ab" />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <XMarkIcon width="50" color="#c92a2a" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <DocumentIcon width="50" color="#343a40" />
            </Dropzone.Idle>
            <div>
              <Text size="xl" inline>
                Drag EEG sample file here or click to select the file
              </Text>
              <Text size="sm" color="dimmed" inline mt={7}>
                Attach one json file.
              </Text>
            </div>
          </Group>
        </Dropzone>
      </Container>
    </>
  );
}

export default SampleSelectorPage;
