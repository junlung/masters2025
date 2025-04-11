import axios from 'axios';
import picks from './data.json'

export interface Golfer {
  displayName: string;
  familyMember: string;
  score: number; // Keep as number for easier sorting
  today: number;
  position: string;
}

const fetchGolfScores = async () => {
  try {
    const response = await axios.get('https://www.masters.com/en_US/scores/feeds/2025/scores.json');
    console.log(response.data)
    return response.data.data;
  } catch (error) {
    console.error('Error fetching golf scores:', error);
    throw error;
  }
};

// Helper function to parse score values
const parseScore = (scoreValue: string): number => {
  if (!scoreValue) return 0;
  if (scoreValue === 'E') return 0;
  return parseInt(scoreValue);
};

export const processGolferData = async (): Promise<Golfer[]> => {
  try {
    const data = await fetchGolfScores();
    
    // Assuming the API returns an array of players in data.players
    const golfers: Golfer[] = data.player.map((player: any) => {
      // Find matching golfer in picks data
      const matchedGolfer = picks.picks.find((pick) => 
        pick.name.toLowerCase() === player.display_name.toLowerCase()
      );
      
      return {
        displayName: player.display_name,
        familyMember: matchedGolfer ? matchedGolfer.family : 'None',
        score: parseScore(player.topar),
        today: parseScore(player.today),
        position: player.position || 'N/A'
      };
    });
    
    return golfers;
  } catch (error) {
    console.error('Error processing golfer data:', error);
    throw error;
  }
};