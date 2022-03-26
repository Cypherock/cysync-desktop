import PropTypes from 'prop-types';

export interface DeviceSettingItemProps {
  handleDeviceHealthTabClose: () => void;
  allowExit: boolean;
  setAllowExit: (val: boolean) => void;
}

export const DeviceSettingItemPropTypes = {
  handleDeviceHealthTabClose: PropTypes.func.isRequired,
  allowExit: PropTypes.bool.isRequired,
  setAllowExit: PropTypes.func.isRequired
};
