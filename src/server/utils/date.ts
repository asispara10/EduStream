export const getNepalISOString = () => {
  const now = new Date();
  // Nepal is UTC+5:45
  const offsetMinutes = 5 * 60 + 45;
  const nepalTime = new Date(now.getTime() + (offsetMinutes * 60 * 1000));
  
  // Format to ISO-like string but with +05:45
  const iso = nepalTime.toISOString(); // This is still Z
  return iso.replace('Z', '+05:45');
};

export const formatNepalTime = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).replace(',', ' •');
};
