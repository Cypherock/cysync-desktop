import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
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
import { tokenDb } from '../../../../store/database';
import {
  useReceiveTransaction,
  useSendTransaction
} from '../../../../store/hooks/flows';
import {
  ReceiveTransactionContext,
  SendTransactionContext,
  useConnection,
  useDiscreetMode,
  useSnackbar,
  useSync
} from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';
import prevent from '../../../../utils/preventPropagation';

import SendButton from './generalComponents/SendButton';
import Recieve from './recieve';
import Send from './send';

const PREFIX = 'WalletOneToken';

const classes = {
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
  grey: `${PREFIX}-grey`,
  dialogRoot: `${PREFIX}-dialogRoot`,
  nameWrapper: `${PREFIX}-nameWrapper`,
  borderLeft: `${PREFIX}-borderLeft`,
  actionButton: `${PREFIX}-actionButton`,
  actionButtonIcon: `${PREFIX}-actionButtonIcon`
};

const Root = styled('div')(({ theme }) => ({
  background: theme.palette.primary.light,
  [`& .${classes.root}`]: {
    minHeight: 50,
    padding: '0px 0px 5px',
    cursor: 'pointer',
    '&:hover': {
      background: '#343a42'
    }
  },
  [`& .${classes.loading}`]: {
    opacity: 0.6
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
  [`& .${classes.nameWrapper}`]: {
    paddingLeft: '3.5rem'
  },
  [`& .${classes.borderLeft}`]: {
    borderLeft: '1px solid rgba(33,40,35,1)',
    height: '100%'
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

interface OneTokenProps {
  coinId: string;
  accountId: string;
  initial: string;
  name: string;
  holding: string;
  value: string;
  price: string;
  isEmpty: boolean;
  decimal: number;
  walletId: string;
  ethCoinId: string;
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
  ethCoinId,
  coinId,
  accountId
}) => {
  const discreetMode = useDiscreetMode();
  const theme = useTheme();
  const navigate = useNavigate();
  const sync = useSync();
  const snackbar = useSnackbar();

  const [isLoading, setIsLoading] = useState(false);

  const { beforeNetworkAction } = useConnection();

  const [sendForm, setSendForm] = useState(false);

  const sendTransaction = useSendTransaction();

  const beforeAction = () => {
    if (isLoading) {
      snackbar.showSnackbar(
        `Wait while we fetch the balance and latest price rates for ${name}`,
        'warning'
      );
      return false;
    }
    return true;
  };

  const handleSendFormOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction() && beforeNetworkAction() && !isEmpty) setSendForm(true);
  };

  const [receiveForm, setReceiveForm] = useState(false);

  const receiveTransaction = useReceiveTransaction();

  React.useEffect(() => {
    const key = accountId;
    if (initial && walletId && sync.modulesInExecutionQueue.includes(key)) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [sync.modulesInExecutionQueue, walletId, initial]);

  const handleReceiveFormOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction() && beforeNetworkAction()) setReceiveForm(true);
  };

  const onClick = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction()) {
      navigate(
        `${Routes.transactions.index}?coinId=${coinId}&wallet=${walletId}`
      );
    }
  };

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDeleteOpen = (e: React.MouseEvent) => {
    prevent(e);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
  };

  const handleDeleteConfirmation = async () => {
    await tokenDb.delete({
      walletId,
      slug: initial.toLowerCase(),
      coin: ethCoinId.toLowerCase()
    });
  };

  return (
    <Root>
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

      <Grid
        container
        onClick={onClick}
        className={clsx({ [classes.root]: true, [classes.loading]: isLoading })}
      >
        <Grid
          item
          xs={3}
          className={clsx(classes.alignStartCenter, classes.nameWrapper)}
        >
          <div className={classes.borderLeft} />
          <CoinIcons initial={coinId} parentCoin={ethCoinId} size="sm" />
          <PopOverText
            color="textPrimary"
            hoverText={name}
            style={{ paddingRight: '8px', fontSize: '0.9rem' }}
          >
            {name}
          </PopOverText>
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <PopOverText
            color="textPrimary"
            hoverText={`${discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(holding, decimal, true)
            )} ${initial}`}
            style={{ fontSize: '0.9rem', paddingRight: '8px' }}
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
              formatDisplayAmount(value, undefined)
            )} `}
            style={{ fontSize: '0.9rem', paddingRight: '8px' }}
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
            hoverText={`$ ${formatDisplayAmount(price)} `}
            style={{ fontSize: '0.9rem', paddingRight: '8px' }}
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
      </Grid>
    </Root>
  );
};

OneToken.propTypes = {
  coinId: PropTypes.string.isRequired,
  accountId: PropTypes.string.isRequired,
  initial: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  holding: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  isEmpty: PropTypes.bool.isRequired,
  price: PropTypes.string.isRequired,
  decimal: PropTypes.number.isRequired,
  walletId: PropTypes.string.isRequired,
  ethCoinId: PropTypes.string.isRequired
};

export default OneToken;
