import { Container, Group, Text } from '@mantine/core';
import LogoUnisa from '../assets/LogoUnisa';

export interface UnisaHeaderProps {
  height?: number;
}

export function UnisaHeader({ height=50 }: UnisaHeaderProps) {
  return (
    <div style={{ backgroundColor: '#f90', boxShadow: '0 2px 8px' }}>
      <Container size='md'>
        <Group align='center' style={{ height }}>
          <LogoUnisa />
          <Text color='white'weight='bold' style={{ textShadow: '0px 1px 2px #000000a0' }}>Università degli Studi di Salerno</Text>
        </Group>
      </Container>
    </div>
  );
}
