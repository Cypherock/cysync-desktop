import { useRef } from 'react';

export type UseDebouncedFunctionTrigger = () => void;

export type UseDebouncedFunction = (
  handler: () => void,
  delay: number
) => UseDebouncedFunctionTrigger;

export const useDebouncedFunction: UseDebouncedFunction = (
  handler: () => void,
  delay: number
) => {
  const timer = useRef<NodeJS.Timeout | undefined>(undefined);

  const trigger: UseDebouncedFunctionTrigger = () => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      handler();
    }, delay);
  };

  return trigger;
};
