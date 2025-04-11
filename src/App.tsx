import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { Leaderboard } from './Leaderboard.tsx';

export default function App() {
  return <MantineProvider>
    <Leaderboard />
  </MantineProvider>;
}