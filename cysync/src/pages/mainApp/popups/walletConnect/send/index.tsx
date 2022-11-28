import React, { useEffect, useState } from 'react';

import { useSendTransaction } from '../../../../../store/hooks/flows';
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
      walletConnect.callRequestId &&
      (
        [
          WalletConnectCallRequestMethodMap.ETH_SEND_TXN,
          WalletConnectCallRequestMethodMap.ETH_SIGN_TXN
        ] as WalletConnectCallRequestMethod[]
      ).includes(walletConnect.callRequestMethod)
    );

    if (sendForm !== isOpen) {
      setSendForm(isOpen);
    }
  }, [walletConnect]);

  if (
    walletConnect.selectedWallet &&
    walletConnect.selectedAccount &&
    walletConnect.callRequestParams &&
    walletConnect.callRequestId &&
    walletConnect.callRequestMethod &&
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
          key={walletConnect.selectedAccount.slug}
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
                walletConnect.callRequestMethod ===
                WalletConnectCallRequestMethodMap.ETH_SEND_TXN
                  ? 'hash'
                  : 'signature'
              }
              onSuccess={onSuccess}
              onReject={onReject}
              txnParams={walletConnect.callRequestParams[0]}
            />
          </SendTransactionContext.Provider>
        </CurrentCoinContext.Provider>
      </SelectedWalletContext.Provider>
    );
  }

  return <></>;
};

export default WalletConnectSign;
