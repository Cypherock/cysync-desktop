import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { useEffect } from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import {
  useConnection,
  useSelectedWallet,
  useSendTransactionContext
} from '../../../../../../store/provider';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%'
    },
    deviceDetails: {
      width: '70%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      minHeight: '15rem',
      paddingBottom: '5rem'
    },
    mainText: {
      fontSize: '1rem',
      color: theme.palette.primary.light,
      marginBottom: '1rem'
    },
    divider: {
      width: '100%',
      borderTop: `1px solid ${theme.palette.text.secondary}`
    },
    footer: {
      display: 'flex',
      alignItems: 'flex-end',
      width: '85%',
      justifyContent: 'flex-end'
    },
    deviceContinueButon: {
      width: '10rem',
      height: '3rem',
      marginTop: 15,
      textTransform: 'none',
      color: '#fff',
      background: theme.palette.secondary.dark,
      '&:hover': {
        background: theme.palette.secondary.dark
      }
    },
    center: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%'
    }
  })
);

const Device: React.FC<StepComponentProps> = ({ handleNext }) => {
  const classes = useStyles();

  const { sendTransaction } = useSendTransactionContext();

  const { selectedWallet } = useSelectedWallet();

  const { connected } = useConnection();

  useEffect(() => {
    if (sendTransaction.cardsTapped) {
      setTimeout(handleNext, 500);
    }
  }, [sendTransaction.cardsTapped]);

  return (
    <div className={classes.root}>
      <div className={classes.deviceDetails}>
        <Typography color="textSecondary" variant="h6" gutterBottom>
          Follow the instruction on device
        </Typography>
        {selectedWallet.passphraseSet && (
          <>
            <TextView
              completed={sendTransaction.passphraseEntered}
              inProgress={!sendTransaction.passphraseEntered}
              text="Enter Passphrase"
            />
          </>
        )}

        {selectedWallet.passwordSet && (
          <>
            <TextView
              completed={sendTransaction.pinEntered}
              inProgress={
                selectedWallet.passphraseSet &&
                !sendTransaction.passphraseEntered
                  ? false
                  : !sendTransaction.pinEntered
              }
              text="Enter PIN and Tap any X1 Card"
            />
            <TextView
              completed={sendTransaction.cardsTapped}
              inProgress={
                sendTransaction.pinEntered && !sendTransaction.cardsTapped
              }
              text="Please tap another X1 Card"
              stylex={{ marginTop: '0px' }}
            />
          </>
        )}

        {selectedWallet.passwordSet || (
          <TextView
            completed={sendTransaction.cardsTapped}
            inProgress={
              selectedWallet.passphraseSet && !sendTransaction.cardsTapped
                ? false
                : !sendTransaction.cardsTapped
            }
            text="Please tap any X1 Cards"
            stylex={{ marginTop: '0px' }}
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
    </div>
  );
};

Device.propTypes = StepComponentPropTypes;

export default Device;
