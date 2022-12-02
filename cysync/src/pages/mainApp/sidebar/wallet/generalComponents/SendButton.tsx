import { COINS } from '@cypherock/communication';
import { Button, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import Icon from '../../../../../designSystem/designComponents/icons/Icon';
import ICONS from '../../../../../designSystem/iconGroups/iconConstants';
import { useConnection, useCurrentCoin } from '../../../../../store/provider';
import { checkCoinSupport } from '../../../../../utils/coinCheck';

const classesFromPrefix = (PREFIX: string) => {
  return {
    icon: `${PREFIX}-icon`,
    orange: `${PREFIX}-orange`,
    grey: `${PREFIX}-grey`,
    actionButton: `${PREFIX}-actionButton`,
    actionButtonIcon: `${PREFIX}-actionButtonIcon`
  };
};

type SendButtonProps = {
  handleSendFormOpen: (e: React.MouseEvent) => void;
  isEmpty: boolean;
  prefix: string;
};

const SendButton: React.FC<SendButtonProps> = ({
  handleSendFormOpen,
  isEmpty,
  prefix
}) => {
  const theme = useTheme();
  const classes = classesFromPrefix(prefix);
  const { deviceConnection, supportedCoinList } = useConnection();
  const { coinDetails } = useCurrentCoin();

  const coinObj = COINS[coinDetails.slug];
  const coinSupported = checkCoinSupport(supportedCoinList, {
    id: coinObj.coinListId,
    versions: coinObj.supportedVersions
  });

  const isDisabled = isEmpty || !coinSupported || !deviceConnection;
  return (
    <Tooltip
      title={
        !deviceConnection
          ? 'Connect the device to send coins'
          : !coinSupported
          ? 'Update device firmware to use this coin'
          : isEmpty
          ? 'No balance available to send'
          : ''
      }
    >
      <span
        style={{
          display: 'inline-block',
          height: '100%',
          width: '100%'
        }}
      >
        <Button
          variant="text"
          className={clsx({
            [classes.orange]: !isDisabled,
            [classes.grey]: isDisabled,
            [classes.actionButton]: true
          })}
          onClick={handleSendFormOpen}
          startIcon={
            <Icon
              className={clsx(classes.icon, classes.actionButtonIcon)}
              viewBox="0 0 14 15"
              icon={ICONS.walletSend}
              color={
                !isDisabled
                  ? theme.palette.secondary.main
                  : theme.palette.grey[500]
              }
            />
          }
        >
          Send
        </Button>
      </span>
    </Tooltip>
  );
};

SendButton.propTypes = {
  handleSendFormOpen: PropTypes.func.isRequired,
  isEmpty: PropTypes.bool.isRequired,
  prefix: PropTypes.string.isRequired
};

export default SendButton;
