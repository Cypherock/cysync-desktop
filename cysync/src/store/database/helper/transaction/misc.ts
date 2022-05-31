import { SentReceive } from '../../index';

export const convertToDisplayValue = (value: SentReceive) => {
  if (value === SentReceive.FEES) return 'Fees';
  if (value === SentReceive.SENT) return 'Sent';
  return 'Received';
};
