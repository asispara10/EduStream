import React from "react";
import RelativeTime from "../RelativeTime.tsx";

interface TimeAgoProps {
  timestamp: string | Date;
}

const TimeAgo: React.FC<TimeAgoProps> = ({ timestamp }) => {
  return <RelativeTime timestamp={timestamp} />;
};

export default TimeAgo;
