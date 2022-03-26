import { useState } from 'react';

export type UseDebouncedFunctionTrigger = () => void;

export type UseDebouncedFunction = (
  handler: () => void,
  delay: number
) => UseDebouncedFunctionTrigger;

export const useDebouncedFunction: UseDebouncedFunction = (
  handler: () => void,
  delay: number
) => {
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined);

  const trigger: UseDebouncedFunctionTrigger = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    setTimer(
      setTimeout(() => {
        handler();
      }, delay)
    );
  };

  return trigger;
};
