import Server from '@cypherock/server-wrapper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import LaunchIcon from '@material-ui/icons/Launch';
import { shell } from 'electron';
import QRCode from 'qrcode';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import CheckMarkSuccessIcon from '../../../../../../assets/icons/checkmarkSuccess.svg';
import Routes from '../../../../../../constants/routes';
import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import CustomIconButton from '../../../../../../designSystem/designComponents/buttons/customIconButton';
import AvatarIcon from '../../../../../../designSystem/designComponents/icons/AvatarIcon';
import {
  useCurrentCoin,
  useSendTransactionContext,
  useTokenContext
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
    checkmarkWrapper: {
      borderRadius: '50%',
      border: `1px solid ${theme.palette.secondary.main}`,
      padding: '1.5rem'
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
    confirmationDetails: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 0rem 5rem'
    },
    sendSuccessfully: {
      color: theme.palette.secondary.main
    },
    subtle: {
      color: '#fff',
      opacity: '0.3'
    },
    attentionHash: {
      color: '#fff',
      margin: `0px 1rem`
    },
    transactionId: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    },
    alignColCenterCenter: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    },
    qrImage: {
      height: 150,
      width: 150
    },
    flexCenter: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    footerBtn: {
      width: '10rem',
      height: '3rem',
      marginTop: 15,
      textTransform: 'none',
      color: '#fff'
    }
  })
);

const Confirmation: React.FC<StepComponentProps> = ({ handleClose }) => {
  const classes = useStyles();
  const navigate = useNavigate();

  const { sendTransaction } = useSendTransactionContext();

  const { coinDetails } = useCurrentCoin();

  const { token } = useTokenContext();

  const coinAbbr = token ? token.coin : coinDetails.coin;

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

  const handleExternalLink = () => {
    shell.openExternal(
      Server.bitcoin.transaction.getOpenTxnLink({
        coinType: coinDetails.coin,
        txHash: sendTransaction.hash
      })
    );
  };

  const goToTransactions = () => {
    navigate(Routes.transactions.index);
    handleClose();
  };

  return (
    <div className={classes.root}>
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
          <Typography color="textPrimary" variant="body1">
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
    </div>
  );
};

Confirmation.propTypes = StepComponentPropTypes;

export default Confirmation;
