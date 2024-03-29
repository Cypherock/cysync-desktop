import { AlertProps } from '@mui/lab';
import PropTypes from 'prop-types';
import React from 'react';

import CustomSnackbar from '../../designSystem/genericComponents/CustomSnackbar';

interface SnackbarData {
  text: string;
  severity: AlertProps['severity'];
  handleClose?: () => void;
  options?: {
    dontCloseOnClickAway?: boolean;
    autoHideDuration?: number;
  };
}

type ShowSnackbar = (
  text: SnackbarData['text'],
  severity: SnackbarData['severity'],
  handleClose?: SnackbarData['handleClose'],
  options?: SnackbarData['options']
) => void;

export interface SnackbarContextInterface {
  showSnackbar: ShowSnackbar;
}

export const SnackbarContext: React.Context<SnackbarContextInterface> =
  React.createContext<SnackbarContextInterface>({} as SnackbarContextInterface);

export const SnackbarProvider: React.FC = ({ children }) => {
  const [snackbarData, setSnackbarData] = React.useState<
    SnackbarData | undefined
  >();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCloseCooldown, setIsCloseCooldown] = React.useState(false);
  const cooldownTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const showSnackbar: ShowSnackbar = (
    text,
    severity,
    _handleClose,
    options
  ) => {
    setSnackbarData({
      text,
      severity,
      handleClose: _handleClose,
      options
    });

    setIsCloseCooldown(true);
    if (cooldownTimeout.current) {
      clearTimeout(cooldownTimeout.current);
    }
    cooldownTimeout.current = setTimeout(() => {
      setIsCloseCooldown(false);
    }, 500);

    setIsOpen(true);
  };

  const handleClose = (_event?: React.SyntheticEvent, reason?: string) => {
    if (snackbarData) {
      if (
        snackbarData.options &&
        snackbarData.options.dontCloseOnClickAway &&
        reason === 'clickaway'
      ) {
        return;
      }

      if (!isCloseCooldown) {
        setIsOpen(false);
      }

      if (snackbarData.handleClose) {
        snackbarData.handleClose();
      }
    }
  };

  return (
    <>
      <SnackbarContext.Provider value={{ showSnackbar }}>
        {children}
      </SnackbarContext.Provider>
      {snackbarData && (
        <CustomSnackbar
          text={snackbarData.text}
          open={isOpen}
          severity={snackbarData.severity}
          handleClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          autoHideDuration={
            snackbarData.options
              ? snackbarData.options.autoHideDuration
              : undefined
          }
        />
      )}
    </>
  );
};

SnackbarProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useSnackbar(): SnackbarContextInterface {
  return React.useContext(SnackbarContext);
}
