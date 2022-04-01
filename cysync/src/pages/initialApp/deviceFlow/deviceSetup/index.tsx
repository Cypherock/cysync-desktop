import PropTypes from 'prop-types';
import React from 'react';

import DialogBox from '../../../../designSystem/designComponents/dialog/dialogBox';

import CardAuthentication from './stepperFormComponents/cardAuthentication';
import DeviceAuthentication from './stepperFormComponents/deviceAuth';
import UpgradingDevice from './stepperFormComponents/upgradingDevice';
import DeviceSetupFormFlow from './stepperFormFlow';

const deviceSetupData = [
  ['X1 Card  Authentication', CardAuthentication],
  ['Device  Authentication', DeviceAuthentication],
  ['Upgrading Device', UpgradingDevice]
];

interface Props {
  open: boolean;
  handleClose: () => void;
  handleDeviceConnected: () => void;
  handlePrev: () => void;
}

const Index: React.FC<Props> = ({
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

Index.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleDeviceConnected: PropTypes.func.isRequired,
  handlePrev: PropTypes.func.isRequired
};

export default Index;
