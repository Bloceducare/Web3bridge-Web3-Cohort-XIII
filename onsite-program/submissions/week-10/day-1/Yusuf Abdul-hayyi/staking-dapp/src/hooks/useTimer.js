import { useState, useEffect } from "react";

export default function useTimer(targetTimestamp) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const diff = targetTimestamp * 1000 - Date.now();
      setTimeLeft(diff > 0 ? diff : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp]);

  return timeLeft;
}
