import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
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
  useConnection
} from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';
import prevent from '../../../../utils/preventPropagation';

import Recieve from './recieve';
import Send from './send';

const PREFIX = 'WalletOneToken';

const classes = {
  root: `${PREFIX}-root`,
  icon: `${PREFIX}-icon`,
  divider: `${PREFIX}-divider`,
  actions: `${PREFIX}-actions`,
  alignStartCenter: `${PREFIX}-alignStartCenter`,
  alignCenterCenter: `${PREFIX}-alignCenterCenter`,
  recieveButton: `${PREFIX}-recieveButton`,
  red: `${PREFIX}-red`,
  orange: `${PREFIX}-orange`,
  dialogRoot: `${PREFIX}-dialogRoot`,
  nameWrapper: `${PREFIX}-nameWrapper`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root}`]: {
    background: theme.palette.primary.light,
    minHeight: 50,
    padding: '0px 0px 5px',
    cursor: 'pointer',
    '&:hover': {
      background: '#343a42'
    }
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
  },
  [`& .${classes.nameWrapper}`]: {
    marginLeft: '3.5rem',
    borderLeft: '1px solid rgba(33,40,35,1)',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }
}));

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
  const theme = useTheme();
  const navigate = useNavigate();

  const { beforeNetworkAction } = useConnection();

  const [sendForm, setSendForm] = useState(false);

  const sendTransaction = useSendTransaction();

  const handleSendFormOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeNetworkAction() && !isEmpty) setSendForm(true);
  };

  const [receiveForm, setReceiveForm] = useState(false);

  const receiveTransaction = useReceiveTransaction();

  const handleReceiveFormOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeNetworkAction()) setReceiveForm(true);
  };

  const onClick = (e: React.MouseEvent) => {
    prevent(e);
    navigate(
      `${
        Routes.transactions.index
      }?coin=${initial.toLowerCase()}&wallet=${walletId}`
    );
  };

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDeleteOpen = (e: React.MouseEvent) => {
    prevent(e);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
  };

  const handleDeleteConfirmation = () => {
    tokenDb.delete({
      walletId,
      slug: initial.toLowerCase(),
      coin: ethCoin.toLowerCase()
    });
    setDeleteOpen(false);
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
            text={`${formatDisplayAmount(holding, 4)} ${initial} `}
            color="textPrimary"
            hoverText={`${formatDisplayAmount(
              holding,
              decimal,
              true
            )} ${initial}`}
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
            style={{ fontSize: '0.9rem' }}
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
    </Root>
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
