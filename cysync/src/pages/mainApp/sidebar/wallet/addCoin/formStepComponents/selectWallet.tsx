import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import {
  useAddCoinContext,
  useNetwork
} from '../../../../../../store/provider';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'AddCoinSelectWallet';

const classes = {
  root: `${PREFIX}-root`,
  center: `${PREFIX}-center`
};

const Root = styled('div')(() => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: '2rem 4rem',
    minHeight: '15rem'
  },
  [`& .${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  }
}));

const SelectWallet: React.FC<StepComponentProps> = ({ handleNext }) => {
  const { coinAdder } = useAddCoinContext();
  const { connected } = useNetwork();

  useEffect(() => {
    if (coinAdder.coinsConfirmed) {
      setTimeout(() => {
        handleNext();
      }, 500);
    }
  }, [coinAdder.coinsConfirmed]);

  return (
    <Root className={classes.root}>
      <Typography color="textSecondary">
        Follow the instructions on X1 Wallet
      </Typography>
      <TextView
        completed={coinAdder.coinsConfirmed}
        inProgress={!coinAdder.coinsConfirmed}
        text="Confirm the coins on the X1 wallet"
      />
      {connected || (
        <div style={{ marginTop: '10px' }} className={classes.center}>
          <Icon
            size={50}
            viewBox="0 0 60 60"
            iconGroup={<ErrorExclamation />}
          />
          <Typography variant="body2" color="secondary">
            Internet connection is required for this action
          </Typography>
        </div>
      )}
    </Root>
  );
};

SelectWallet.propTypes = StepComponentPropTypes;

export default SelectWallet;
