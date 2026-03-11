export const formatExactTimestamp = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  const formatted = date.toLocaleString("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).replace(',', ' •');
  return `${formatted} (NPT)`;
};
