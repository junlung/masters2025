import { useState, useEffect } from 'react';
import { Table, Text, Badge, Group, Paper, Title, Select, Loader, Center } from '@mantine/core';
import { Golfer, processGolferData } from './golferService'

interface BestGolfersByFamily {
  [key: string]: Golfer;
}

export const Leaderboard = () => {
  const [filterFamily, setFilterFamily] = useState<string>('All');
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await processGolferData();
        setGolfers(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch golfer data:', err);
        setError('Failed to load golfer data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Center style={{ height: 200 }}>
        <Loader size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ height: 200 }}>
        <Text color="red">{error}</Text>
      </Center>
    );
  }

  const familyMembers: string[] = ['All', ...Array.from(new Set(golfers.map(golfer => golfer.familyMember))).filter(member => member !== 'None')]
  
  // Format score with + for over par
  const formatScore = (score: number): string => {
    if (score === 0) return 'E';
    return score > 0 ? `+${score}` : score.toString();
  };
  
  // Get badge color based on score
  const getBadgeColor = (score: number): string => {
    if (score < 0) return 'green';
    if (score === 0) return 'blue';
    return 'red';
  };
  
  // Sort golfers by score (best to worst)
  const sortedGolfers: Golfer[] = [...golfers]
    .sort((a, b) => a.score - b.score)
    .filter(golfer => filterFamily === 'All' || golfer.familyMember === filterFamily);

  // Find best golfer for each family member
  const bestByFamily: BestGolfersByFamily = {};
  familyMembers.forEach(member => {
    if (member === 'All') return;
    
    const memberGolfers = golfers.filter(g => g.familyMember === member);
    if (memberGolfers.length > 0) {
      const best = memberGolfers.reduce((best, current) => 
        current.score < best.score ? current : best, memberGolfers[0]);
      bestByFamily[member] = best;
    }
  });

  // Find best golfer for today (lowest "today" score)
  const bestToday = [...golfers]
    .filter(golfer => golfer.today !== 0) // Only consider golfers who have played today
    .sort((a, b) => a.today - b.today)[0]; // Get the golfer with the lowest "today" score

  // Find best golfer for today from each family
  const bestTodayByFamily: BestGolfersByFamily = {};
  familyMembers.forEach(member => {
    if (member === 'All') return;
    
    const memberGolfers = golfers.filter(g => 
      g.familyMember === member && g.today !== 0
    );
    if (memberGolfers.length > 0) {
      const bestToday = memberGolfers.reduce((best, current) => 
        current.today < best.today ? current : best, memberGolfers[0]);
      bestTodayByFamily[member] = bestToday;
    }
  });
  
  return (
    <Paper p="md" radius="md" withBorder className="max-w-4xl mx-auto">
      <Group mb="md">
        <Title order={2}>Masters Leaderboard</Title>
        <Select
          label="Filter by family member"
          value={filterFamily}
          onOptionSubmit={(value: string) => setFilterFamily(value)}
          data={familyMembers}
          style={{ width: 200 }}
        />
      </Group>
      
      <Table striped>
        <thead>
          <tr>
            <th>Position</th>
            <th>Golfer</th>
            <th>Score</th>
            <th>Today</th>
            <th>Selected By</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedGolfers.map((golfer, index) => {
            const isBest = bestByFamily[golfer.familyMember]?.displayName === golfer.displayName;
            const isBestToday = bestTodayByFamily[golfer.familyMember]?.displayName === golfer.displayName;
            
            return (
              <tr key={golfer.displayName}>
                <td>{index + 1}</td>
                <td>
                  <Text fw={500}>{golfer.displayName}</Text>
                </td>
                <td>
                  <Badge 
                    color={getBadgeColor(golfer.score)} 
                    size="lg"
                  >
                    {formatScore(golfer.score)}
                  </Badge>
                </td>
                <td>
                  <Badge color={getBadgeColor(golfer.today)}>
                    {formatScore(golfer.today)}
                  </Badge>
                </td>
                {golfer.familyMember !== 'None' &&
                  <td>
                    {golfer.familyMember === 'Hunter' ? (
                      <Badge 
                        color="gray" 
                        variant="light"
                        styles={{
                          root: {
                            background: 'linear-gradient(90deg, #ff0000, #ff9900, #ffff00, #33cc33, #3399ff, #9966ff)',
                            color: 'white',
                            fontWeight: 'bold',
                            textShadow: '0px 0px 2px rgba(0,0,0,0.5)'
                          }
                        }}
                      >
                        {golfer.familyMember}
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="light">
                        {golfer.familyMember}
                      </Badge>
                    )}
                  </td>
                }
                <td>
                  <Group>
                    {isBest && (
                      <Badge color="yellow" variant="filled">
                        Best Overall
                      </Badge>
                    )}
                    {isBestToday && golfer.today !== 0 && (
                      <Badge color="cyan" variant="filled">
                        Best Today
                      </Badge>
                    )}
                  </Group>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      
      <Title order={4} mt="xl" mb="md">Current Leaders By Family Member</Title>
      <Table>
        <thead>
          <tr>
            <th>Family Member</th>
            <th>Best Golfer</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(bestByFamily)
            .sort((a, b) => a[1].score - b[1].score)
            .map(([member, golfer]) => (
              <tr key={member}>
                <td>
                  <Text fw={500}>{member}</Text>
                </td>
                <td>{golfer.displayName}</td>
                <td>
                  <Badge color={getBadgeColor(golfer.score)}>
                    {formatScore(golfer.score)}
                  </Badge>
                </td>
              </tr>
            ))}
        </tbody>
      </Table>

      <Title order={4} mt="xl" mb="md">Today's Leaders</Title>
      {bestToday && (
        <Group mb="md">
          <Badge size="xl" color={getBadgeColor(bestToday.today)}>
            Best Today: {bestToday.displayName} {formatScore(bestToday.today)}
          </Badge>
        </Group>
      )}

      <Table>
        <thead>
          <tr>
            <th>Family Member</th>
            <th>Best Golfer Today</th>
            <th>Today's Score</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(bestTodayByFamily)
            .sort((a, b) => a[1].today - b[1].today)
            .map(([member, golfer]) => (
              <tr key={member}>
                <td>
                  <Text fw={500}>{member}</Text>
                </td>
                <td>{golfer.displayName}</td>
                <td>
                  <Badge color={getBadgeColor(golfer.today)}>
                    {formatScore(golfer.today)}
                  </Badge>
                </td>
              </tr>
            ))}
        </tbody>
      </Table>
    </Paper>
  );
}