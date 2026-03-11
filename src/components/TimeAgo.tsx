import React from 'react';
import { formatExactTimestamp } from '../utils/date.ts';

interface TimeAgoProps {
  timestamp: string | Date;
}

const TimeAgo: React.FC<TimeAgoProps> = ({ timestamp }) => {
  return <span>{formatExactTimestamp(timestamp)}</span>;
};

export default TimeAgo;
