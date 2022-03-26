export interface SyncItemOptions {
  type: 'history' | 'price' | 'balance' | 'wallet-setup';
  coinType: string;
  module: string;
  isRefresh?: boolean;
}

export abstract class SyncItem {
  public type: SyncItemOptions['type'];

  public coinType: string;

  public isRefresh: boolean;

  public retries: number;

  public module: string;

  constructor({ type, coinType, module, isRefresh = false }: SyncItemOptions) {
    this.type = type;
    this.coinType = coinType;
    this.isRefresh = isRefresh;
    this.module = module;
    this.retries = 0;
  }
}
