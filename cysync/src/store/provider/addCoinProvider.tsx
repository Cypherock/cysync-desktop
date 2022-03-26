import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { useAddCoin, UseAddCoinValues } from '../hooks/flows/useAddCoin';

export interface AddCoinContextInterface {
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  coinAdder: UseAddCoinValues;
  addCoinFormOpen: boolean;
  setAddCoinFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isXpubMissing: boolean;
  setXpubMissing: React.Dispatch<React.SetStateAction<boolean>>;
  isAddCoinLoading: boolean;
  setIsAddCoinLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AddCoinContext: React.Context<AddCoinContextInterface> =
  React.createContext<AddCoinContextInterface>({} as AddCoinContextInterface);

export const AddCoinProvider: React.FC = ({ children }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isXpubMissing, setXpubMissing] = useState(false);
  const [addCoinFormOpen, setAddCoinFormOpen] = useState(false);
  const [isAddCoinLoading, setIsAddCoinLoading] = useState(false);

  const coinAdder = useAddCoin();

  return (
    <AddCoinContext.Provider
      value={{
        activeStep,
        setActiveStep,
        coinAdder,
        addCoinFormOpen,
        setAddCoinFormOpen,
        isXpubMissing,
        setXpubMissing,
        isAddCoinLoading,
        setIsAddCoinLoading
      }}
    >
      {children}
    </AddCoinContext.Provider>
  );
};

AddCoinProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useAddCoinContext(): AddCoinContextInterface {
  return React.useContext(AddCoinContext);
}
