import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

import {
  completeFirstBoot,
  isFirstBoot,
  passwordExists,
  removePassword
} from '../../utils/auth';
import { getAutoLock } from '../../utils/autolock';
import { initDatabases } from '../database';

export interface LockscreenContextInterface {
  lockscreen: boolean;
  isLockscreenLoading: boolean;
  handleLockScreenClose: () => void;
  handleLockScreenClickOpen: () => void;
  handleSkipPassword: () => void;
  isInitialFlow: boolean;
  handleInitialFlowClose: () => void;
  handleInitialFlowOpen: () => void;
  autoLock: boolean;
  setAutoLock: (autoLock: boolean) => void;
  isDeviceConnected: boolean;
  isPasswordSet: boolean;
  setIsPasswordSet: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeviceConnected: () => void;
}

export const LockscreenContext: React.Context<LockscreenContextInterface> =
  React.createContext<LockscreenContextInterface>(
    {} as LockscreenContextInterface
  );

export const LockscreenProvider: React.FC = ({ children }) => {
  // Device Connected State -> If False means run the Configuration || true mean Device is connected already
  const [isDeviceConnected, setDeviceConnected] = useState(
    localStorage.getItem('initialFlow') === 'true'
  );
  const [isLockscreenLoading, setLockscreenLoading] = useState(true);
  const [lockscreen, setLockScreen] = useState(false);
  const [isInitialFlow, setInitialFlow] = useState(isFirstBoot());
  const [autoLock, setAutoLock] = useState(false);
  const [isPasswordSet, setIsPasswordSet] = useState(false);

  const lockscreenRef = useRef<boolean | null>(lockscreen);
  const isPasswordSetRef = useRef<boolean | null>(isPasswordSet);
  const autoLockRef = useRef<boolean | null>(autoLock);
  useEffect(() => {
    lockscreenRef.current = lockscreen;
  }, [lockscreen]);
  useEffect(() => {
    isPasswordSetRef.current = isPasswordSet;
  }, [isPasswordSet]);
  useEffect(() => {
    autoLockRef.current = autoLock;
  }, [autoLock]);

  const handleDeviceConnected = () => {
    localStorage.setItem('initialFlow', 'true');
    setDeviceConnected(true);
  };

  const onDesktopLock = () => {
    const val =
      !lockscreenRef.current && isPasswordSetRef.current && autoLockRef.current;
    if (val) {
      setLockScreen(true);
    }
  };

  const handleLockScreenClickOpen = () => {
    if (!lockscreen) {
      setLockScreen(true);
    }
  };

  useEffect(() => {
    ipcRenderer.on('lock-screen', onDesktopLock);

    return () => {
      ipcRenderer.removeListener('lock-screen', onDesktopLock);
    };
  }, []);

  useEffect(() => {
    setLockscreenLoading(true);
    const autoLockFlag = getAutoLock();
    setAutoLock(autoLockFlag);

    const hasPassword = passwordExists();
    if (!hasPassword) {
      setLockScreen(hasPassword);
    } else {
      setLockScreen(hasPassword);
    }
    initDatabases().then(() => {
      setLockscreenLoading(false);
      setIsPasswordSet(hasPassword);
    });
  }, []);

  const handleLockScreenClose = () => {
    setLockScreen(false);
  };

  const handleSkipPassword = () => {
    completeFirstBoot();
    removePassword();
    handleLockScreenClose();
    if (isInitialFlow) setInitialFlow(false);
  };

  const handleInitialFlowClose = () => {
    if (!passwordExists()) setLockScreen(false);
    setInitialFlow(false);
  };

  const handleInitialFlowOpen = () => {
    setInitialFlow(true);
  };

  return (
    <LockscreenContext.Provider
      value={{
        lockscreen,
        isLockscreenLoading,
        handleLockScreenClose,
        handleLockScreenClickOpen,
        handleSkipPassword,
        isInitialFlow,
        handleInitialFlowClose,
        handleInitialFlowOpen,
        autoLock,
        setAutoLock,
        isDeviceConnected,
        handleDeviceConnected,
        isPasswordSet,
        setIsPasswordSet
      }}
    >
      {children}
    </LockscreenContext.Provider>
  );
};

LockscreenProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useLockscreen(): LockscreenContextInterface {
  return React.useContext(LockscreenContext);
}
