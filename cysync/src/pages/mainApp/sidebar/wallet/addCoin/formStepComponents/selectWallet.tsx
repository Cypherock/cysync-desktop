import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { useEffect } from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import {
  useAddCoinContext,
  useConnection
} from '../../../../../../store/provider';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      padding: '2rem 4rem',
      minHeight: '15rem'
    },
    center: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%'
    }
  })
);

const SelectWallet: React.FC<StepComponentProps> = ({ handleNext }) => {
  const { coinAdder } = useAddCoinContext();
  const { connected } = useConnection();

  useEffect(() => {
    if (coinAdder.coinsConfirmed) {
      setTimeout(() => {
        handleNext();
      }, 500);
    }
  }, [coinAdder.coinsConfirmed]);

  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Typography color="textSecondary">Follow the Steps on Device</Typography>
      <TextView
        completed={coinAdder.coinsConfirmed}
        inProgress={!coinAdder.coinsConfirmed}
        text="Verify the coins on the device"
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
    </div>
  );
};

SelectWallet.propTypes = StepComponentPropTypes;

export default SelectWallet;
