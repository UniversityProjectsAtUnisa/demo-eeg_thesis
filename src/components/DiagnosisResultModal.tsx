import { Alert, Button, Group, Modal, Title } from "@mantine/core";
import { ExclamationTriangleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import useGlobalStore, { fileDataSelector } from "../globalState";

export interface DiagnosisResultModelProps {
  show: boolean;
}

export function DiagnosisResultModal({ show }: DiagnosisResultModelProps) {
  const { predictions } = useGlobalStore(fileDataSelector);

  return (
    <Modal title={<Title>Diagnosis result</Title>} opened={show} size={540} onClose={() => {}} withCloseButton={false}>
      {predictions.length > 0 ? <DangerBody /> : <RegularBody />}
    </Modal>
  );
}

function DangerBody() {
  const navigate = useNavigate();

  return (
    <>
      <Alert icon={<ExclamationTriangleIcon />} title={"An incoming seizure was detected!"} color="yellow">
        <></>
      </Alert>

      <Group position="right" mt="md">
        <Button size="sm" color="orange" onClick={() => navigate("/display-patterns")}>
          Display patterns
        </Button>
        <Button size="sm" color="gray" onClick={() => navigate("/")}>
          Load new sample
        </Button>
      </Group>
    </>
  );
}

function RegularBody() {
  const navigate = useNavigate();

  return (
    <>
      <Alert icon={<ShieldCheckIcon />} title={`Nothing found!`} color="green">
        No incoming seizures were detected
      </Alert>

      <Group position="right" mt="md">
        <Button size="sm" color="gray" onClick={() => navigate("/")}>
          Load new sample
        </Button>
      </Group>
    </>
  );
}

export default DiagnosisResultModal;
