import { useModal } from '@ebay/nice-modal-react';
import { IntroModal } from './IntroModal';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function Timer({ showGameOver }) {
  const modal = useModal(IntroModal);
  const [isRunning, setIsRunning] = useState(false);

  const timerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let intervalId: number;
    let startTime = Date.now();
    console.log(startTime);
    let time = Date.now();
    if (isRunning) {
      // setting time from 0 to 1 every 10 milisecond using javascript setInterval method
      intervalId = setInterval(() => {
        time = Date.now() - startTime;
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
    if (showGameOver) {
      setIsRunning(false);
    }
  }, [showGameOver]);

  useLayoutEffect(() => {
    if (!modal.visible) {
      setIsRunning(true);
    }
  }, [modal.visible]);

  return <p ref={timerRef} className="stopwatch-time" />;
}
