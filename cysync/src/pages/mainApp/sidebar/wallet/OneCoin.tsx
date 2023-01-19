import { AccountTypeDetails } from '@cypherock/communication';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import { Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../constants/routes';
import CustomIconButton from '../../../../designSystem/designComponents/buttons/customIconButton';
import CustomizedDialog from '../../../../designSystem/designComponents/dialog/newDialogBox';
import PopOverText from '../../../../designSystem/designComponents/hover/popoverText';
import Icon from '../../../../designSystem/designComponents/icons/Icon';
import CoinIcons from '../../../../designSystem/genericComponents/coinIcons';
import DeleteCoinIcon from '../../../../designSystem/iconGroups/deleteCoin';
import Dustbin from '../../../../designSystem/iconGroups/dustbin';
import ICONS from '../../../../designSystem/iconGroups/iconConstants';
import {
  useReceiveTransaction,
  useSendTransaction
} from '../../../../store/hooks/flows';
import {
  ReceiveTransactionContext,
  SendTransactionContext,
  useConnection,
  useCurrentCoin,
  useDiscreetMode,
  useSnackbar,
  useSync
} from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';
import prevent from '../../../../utils/preventPropagation';

import SendButton from './generalComponents/SendButton';
import { OneCoinProps, OneCoinPropTypes } from './OneCoinProps';
import Recieve from './recieve';
import Send from './send';

const PREFIX = 'WalletOneCoin';

const classes = {
  mainContainer: `${PREFIX}-mainContainer`,
  root: `${PREFIX}-root`,
  loading: `${PREFIX}-loading`,
  icon: `${PREFIX}-icon`,
  divider: `${PREFIX}-divider`,
  actions: `${PREFIX}-actions`,
  alignStartCenter: `${PREFIX}-alignStartCenter`,
  coinNameContainer: `${PREFIX}-coinNameContainer`,
  infoIcon: `${PREFIX}-infoIcon`,
  accountTag: `${PREFIX}-accountTag`,
  alignCenterCenter: `${PREFIX}-alignCenterCenter`,
  recieveButton: `${PREFIX}-recieveButton`,
  red: `${PREFIX}-red`,
  orange: `${PREFIX}-orange`,
  grey: `${PREFIX}-grey`,
  dialogRoot: `${PREFIX}-dialogRoot`,
  actionButton: `${PREFIX}-actionButton`,
  actionButtonIcon: `${PREFIX}-actionButtonIcon`
};

const Root = styled(Grid)(({ theme }) => ({
  background: theme.palette.primary.light,
  borderRadius: 5,
  minHeight: 50,
  margin: '10px 0px',
  marginRight: '10px',
  padding: '5px 0px',
  cursor: 'pointer',
  '&:hover': {
    background: '#343a42'
  },
  [`&.${classes.loading}`]: {
    opacity: 0.6
  },
  [`& .${classes.mainContainer}`]: {
    marginBottom: '10px',
    width: '100%'
  },
  [`& .${classes.icon}`]: {
    margin: '0px !important'
  },
  [`& .${classes.divider}`]: {
    height: '100%',
    width: '0',
    margin: '0 2.5px'
  },
  [`& .${classes.actions}`]: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  [`& .${classes.alignStartCenter}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  [`& .${classes.coinNameContainer}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  [`& .${classes.infoIcon}`]: {
    fontSize: '12px',
    color: '#ADABAA'
  },
  [`& .${classes.accountTag}`]: {
    color: '#ADABAA',
    border: '1px solid #ADABAA',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '8px',
    width: 'fit-content'
  },
  [`& .${classes.alignCenterCenter}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.recieveButton}`]: {
    color: theme.palette.info.main
  },
  [`& .${classes.red}`]: {
    color: theme.palette.error.main
  },
  [`& .${classes.orange}`]: {
    color: theme.palette.secondary.main
  },
  [`& .${classes.grey}`]: {
    color: theme.palette.grey[500]
  },
  [`& .${classes.dialogRoot}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '4rem'
  },
  [`& .${classes.actionButton}`]: {
    [theme.breakpoints.down('lg')]: {
      fontSize: '12px'
    }
  },
  [`& .${classes.actionButtonIcon}`]: {
    [theme.breakpoints.down('lg')]: {
      width: '14px',
      height: '14px'
    }
  }
}));

const OneCoin: React.FC<OneCoinProps> = ({
  coinId,
  initial,
  coinName,
  accountIndex,
  accountType,
  derivationPath,
  holding,
  price,
  value,
  decimal,
  isEmpty,
  deleteCoin,
  deleteHistory,
  walletId,
  accountId
}) => {
  const discreetMode = useDiscreetMode();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const sync = useSync();
  const snackbar = useSnackbar();

  const theme = useTheme();

  const { coinDetails } = useCurrentCoin();

  const { beforeNetworkAction } = useConnection();

  useEffect(() => {
    const key = accountId;
    if (initial && walletId && sync.modulesInExecutionQueue.includes(key)) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [sync.modulesInExecutionQueue, walletId, initial]);

  const beforeAction = () => {
    if (isLoading) {
      snackbar.showSnackbar(
        `Wait while we fetch the balance and latest price rates for ${coinName}`,
        'warning'
      );
      return false;
    }
    return true;
  };

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const handleDeleteOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction()) {
      setDeleteOpen(true);
    }
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
  };

  const handleDeleteConfirmation = async () => {
    await deleteCoin(coinDetails.accountId);
    await deleteHistory(coinDetails.accountId);
  };

  const [sendForm, setSendForm] = useState(false);

  const sendTransaction = useSendTransaction();

  const handleSendFormOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction() && beforeNetworkAction() && !isEmpty) setSendForm(true);
  };

  const [receiveForm, setReceiveForm] = useState(false);

  const receiveTransaction = useReceiveTransaction();

  const handleReceiveFormOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction() && beforeNetworkAction()) setReceiveForm(true);
  };

  const onClick = () => {
    if (beforeAction()) {
      navigate(
        `${Routes.transactions.index}?coinId=${coinId}&wallet=${walletId}`
      );
    }
  };

  const getName = () => {
    return `${coinName} ${accountIndex + 1}`;
  };

  const getAccountTag = () => {
    return AccountTypeDetails[accountType]?.tag;
  };

  return (
    <>
      <CustomizedDialog
        open={deleteOpen}
        handleClose={handleDeleteClose}
        onYes={handleDeleteConfirmation}
      >
        <Icon viewBox="0 0 116 125" size={120} iconGroup={<DeleteCoinIcon />} />
        <Typography
          color="error"
          variant="h3"
          gutterBottom
          style={{ marginTop: '2rem' }}
        >
          Are you sure
        </Typography>
        <Typography color="textPrimary">{`You want to delete ${getName()} ?`}</Typography>
      </CustomizedDialog>
      <SendTransactionContext.Provider
        value={{
          sendForm,
          setSendForm,
          sendTransaction
        }}
      >
        <Send />
      </SendTransactionContext.Provider>

      <ReceiveTransactionContext.Provider
        value={{
          receiveTransaction,
          receiveForm,
          setReceiveForm
        }}
      >
        <Recieve />
      </ReceiveTransactionContext.Provider>

      <Root
        onClick={onClick}
        container
        className={clsx({ [classes.loading]: isLoading })}
      >
        <Grid
          item
          xs={3}
          className={classes.alignStartCenter}
          style={{ paddingLeft: '1rem' }}
        >
          <CoinIcons initial={coinId} style={{ marginRight: '10px' }} />
          <Typography style={{ paddingRight: '8px' }} noWrap={true}>
            <div className={classes.coinNameContainer}>
              <PopOverText
                color="textPrimary"
                hoverText={getName()}
                style={{ marginRight: 2 }}
              >
                {getName()}
              </PopOverText>
              <Tooltip title={derivationPath}>
                <InfoIcon className={classes.infoIcon} />
              </Tooltip>
            </div>
            {getAccountTag() && (
              <Typography className={classes.accountTag} noWrap={true}>
                {getAccountTag()}
              </Typography>
            )}
          </Typography>
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <PopOverText
            color="textPrimary"
            hoverText={`${discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(holding, decimal, true)
            )} ${initial} `}
            style={{ paddingRight: '8px' }}
          >
            {discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(holding, 5, true)
            )}{' '}
            {initial}
          </PopOverText>
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <PopOverText
            color="textPrimary"
            hoverText={`$ ${discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(value, undefined, true)
            )} `}
            style={{ paddingRight: '8px' }}
          >
            $
            {discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(value, 2, true)
            )}
          </PopOverText>
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <PopOverText
            color="textPrimary"
            hoverText={`$ ${formatDisplayAmount(price, undefined, true)} `}
            style={{ paddingRight: '8px' }}
          >
            $ {formatDisplayAmount(price, 2, true)}
          </PopOverText>
        </Grid>
        <Grid item xs={2} className={classes.actions}>
          <SendButton
            handleSendFormOpen={handleSendFormOpen}
            isEmpty={isEmpty}
            prefix={PREFIX}
          />
          <div className={classes.divider} />
          <Button
            variant="text"
            className={clsx(classes.recieveButton, classes.actionButton)}
            startIcon={
              <Icon
                className={clsx(classes.icon, classes.actionButtonIcon)}
                viewBox="0 0 14 15"
                icon={ICONS.walletRecieve}
                color={theme.palette.info.main}
              />
            }
            onClick={handleReceiveFormOpen}
          >
            Receive
          </Button>
        </Grid>
        <Grid item xs={1} className={classes.alignCenterCenter}>
          <CustomIconButton
            title="Delete Coin"
            onClick={handleDeleteOpen}
            iconButtonClassName={clsx(classes.actionButton)}
          >
            <Icon
              style={{
                display: 'inline-block',
                verticalAlign: 'middle'
              }}
              size={16}
              viewBox="0 0 18 18"
              iconGroup={<Dustbin />}
            />
          </CustomIconButton>
        </Grid>
      </Root>
    </>
  );
};

OneCoin.propTypes = OneCoinPropTypes;

export default OneCoin;
