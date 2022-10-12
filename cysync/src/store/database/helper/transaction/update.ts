import { transactionDb } from '../../databaseInit';

export const updateConfirmations = async (txn: any) => {
  if (!txn.hash) {
    return 0;
  }

  if (txn.coinType === 'eth' || txn.coinType === 'ethr') {
    transactionDb.findAndUpdate(
      { hash: txn.hash.toLowerCase() },
      {
        status: txn.isError ? 2 : 1,
        confirmations: txn.confirmations || 0
      }
    );

    return txn.confirmations || 0;
  } else if (txn.coinType === 'sol') {
    const confirmations = txn.err ? 0 : 1;
    transactionDb.findAndUpdate(
      { hash: txn.hash },
      {
        status: txn.err ? 2 : 1,
        confirmations
      }
    );
    return confirmations;
  } else {
    let status = 0;
    let hasConfirmation = false;

    if (
      txn.confirmations !== undefined &&
      txn.confirmations.confirmations !== null
    ) {
      hasConfirmation = true;
      if (txn.confirmations >= 1) {
        status = 1;
      }
    }

    if (hasConfirmation) {
      const updatedValues: any = { confirmations: txn.confirmations, status };
      if (txn.confirmed) {
        updatedValues.confirmed = new Date(txn.confirmed);
      }

      if (txn.block_height) {
        updatedValues.blockHeight = txn.block_height;
      }

      transactionDb.findAndUpdate({ hash: txn.hash }, updatedValues);
      return updatedValues.confirmations;
    } else if (txn.block_height) {
      const allTx = await transactionDb.getAll({ hash: txn.hash });
      if (allTx.length === 0) {
        return 0;
      }

      const transaction = allTx[0];
      if (
        transaction &&
        transaction.blockHeight &&
        transaction.blockHeight !== -1
      ) {
        const confirmations = txn.block_height - transaction.blockHeight + 1;
        transactionDb.findAndUpdate(
          { hash: txn.hash },
          { confirmations, status: confirmations >= 1 ? 1 : 0 }
        );
        return confirmations;
      }
    }
  }

  return 0;
};
