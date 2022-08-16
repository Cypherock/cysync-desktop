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
      andQuery.push({ $not: { sentReceive: SentReceive.FEES } });
    }

    if (options.excludeFailed) {
      delete options.excludeFailed;
      andQuery.push({ $not: { status: Status.FAILURE } });
    }

    if (options.excludePending) {
      delete options.excludePending;
      andQuery.push({ $not: { status: Status.PENDING } });
    }

    // Omitting Discarded Txns by default
    andQuery.push({ $not: { status: Status.DISCARDED } });

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
  if (!innerQuery.confirmed && sorting?.field) {
    innerQuery[sorting.field] = { $gte: null };
  }

  if (andQuery.length > 0) {
    for (const queryKey of Object.keys(innerQuery)) {
      andQuery.push({ [queryKey]: innerQuery[queryKey] });
    }
    dbQuery.$and = andQuery;
  } else {
    dbQuery = { ...innerQuery };
  }

  const data = await transactionDb.executeQuery(dbQuery, sorting);

  return data;
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
