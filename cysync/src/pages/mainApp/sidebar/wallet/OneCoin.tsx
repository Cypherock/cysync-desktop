import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
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
  useSnackbar,
  useSync
} from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';
import prevent from '../../../../utils/preventPropagation';

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
  alignCenterCenter: `${PREFIX}-alignCenterCenter`,
  recieveButton: `${PREFIX}-recieveButton`,
  red: `${PREFIX}-red`,
  orange: `${PREFIX}-orange`,
  dialogRoot: `${PREFIX}-dialogRoot`
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
    background: theme.palette.primary.dark,
    height: '50%',
    margin: '0px 10px'
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
  [`& .${classes.dialogRoot}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '4rem'
  }
}));

const OneCoin: React.FC<OneCoinProps> = ({
  initial,
  name,
  holding,
  price,
  value,
  decimal,
  isEmpty,
  deleteCoin,
  deleteHistory,
  walletId
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const sync = useSync();
  const snackbar = useSnackbar();

  const theme = useTheme();

  const { coinDetails } = useCurrentCoin();

  const { beforeNetworkAction } = useConnection();

  useEffect(() => {
    const key = `${walletId}-${initial.toLowerCase()}`;
    if (initial && walletId && sync.modulesInExecutionQueue.includes(key)) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [sync.modulesInExecutionQueue, walletId, initial]);

  const beforeAction = () => {
    if (isLoading) {
      snackbar.showSnackbar(
        `Please wait while we fetch the balance and latest price rates for ${name}`,
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
    await deleteHistory(coinDetails);
    await deleteCoin(coinDetails.xpub, coinDetails.slug, walletId);
    setDeleteOpen(false);
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
        `${
          Routes.transactions.index
        }?coin=${initial.toLowerCase()}&wallet=${walletId}`
      );
    }
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
        <Typography color="textPrimary">{`You want to delete ${name} ?`}</Typography>
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
          <CoinIcons
            initial={initial.toUpperCase()}
            style={{ marginRight: '10px' }}
          />
          <Typography color="textPrimary">{name}</Typography>
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <PopOverText
            text={`${formatDisplayAmount(holding, 4)} ${initial}`}
            color="textPrimary"
            hoverText={`${formatDisplayAmount(
              holding,
              decimal,
              true
            )} ${initial} `}
          />
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <Typography color="textPrimary">{`$ ${value}`}</Typography>
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <Typography color="textPrimary">{`$ ${price}`}</Typography>
        </Grid>
        <Grid item xs={2} className={classes.actions}>
          <Button
            variant="text"
            className={!isEmpty ? clsx(classes.orange) : null}
            onClick={handleSendFormOpen}
            startIcon={
              <Icon
                className={classes.icon}
                viewBox="0 0 14 15"
                icon={ICONS.walletSend}
                color={
                  !isEmpty
                    ? theme.palette.secondary.main
                    : theme.palette.grey[500]
                }
              />
            }
          >
            Send
          </Button>
          <Divider orientation="vertical" className={classes.divider} />
          <Button
            variant="text"
            className={clsx(classes.recieveButton)}
            startIcon={
              <Icon
                className={classes.icon}
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
          <CustomIconButton title="Delete Coin" onClick={handleDeleteOpen}>
            <Icon size={20} viewBox="0 0 18 18" iconGroup={<Dustbin />} />
          </CustomIconButton>
        </Grid>
      </Root>
    </>
  );
};

OneCoin.propTypes = OneCoinPropTypes;

export default OneCoin;
