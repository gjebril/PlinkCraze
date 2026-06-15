import HistoryDisplay, { type HistoryItem as SharedHistoryItem } from '../../shared/components/panels/HistoryDisplay';
import { HistoryItem } from '../hooks/useGameHistory';

interface DiceHistoryDisplayProps {
  history: HistoryItem[];
}

function DiceHistoryDisplay({ history }: DiceHistoryDisplayProps) {
  const formatter = (item: SharedHistoryItem): string => {
    if (item.type === 'dice') {
      return item.result.toFixed(2);
    }
    return '0.00';
  };

  const keyGenerator = (item: SharedHistoryItem): string => {
    if (item.type === 'dice') {
      return `${item.timestamp}-${item.result}`;
    }
    return `${item.timestamp}-0`;
  };

  const sharedHistory: SharedHistoryItem[] = history.map((item) => ({
    type: 'dice' as const,
    betId: item.betId,
    result: item.result,
    diceValue: item.diceValue,
    direction: item.direction,
    isWin: item.isWin,
    timestamp: item.timestamp,
  }));

  return <HistoryDisplay history={sharedHistory} formatter={formatter} keyGenerator={keyGenerator} />;
}

export default DiceHistoryDisplay;
