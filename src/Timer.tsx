import { useModal } from '@ebay/nice-modal-react';
import { IntroModal } from './IntroModal';
import { useEffect, useRef, useState } from 'react';

export function Timer({ gameRunning, isPaused }) {
  const modal = useModal(IntroModal);
  const [isRunning, setIsRunning] = useState(false);
  const startTime = useRef(Date.now());

  const timerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let intervalId: number;
    if (isRunning) {
      // setting time from 0 to 1 every 10 milisecond using javascript setInterval method
      intervalId = setInterval(() => {
        const time = Date.now() - startTime.current;
        const hours = Math.floor(time / 3600000);
        const minutes = Math.floor((time % 3600000) / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const milliseconds = time % 1000;

        if (timerRef.current) {
          timerRef.current.textContent = `${hours}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds
              .toString()
              .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
        }
      }, 10);
    }
    return () => clearInterval(intervalId);
  }, [isRunning]);

  useEffect(() => {
    setIsRunning(gameRunning);
  }, [gameRunning]);

  return (
    <p ref={timerRef} className="stopwatch-time">
      0:00:00.000
    </p>
  );
}
