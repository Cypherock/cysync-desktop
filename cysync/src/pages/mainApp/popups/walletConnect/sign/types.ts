import PropTypes from 'prop-types';

import { UseSignMessageValues } from '../../../../../store/hooks';

export interface ISignProps {
  handleNext: () => void;
  handleClose: () => void;
  signMessage: UseSignMessageValues;
  walletConnectSupported: boolean;
  messageToSign: string | any;
  isJSON: boolean;
  isReadable: boolean;
}

export const SignPropTypes = {
  handleNext: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  signMessage: PropTypes.any.isRequired,
  walletConnectSupported: PropTypes.bool.isRequired,
  messageToSign: PropTypes.any.isRequired,
  isJSON: PropTypes.bool.isRequired,
  isReadable: PropTypes.bool.isRequired
};
