import PropTypes from 'prop-types';
import React from 'react';

export interface WalletConnectContextInterface {
  isOpen: boolean;
  openDialogBox: () => void;
  closeDialogBox: () => void;
}

export const WalletConnectContext: React.Context<WalletConnectContextInterface> =
  React.createContext<WalletConnectContextInterface>(
    {} as WalletConnectContextInterface
  );

export const WalletConnectProvider: React.FC = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const openDialogBox = () => {
    setIsOpen(true);
  };

  const closeDialogBox = () => {
    setIsOpen(false);
  };

  return (
    <WalletConnectContext.Provider
      value={{
        isOpen, //walletconect sdk here
        openDialogBox,
        closeDialogBox
      }}
    >
      {children}
    </WalletConnectContext.Provider>
  );
};

WalletConnectProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useWalletConnect(): WalletConnectContextInterface {
  return React.useContext(WalletConnectContext);
}
