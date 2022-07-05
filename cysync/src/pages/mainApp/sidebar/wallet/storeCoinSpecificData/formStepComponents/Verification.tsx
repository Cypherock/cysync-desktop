import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';

import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import {
  useCoinSpecificDataContext,
  useCustomAccountContext
} from '../../../../../../store/provider';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'WalletStoreCoinSpecificDataVerification';

const classes = {
  root: `${PREFIX}-root`,
  addressContainer: `${PREFIX}-addressContainer`,
  copyButton: `${PREFIX}-copyButton`,
  transactionId: `${PREFIX}-transactionId`
};

const Root = styled('div')(() => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: 'fit-content',
    padding: '3rem 10rem 3rem',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  [`& .${classes.addressContainer}`]: {
    background: 'rgba(0,0,0,0.2)',
    minWidth: '92%',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.copyButton}`]: {
    textTransform: 'none'
  },
  [`& .${classes.transactionId}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));

const Verification: React.FC<StepComponentProps> = ({ handleNext }) => {
  const { coinSpecificData } = useCoinSpecificDataContext();
  const { customAccount } = useCustomAccountContext();

  useEffect(() => {
    if (coinSpecificData.verified) {
      setTimeout(handleNext, 500);
    }
  }, [coinSpecificData.verified]);

  const address = coinSpecificData.receiveAddress;

  return (
    <Root className={classes.root}>
      <Typography color="textSecondary">Store account</Typography>
      <div className={classes.addressContainer}>
        <Typography color="secondary" variant="h4">
          {customAccount ? customAccount.name : address}
        </Typography>
      </div>
      <Typography color="textSecondary">Verify Account on Device</Typography>
      <TextView
        completed={coinSpecificData.verified}
        inProgress={!coinSpecificData.verified}
        text="Please Match the Account on CypherRock X1"
      />
    </Root>
  );
};

Verification.propTypes = StepComponentPropTypes;

export default Verification;
