import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import {
  completeFirstBoot,
  isFirstBoot,
  passwordExists,
  removePassword
} from '../../utils/auth';
import { getAutolockTime } from '../../utils/autolock';

export interface LockscreenContextInterface {
  lockscreen: boolean;
  isLockscreenLoading: boolean;
  handleLockScreenClose: () => void;
  handleLockScreenClickOpen: () => void;
  handleSkipPassword: () => void;
  isInitialFlow: boolean;
  handleInitialFlowClose: () => void;
  handleInitialFlowOpen: () => void;
  autolockTime: number;
  showIdleTimer: boolean;
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
  const [autolockTime, setAutolockTime] = useState(-1);
  const [showIdleTimer, setShowIdleTimer] = useState(false);
  const [isPasswordSet, setIsPasswordSet] = useState(false);

  const handleDeviceConnected = () => {
    localStorage.setItem('initialFlow', 'true');
    setDeviceConnected(true);
  };

  useEffect(() => {
    const val = !lockscreen && isPasswordSet && autolockTime !== -1;
    if (val !== showIdleTimer) {
      setShowIdleTimer(val);
    }
  }, [lockscreen, isPasswordSet, autolockTime]);

  useEffect(() => {
    setLockscreenLoading(true);
    const time = getAutolockTime();
    setAutolockTime(time);

    const hasPassword = passwordExists();
    if (!hasPassword) {
      setLockScreen(hasPassword);
    } else {
      setLockScreen(hasPassword);
    }
    setLockscreenLoading(false);
    setIsPasswordSet(hasPassword);
  }, []);

  const handleLockScreenClickOpen = () => {
    if (!lockscreen) {
      setLockScreen(true);
    }
  };

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
        autolockTime,
        showIdleTimer,
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
