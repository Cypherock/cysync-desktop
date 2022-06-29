import { COINS, EthCoinData, NearCoinData } from '@cypherock/communication';
import Server from '@cypherock/server-wrapper';
import LaunchIcon from '@mui/icons-material/Launch';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { shell } from 'electron';
import QRCode from 'qrcode';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import CheckMarkSuccessIcon from '../../../../../../assets/icons/checkmarkSuccess.svg';
import Routes from '../../../../../../constants/routes';
import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import CustomIconButton from '../../../../../../designSystem/designComponents/buttons/customIconButton';
import AvatarIcon from '../../../../../../designSystem/designComponents/icons/AvatarIcon';
import { transactionDb } from '../../../../../../store/database';
import {
  useCurrentCoin,
  useSendTransactionContext,
  useTokenContext
} from '../../../../../../store/provider';
import logger from '../../../../../../utils/logger';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'WalletAddAccountConfirmation';

const classes = {
  root: `${PREFIX}-root`,
  checkmarkWrapper: `${PREFIX}-checkmarkWrapper`,
  divider: `${PREFIX}-divider`,
  footer: `${PREFIX}-footer`,
  confirmationDetails: `${PREFIX}-confirmationDetails`,
  sendSuccessfully: `${PREFIX}-sendSuccessfully`,
  subtle: `${PREFIX}-subtle`,
  attentionHash: `${PREFIX}-attentionHash`,
  transactionId: `${PREFIX}-transactionId`,
  alignColCenterCenter: `${PREFIX}-alignColCenterCenter`,
  qrImage: `${PREFIX}-qrImage`,
  flexCenter: `${PREFIX}-flexCenter`,
  footerBtn: `${PREFIX}-footerBtn`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  [`& .${classes.checkmarkWrapper}`]: {
    borderRadius: '50%',
    border: `1px solid ${theme.palette.secondary.main}`,
    padding: '1.5rem'
  },
  [`& .${classes.divider}`]: {
    width: '100%',
    borderTop: `1px solid ${theme.palette.text.secondary}`
  },
  [`& .${classes.footer}`]: {
    display: 'flex',
    alignItems: 'flex-end',
    width: '85%',
    justifyContent: 'flex-end'
  },
  [`& .${classes.confirmationDetails}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0rem 5rem'
  },
  [`& .${classes.sendSuccessfully}`]: {
    color: theme.palette.secondary.main
  },
  [`& .${classes.subtle}`]: {
    color: '#fff',
    opacity: '0.3'
  },
  [`& .${classes.attentionHash}`]: {
    color: '#fff',
    margin: `0px 1rem`
  },
  [`& .${classes.transactionId}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.alignColCenterCenter}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.qrImage}`]: {
    height: 150,
    width: 150
  },
  [`& .${classes.flexCenter}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.footerBtn}`]: {
    width: '10rem',
    height: '3rem',
    marginTop: 15,
    textTransform: 'none',
    color: '#fff'
  }
}));

const Confirmation: React.FC<StepComponentProps> = ({ handleClose }) => {
  const navigate = useNavigate();

  const { sendTransaction } = useSendTransactionContext();

  const { coinDetails } = useCurrentCoin();

  const { token } = useTokenContext();

  const coinAbbr = token ? token.slug : coinDetails.slug;

  const [imageData, setImageData] = React.useState('');
  const [isQRBuilding, setQRBuilding] = React.useState(true);

  React.useEffect(() => {
    QRCode.toDataURL(sendTransaction.hash)
      .then((url: string) => {
        setImageData(url);
        setQRBuilding(false);
      })
      .catch(() => {
        setQRBuilding(false);
      });
  }, [sendTransaction.hash]);

  const handleExternalLink = async () => {
    const coin = COINS[coinDetails.slug];

    if (!coin) {
      logger.error('Invalid COIN in coinDetails: ' + coinDetails.slug);
      return;
    }

    if (!sendTransaction.hash) {
      logger.error('Transaction hash not found in open external link');
      return;
    }

    const txns = await transactionDb.getAll({ hash: sendTransaction.hash });

    if (txns.length <= 0) {
      logger.error(
        'No transaction found with the txn hash: ' + sendTransaction.hash
      );
      return;
    }

    const isConfirmed = txns[0].confirmations && txns[0].confirmations > 0;

    if (coin instanceof EthCoinData) {
      shell.openExternal(
        Server.eth.transaction.getOpenTxnLink({
          network: coin.network,
          txHash: sendTransaction.hash,
          isConfirmed
        })
      );
    } else if (coin instanceof NearCoinData) {
      shell.openExternal(
        Server.near.transaction.getOpenTxnLink({
          network: coin.network,
          txHash: sendTransaction.hash
        })
      );
    } else {
      shell.openExternal(
        Server.bitcoin.transaction.getOpenTxnLink({
          coinType: coinDetails.slug,
          txHash: sendTransaction.hash,
          isConfirmed
        })
      );
    }
  };

  const goToTransactions = () => {
    navigate(Routes.transactions.index);
    handleClose();
  };

  return (
    <Root className={classes.root}>
      <div className={classes.confirmationDetails}>
        <Grid container>
          {coinAbbr.toUpperCase() === 'ETHR' && (
            <Typography color="error">
              [ This is a Ropsten
              <strong>&nbsp;Testnet&nbsp;</strong>
              transaction only ]
            </Typography>
          )}
          <Grid item sm={12} className={classes.alignColCenterCenter}>
            {isQRBuilding ? (
              <CircularProgress size={40} />
            ) : (
              <img src={imageData} alt="QRCode" className={classes.qrImage} />
            )}
            <Typography color="textSecondary">QR Code Txn Hash</Typography>
          </Grid>
        </Grid>
        <div className={classes.flexCenter} style={{ margin: '15px 0' }}>
          <AvatarIcon
            style={{ marginRight: '10px' }}
            src={CheckMarkSuccessIcon}
            alt="Icon"
            size="xsmall"
          />
          <Typography
            variant="h5"
            color="secondary"
            style={{ margin: '1.5rem 0rem' }}
          >
            Sent Successfully
          </Typography>
        </div>
        <div className={classes.transactionId}>
          <Typography color="textSecondary">
            {' '}
            Transaction hash : &nbsp;
          </Typography>
          <Typography
            style={{ userSelect: 'text' }}
            color="textPrimary"
            variant="body1"
          >
            {` ${sendTransaction.hash}`}
          </Typography>
          <CustomIconButton
            title="Open Link"
            placement="top-start"
            onClick={handleExternalLink}
          >
            <LaunchIcon fontSize="medium" color="secondary" />
          </CustomIconButton>
        </div>
      </div>
      <div className={classes.divider} />
      <div className={classes.footer}>
        <CustomButton className={classes.footerBtn} onClick={goToTransactions}>
          Check Transactions
        </CustomButton>
      </div>
    </Root>
  );
};

Confirmation.propTypes = StepComponentPropTypes;

export default Confirmation;
