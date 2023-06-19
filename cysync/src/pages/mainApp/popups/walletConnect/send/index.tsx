import React, { useEffect, useState } from 'react';

import {
  TriggeredBy,
  useSendTransaction
} from '../../../../../store/hooks/flows';
import {
  CurrentCoinContext,
  SelectedWalletContext,
  SendTransactionContext,
  useWalletConnect,
  WalletConnectCallRequestMethod,
  WalletConnectCallRequestMethodMap,
  WalletConnectConnectionState
} from '../../../../../store/provider';
import Send from '../../../sidebar/wallet/send';

const WalletConnectSign = () => {
  const walletConnect = useWalletConnect();
  const [sendForm, setSendForm] = useState(false);
  const sendTransaction = useSendTransaction();

  const onSuccess = (result: string) => {
    walletConnect.approveCallRequest(result);
  };

  const onReject = (message?: string) => {
    walletConnect.rejectCallRequest(message);
  };

  useEffect(() => {
    const isOpen = !!(
      walletConnect.connectionState ===
        WalletConnectConnectionState.CONNECTED &&
      walletConnect.callRequestData &&
      (
        [
          WalletConnectCallRequestMethodMap.ETH_SEND_TXN,
          WalletConnectCallRequestMethodMap.ETH_SIGN_TXN
        ] as WalletConnectCallRequestMethod[]
      ).includes(walletConnect.callRequestData.method)
    );

    if (sendForm !== isOpen) {
      setSendForm(isOpen);
    }
  }, [walletConnect]);

  const txnData = React.useMemo(() => {
    if (!walletConnect.callRequestData?.params) return undefined;

    const txnParams = walletConnect.callRequestData?.params[0];
    if (typeof txnParams === 'object') {
      txnParams.gas = txnParams.gas ?? txnParams.gasLimit;
      delete txnParams.gasLimit;
    }
    return txnParams;
  }, [walletConnect.callRequestData]);

  if (
    walletConnect.selectedWallet &&
    walletConnect.selectedAccount &&
    walletConnect.callRequestData &&
    sendForm
  ) {
    return (
      <SelectedWalletContext.Provider
        value={{
          selectedWallet: walletConnect.selectedWallet
        }}
      >
        <CurrentCoinContext.Provider
          value={{ coinDetails: walletConnect.selectedAccount }}
          key={walletConnect.selectedAccount.coinId}
        >
          <SendTransactionContext.Provider
            value={{
              sendForm,
              setSendForm,
              sendTransaction
            }}
          >
            <Send
              resultType={
                walletConnect.callRequestData.method ===
                WalletConnectCallRequestMethodMap.ETH_SEND_TXN
                  ? 'hash'
                  : 'signed'
              }
              triggeredBy={TriggeredBy.WalletConnect}
              onSuccess={onSuccess}
              onReject={onReject}
              txnParams={txnData}
            />
          </SendTransactionContext.Provider>
        </CurrentCoinContext.Provider>
      </SelectedWalletContext.Provider>
    );
  }

  return <></>;
};

export default WalletConnectSign;
