import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import {
  useAddCoinContext,
  useNetwork,
  useSelectedWallet
} from '../../../../../../store/provider';
import sleep from '../../../../../../utils/sleep';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'AddCoinVerify';

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
    justifycontent: 'center',
    alignitems: 'center',
    width: '100%'
  }
}));

const Verify: React.FC<StepComponentProps> = ({ handleNext }) => {
  const { coinAdder } = useAddCoinContext();
  const { connected } = useNetwork();

  const { selectedWallet } = useSelectedWallet();

  useEffect(() => {
    if (coinAdder.cardTap) {
      // Solely for UI purpose, to wait and give a UX feeback
      sleep(1000).then(() => {
        handleNext();
      });
    }
  }, [coinAdder.cardTap]);

  return (
    <Root className={classes.root}>
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
          text="Tap any X1 Card"
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
    </Root>
  );
};

Verify.propTypes = StepComponentPropTypes;

export default Verify;
