import PropTypes from 'prop-types';
import React, { useState } from 'react';

export interface DiscreetModeContextInterface {
  enabled: boolean;
  setEnabled: (val: boolean) => void;
  toggle: () => void;
  handleSensitiveDataDisplay: (data: string) => string;
}

export const DiscreetModeContext: React.Context<DiscreetModeContextInterface> =
  React.createContext<DiscreetModeContextInterface>(
    {} as DiscreetModeContextInterface
  );

export const DiscreetModeProvider: React.FC = ({ children }) => {
  const [enabled, setEnabled] = useState(false);

  const toggle = () => {
    setEnabled(e => !e);
  };

  const handleSensitiveDataDisplay = (data: string) => {
    if (enabled) {
      return '****';
    }

    return data;
  };

  return (
    <DiscreetModeContext.Provider
      value={{
        enabled,
        setEnabled,
        toggle,
        handleSensitiveDataDisplay
      }}
    >
      {children}
    </DiscreetModeContext.Provider>
  );
};

DiscreetModeProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useDiscreetMode(): DiscreetModeContextInterface {
  return React.useContext(DiscreetModeContext);
}
