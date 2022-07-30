import PropTypes from 'prop-types';
import React from 'react';

import DialogBox from '../../../../designSystem/designComponents/dialog/dialogBox';

import CardAuthentication from './stepperFormComponents/cardAuthentication';
import DeviceAuthentication from './stepperFormComponents/deviceAuth';
import UpgradingDevice from './stepperFormComponents/upgradingDevice';
import DeviceSetupFormFlow from './stepperFormFlow';

const deviceSetupData = [
  ['Device  Authentication', DeviceAuthentication],
  ['X1 Card  Authentication', CardAuthentication],
  ['Upgrading Device', UpgradingDevice]
];

interface Props {
  open: boolean;
  handleClose: () => void;
  handleDeviceConnected: () => void;
  handlePrev: () => void;
}

const InitialDeviceSetup: React.FC<Props> = ({
  open,
  handleClose,
  handlePrev,
  handleDeviceConnected
}) => {
  return (
    <DialogBox
      fullWidth
      maxWidth="md"
      open={open}
      handleClose={handleClose}
      isClosePresent={false}
      disableBackdropClick
      disableEscapeKeyDown
      restComponents={
        <DeviceSetupFormFlow
          stepsData={deviceSetupData}
          handleDeviceConnected={handleDeviceConnected}
          handlePrev={handlePrev}
        />
      }
    />
  );
};

InitialDeviceSetup.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleDeviceConnected: PropTypes.func.isRequired,
  handlePrev: PropTypes.func.isRequired
};

export default InitialDeviceSetup;
