import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';

import success from '../../../../../../assets/icons/generic/success.png';
import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import ErrorDialog from '../../../../../../designSystem/designComponents/dialog/errorDialog';
import AvatarIcon from '../../../../../../designSystem/designComponents/icons/AvatarIcon';
import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import {
  useCustomAccountContext,
  useReceiveTransactionContext
} from '../../../../../../store/provider';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'WalletReceiveReceive';

const classes = {
  root: `${PREFIX}-root`,
  rootCenter: `${PREFIX}-root-center`,
  addressContainer: `${PREFIX}-addressContainer`,
  copyButton: `${PREFIX}-copyButton`,
  text: `${PREFIX}-text`,
  errorText: `${PREFIX}-errorText`,
  link: `${PREFIX}-link`,
  externalLinkContainer: `${PREFIX}-externalLinkContainer`,
  qrWrapper: `${PREFIX}-qrWrapper`,
  qrImage: `${PREFIX}-qrImage`,
  footer: `${PREFIX}-footer`,
  footerBtn: `${PREFIX}-footerBtn`,
  highlightedText: `${PREFIX}-highlighted-text`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: '3rem 8rem 3rem'
  },
  [`& .${classes.addressContainer}`]: {
    background: 'rgba(0,0,0,0.2)', // TODO: Need to define colors in theme
    padding: '5%',
    marginBottom: '1.5rem',
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.copyButton}`]: {
    marginLeft: '40px',
    textTransform: 'none'
  },
  [`& .${classes.text}`]: {
    margin: '1rem 0rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.info.main
  },
  [`& .${classes.errorText}`]: {
    margin: '1rem 0rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.error.main
  },
  [`& .${classes.link}`]: {
    fontSize: '1rem',
    alignText: 'bottom',
    textDecoration: 'none',
    color: 'blue',
    '&:active': {
      color: 'blue'
    }
  },
  [`& .${classes.externalLinkContainer}`]: {
    display: 'flex',
    alignItems: 'center'
  },
  [`& .${classes.qrWrapper}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  [`& .${classes.qrImage}`]: {
    height: 150,
    width: 150
  },
  [`& .${classes.footer}`]: {
    display: 'flex',
    alignItems: 'flex-end',
    width: '100%',
    justifyContent: 'flex-end'
  },
  [`& .${classes.footerBtn}`]: {
    width: '10rem',
    height: '3rem',
    marginTop: 15,
    textTransform: 'none',
    color: '#fff'
  },
  [`& .${classes.rootCenter}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.highlightedText}`]: {
    color: theme.palette.secondary.main
  }
}));

const Replace: React.FC<StepComponentProps> = ({ handleClose }) => {
  const { receiveTransaction } = useReceiveTransactionContext();
  const { customAccount } = useCustomAccountContext();

  if (receiveTransaction.errorObj.isSet) {
    return (
      <ErrorDialog
        open={receiveTransaction.errorObj.isSet}
        handleClose={() => handleClose()}
        errorObj={receiveTransaction.errorObj}
        flow="Generating Receive Address"
      />
    );
  }

  if (receiveTransaction.receiveAddress)
    return receiveTransaction.verifiedReplaceAccount ? (
      <Root className={classes.root}>
        <AvatarIcon src={success} alt="success" />
        <Typography
          color="secondary"
          align="center"
          variant="h5"
          style={{ margin: '1rem 0rem 6rem' }}
        >
          Account Saved Successfully on X1 Wallet
        </Typography>
        <CustomButton
          color="secondary"
          variant="contained"
          onClick={() => handleClose()}
          autoFocus
        >
          Ok
        </CustomButton>
      </Root>
    ) : (
      <Root className={classes.root}>
        <Typography>
          Your X1 wallet already stores 4 Near accounts. Select the account on
          the device to replace with &nbsp;
          <span className={classes.highlightedText}>{customAccount?.name}</span>
        </Typography>
        <TextView
          completed={receiveTransaction.verifiedReplaceAccount}
          inProgress={!receiveTransaction.verifiedReplaceAccount}
          text="Select an Account to replace on the Device"
        />
      </Root>
    );

  return (
    <Root className={classes.root}>
      <CircularProgress color="secondary" size={40} />
    </Root>
  );
};

Replace.propTypes = StepComponentPropTypes;

export default Replace;
