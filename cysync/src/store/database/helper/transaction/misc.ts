import { Status, Transaction } from '@cypherock/database';

import Analytics from '../../../../utils/analytics';
import { SentReceive } from '../../index';

export const convertToDisplayValue = (value: SentReceive) => {
  if (value === SentReceive.FEES) return 'Fees';
  if (value === SentReceive.SENT) return 'Sent';
  return 'Received';
};

export const convertTxnToAnalyticsItem = (txn: Transaction) => {
  return {
    txnHash: txn.hash,
    coin: txn.coin,
    slug: txn.slug,
    customIdentifier: Analytics.createHash(txn.customIdentifier),
    amount: txn.amount,
    fees: txn.fees,
    sentReceive: convertToDisplayValue(txn.sentReceive),
    status:
      txn.status === Status.FAILURE
        ? 'Failed'
        : txn.status === Status.PENDING
        ? 'Pending'
        : 'Success',
    walletId: Analytics.createHash(txn.walletId),
    confirmations: txn.confirmations
  };
};
