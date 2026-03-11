import React, { useState, useEffect } from "react";

interface RelativeTimeProps {
  timestamp: string | Date;
  className?: string;
}

const RelativeTime: React.FC<RelativeTimeProps> = ({ timestamp, className = "" }) => {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    const calculateRelativeTime = () => {
      const now = new Date();
      const past = new Date(timestamp);
      const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

      if (diffInSeconds < 5) {
        setRelativeTime("Just now");
      } else if (diffInSeconds < 60) {
        setRelativeTime(`${diffInSeconds} seconds ago`);
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setRelativeTime(`${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setRelativeTime(`${hours} ${hours === 1 ? "hour" : "hours"} ago`);
      } else {
        // For older dates, use a formatted string
        setRelativeTime(past.toLocaleString("en-US", {
          timeZone: "Asia/Kathmandu",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        }));
      }
    };

    calculateRelativeTime();
    const interval = setInterval(calculateRelativeTime, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return <span className={className}>{relativeTime}</span>;
};

export default RelativeTime;
