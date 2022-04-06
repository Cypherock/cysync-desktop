import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../constants/routes';
import CustomIconButton from '../../../../designSystem/designComponents/buttons/customIconButton';
import DialogBoxConfirmation from '../../../../designSystem/designComponents/dialog/dialogBoxConfirmation';
import PopOverText from '../../../../designSystem/designComponents/hover/popoverText';
import Icon from '../../../../designSystem/designComponents/icons/Icon';
import CoinIcons from '../../../../designSystem/genericComponents/coinIcons';
import DeleteCoinIcon from '../../../../designSystem/iconGroups/deleteCoin';
import Dustbin from '../../../../designSystem/iconGroups/dustbin';
import ICONS from '../../../../designSystem/iconGroups/iconConstants';
import { Databases, dbUtil } from '../../../../store/database';
import {
  useReceiveTransaction,
  useSendTransaction
} from '../../../../store/hooks/flows';
import {
  ReceiveTransactionContext,
  SendTransactionContext,
  useConnection
} from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';

import Recieve from './recieve';
import Send from './send';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      background: theme.palette.primary.light,
      minHeight: 50,
      padding: '0px 0px 5px',
      cursor: 'pointer',
      '&:hover': {
        background: '#343a42'
      }
    },
    button: {},
    icon: {
      margin: '0px !important'
    },
    divider: {
      background: theme.palette.primary.dark,
      height: '50%',
      margin: '0px 10px'
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center'
    },
    alignStartCenter: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center'
    },
    alignCenterCenter: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    },
    recieveButton: {
      color: theme.palette.info.main
    },
    red: {
      color: theme.palette.error.main
    },
    orange: {
      color: theme.palette.secondary.main
    },
    dialogRoot: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: '4rem'
    },
    nameWrapper: {
      marginLeft: '3.5rem',
      borderLeft: '1px solid rgba(33,40,35,1)',
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center'
    }
  })
);

interface OneTokenProps {
  initial: string;
  name: string;
  holding: string;
  value: string;
  price: string;
  isEmpty: boolean;
  decimal: number;
  walletId: string;
  ethCoin: string;
}

const OneToken: React.FC<OneTokenProps> = ({
  initial,
  name,
  holding,
  price,
  value,
  decimal,
  isEmpty,
  walletId,
  ethCoin
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();

  const { beforeNetworkAction } = useConnection();

  const [sendForm, setSendForm] = useState(false);

  const sendTransaction = useSendTransaction();

  const handleSendFormOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    if (beforeNetworkAction()) setSendForm(true);
  };

  const [receiveForm, setReceiveForm] = useState(false);

  const receiveTransaction = useReceiveTransaction();

  const handleReceiveFormOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    if (beforeNetworkAction()) setReceiveForm(true);
  };

  const onClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    navigate(
      `${
        Routes.transactions.index
      }?coin=${initial.toLowerCase()}&wallet=${walletId}`
    );
  };

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDeleteOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
  };

  const handleDeleteConfirmation = () => {
    dbUtil(Databases.ERC20TOKEN, 'deleteAll', {
      walletId,
      coin: initial.toLowerCase(),
      ethCoin: ethCoin.toLowerCase()
    });
    setDeleteOpen(false);
  };

  return (
    <>
      <DialogBoxConfirmation
        maxWidth="sm"
        fullScreen
        open={deleteOpen}
        handleClose={handleDeleteClose}
        handleConfirmation={handleDeleteConfirmation}
        isClosePresent
        restComponents={
          <div className={classes.dialogRoot}>
            <Icon
              viewBox="0 0 116 125"
              size={120}
              iconGroup={<DeleteCoinIcon />}
            />
            <Typography
              color="error"
              variant="h3"
              gutterBottom
              style={{ marginTop: '2rem' }}
            >
              Are you sure
            </Typography>
            <Typography color="textPrimary" style={{ marginBottom: '2rem' }}>
              {`You want to delete ${name} ?`}
            </Typography>
          </div>
        }
      />
      <SendTransactionContext.Provider
        value={{ sendForm, setSendForm, sendTransaction }}
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

      <Grid container onClick={onClick} className={classes.root}>
        <Grid item xs={3} className={classes.alignStartCenter}>
          <Grid container className={classes.nameWrapper}>
            <CoinIcons initial={initial.toUpperCase()} size="sm" />
            <Typography color="textPrimary" style={{ fontSize: '0.9rem' }}>
              {name}
            </Typography>
          </Grid>
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <PopOverText
            text={`${initial} ${formatDisplayAmount(holding, 4)}`}
            color="textPrimary"
            hoverText={`${initial} ${formatDisplayAmount(
              holding,
              decimal,
              true
            )}`}
            style={{ fontSize: '0.9rem' }}
          />
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <Typography color="textPrimary" style={{ fontSize: '0.9rem' }}>
            {`$ ${value}`}
          </Typography>
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <Typography color="textPrimary" style={{ fontSize: '0.9rem' }}>
            {`$ ${price}`}
          </Typography>
        </Grid>
        <Grid item xs={2} className={classes.actions}>
          {!isEmpty ? (
            <Button
              variant="text"
              className={clsx(classes.button, classes.orange)}
              onClick={handleSendFormOpen}
              startIcon={
                <Icon
                  className={classes.icon}
                  viewBox="0 0 14 15"
                  icon={ICONS.walletSend}
                  color={theme.palette.secondary.main}
                />
              }
              style={{ fontSize: '0.9rem' }}
            >
              Send
            </Button>
          ) : (
            <Button
              variant="text"
              className={clsx(classes.button, classes.orange)}
              onClick={handleSendFormOpen}
              startIcon={
                <Icon
                  className={classes.icon}
                  viewBox="0 0 14 15"
                  icon={ICONS.walletSend}
                  color={theme.palette.grey[500]}
                />
              }
              style={{ fontSize: '0.9rem' }}
              disabled
            >
              Send
            </Button>
          )}

          <Divider orientation="vertical" className={classes.divider} />
          <Button
            variant="text"
            className={clsx(classes.button, classes.recieveButton)}
            startIcon={
              <Icon
                className={classes.icon}
                viewBox="0 0 14 15"
                icon={ICONS.walletRecieve}
                color={theme.palette.info.main}
              />
            }
            onClick={handleReceiveFormOpen}
            style={{ fontSize: '0.9rem' }}
          >
            Receive
          </Button>
        </Grid>
        <Grid item xs={1} className={classes.alignCenterCenter}>
          <CustomIconButton title="Delete Coin" onClick={handleDeleteOpen}>
            <Icon size={20} viewBox="0 0 18 18" iconGroup={<Dustbin />} />
          </CustomIconButton>
        </Grid>
      </Grid>
    </>
  );
};

OneToken.propTypes = {
  initial: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  holding: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  isEmpty: PropTypes.bool.isRequired,
  price: PropTypes.string.isRequired,
  decimal: PropTypes.number.isRequired,
  walletId: PropTypes.string.isRequired,
  ethCoin: PropTypes.string.isRequired
};

export default OneToken;
