import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { useEffect } from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import {
  useAddCoinContext,
  useConnection,
  useSelectedWallet
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

const Verify: React.FC<StepComponentProps> = ({ handleNext }) => {
  const { coinAdder } = useAddCoinContext();
  const { connected } = useConnection();

  const { selectedWallet } = useSelectedWallet();

  useEffect(() => {
    if (coinAdder.cardTap) {
      handleNext();
    }
  }, [coinAdder.cardTap]);

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography color="textSecondary" gutterBottom>
        Follow the Steps on Device
      </Typography>
      {selectedWallet.passphraseSet && (
        <>
          <TextView
            completed={coinAdder.passphraseEntered}
            inProgress={!coinAdder.passphraseEntered}
            text="Enter Passphrase"
          />
        </>
      )}

      {selectedWallet.passwordSet && (
        <>
          <TextView
            completed={coinAdder.pinEntered}
            inProgress={
              selectedWallet.passphraseSet && !coinAdder.passphraseEntered
                ? false
                : !coinAdder.pinEntered
            }
            text="Enter PIN and Tap any X1 Card"
          />
        </>
      )}

      {selectedWallet.passwordSet || (
        <TextView
          completed={coinAdder.cardTap}
          inProgress={
            selectedWallet.passphraseSet && !coinAdder.passphraseEntered
              ? false
              : !coinAdder.cardTap
          }
          text="Please tap any X1 Card"
        />
      )}

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

Verify.propTypes = StepComponentPropTypes;

export default Verify;
