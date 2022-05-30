import { transactionDb } from '../../databaseInit';
import { SentReceive, Status } from '../../index';

export interface TxQuery {
  hash?: string;
  walletId?: string;
  walletName?: string;
  slug?: string;
  coin?: string;
  sentReceive?: SentReceive;
  status?: Status;
}
export interface TxQueryOptions {
  excludeFees?: boolean;
  excludeFailed?: boolean;
  excludePending?: boolean;
  sinceDate?: Date;
  minConfirmations?: number;
}

/**
 * Gets all transactions from the local database.
 *
 * @return promise that resolves to a list of transactions
 */
export const getAllTxns = async (
  query: TxQuery,
  options?: TxQueryOptions,
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
    limit?: number;
  }
) => {
  let dbQuery: any = {};
  let innerQuery: any = {};
  const andQuery: any = [];

  if (options) {
    if (options.excludeFees) {
      delete options.excludeFees;
      andQuery.push({ $not: { sentReceive: 'FEES' } });
    }

    if (options.excludeFailed) {
      delete options.excludeFailed;
      andQuery.push({ $not: { status: 2 } });
    }

    if (options.excludePending) {
      delete options.excludePending;
      andQuery.push({ $not: { status: 0 } });
    }

    if (options.sinceDate) {
      innerQuery.confirmed = { $gt: options.sinceDate };
      delete options.sinceDate;
    }

    if (options.minConfirmations) {
      innerQuery.confirmations = { $gte: options.minConfirmations };
      delete options.minConfirmations;
    }
  }
  innerQuery = { ...innerQuery, ...query };
  // Sort field must be a part of the selector
  if (sorting?.field) innerQuery[sorting.field] = { $gte: null };

  if (andQuery.length > 0) {
    andQuery.push({ ...innerQuery });
    dbQuery.$and = andQuery;
  } else {
    dbQuery = { ...innerQuery };
  }

  return transactionDb.executeQuery(dbQuery, sorting);
};

export const getTopBlock = async (query: TxQuery, options: TxQueryOptions) => {
  const res = await getAllTxns(query, options, {
    field: 'blockHeight',
    order: 'desc',
    limit: 1
  });
  if (res.length === 0) return undefined;
  // return max block height
  return res[0].blockHeight;
};
