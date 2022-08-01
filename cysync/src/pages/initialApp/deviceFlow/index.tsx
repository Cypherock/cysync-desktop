import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import DialogBox from '../../../designSystem/designComponents/dialog/dialogBox';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';
import InternetStatus from '../../InternetStatus';

import DeviceConnection from './DeviceConnection';
import DeviceErrorPopup from './deviceError';
import DeviceSetup from './deviceSetup';
import TermsAndUse from './TermsAndUse';

interface Props {
  handleDeviceConnected: () => void;
}

const InitialDeviceFlow: React.FC<Props> = ({ handleDeviceConnected }) => {
  const [activeView, setActiveView] = useState(
    localStorage.getItem('tnc') ? 1 : 0
  );

  const [deviceSetup, setDeviceSetup] = useState(true);

  const handleNext = () => {
    setActiveView(activeView + 1);
  };

  const handlePrev = () => {
    setActiveView(activeView - 1);
  };

  const handleClose = () => {
    setDeviceSetup(false);
    handleDeviceConnected();
  };

  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.INITAL_DEVICE_SETUP);
    logger.info('In Initial device setup');
  }, []);

  const contents = [
    <TermsAndUse key={0} handleNext={handleNext} />,
    <DeviceConnection
      key={1}
      handleNext={handleNext}
      handleDeviceConnected={handleDeviceConnected}
    />,
    <DeviceSetup
      key={2}
      open={deviceSetup}
      handleClose={handleClose}
      handleDeviceConnected={handleDeviceConnected}
      handlePrev={handlePrev}
    />,
    <p key={3}>Error</p>
  ];

  const getContent = () => {
    if (activeView < contents.length) {
      return (
        <>
          <div style={{ position: 'fixed', width: '100%', top: 0 }}>
            <InternetStatus />
          </div>
          {contents[activeView]}
        </>
      );
    }

    return (
      <>
        <div style={{ position: 'fixed', width: '100%', top: 0 }}>
          <InternetStatus />
        </div>
        {contents[contents.length - 1]}
      </>
    );
  };

  return (
    <>
      <DeviceErrorPopup />
      <DialogBox
        fullScreen
        isClosePresent={false}
        open
        handleClose={handleClose}
        restComponents={getContent()}
        disableEscapeKeyDown
      />
    </>
  );
};

InitialDeviceFlow.propTypes = {
  handleDeviceConnected: PropTypes.func.isRequired
};

export default InitialDeviceFlow;
