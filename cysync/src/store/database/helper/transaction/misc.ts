import { SentReceive } from '../../index';

export const convertToDisplayValue = (value: SentReceive) => {
  if (value === SentReceive.FEES) return 'Fee';
  if (value === SentReceive.SENT) return 'Sent';
  return 'Received';
};
