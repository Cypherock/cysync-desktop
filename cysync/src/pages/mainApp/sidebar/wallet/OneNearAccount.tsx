import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../constants/routes';
import CustomizedDialog from '../../../../designSystem/designComponents/dialog/newDialogBox';
import PopOverText from '../../../../designSystem/designComponents/hover/popoverText';
import Icon from '../../../../designSystem/designComponents/icons/Icon';
import DeleteCoinIcon from '../../../../designSystem/iconGroups/deleteCoin';
import ICONS from '../../../../designSystem/iconGroups/iconConstants';
import {
  useReceiveTransaction,
  useSendTransaction
} from '../../../../store/hooks/flows';
import {
  ReceiveTransactionContext,
  SendTransactionContext,
  useConnection,
  useDiscreetMode
} from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';
import prevent from '../../../../utils/preventPropagation';

import SendButton from './generalComponents/SendButton';
import Recieve from './recieve';
import Send from './send';

const PREFIX = 'WalletOneNearAccount';

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
  grey: `${PREFIX}-grey`,
  dialogRoot: `${PREFIX}-dialogRoot`,
  nameWrapper: `${PREFIX}-nameWrapper`,
  actionButton: `${PREFIX}-actionButton`,
  actionButtonIcon: `${PREFIX}-actionButtonIcon`
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
    marginLeft: '3.5rem',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingRight: '10px'
  },
  [`& .${classes.actionButton}`]: {
    fontSize: '0.9rem',
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

interface OneNearAccountProps {
  initial: string;
  name: string;
  holding: string;
  value: string;
  price: string;
  isEmpty: boolean;
  decimal: number;
  walletId: string;
}

const OneNearAccount: React.FC<OneNearAccountProps> = ({
  initial,
  name,
  holding,
  price,
  value,
  decimal,
  isEmpty,
  walletId
}) => {
  const discreetMode = useDiscreetMode();
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
      }?slug=${initial.toLowerCase()}&wallet=${walletId}`
    );
  };

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDeleteClose = () => {
    setDeleteOpen(false);
  };

  const handleDeleteConfirmation = async () => {
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
          <Grid wrap="nowrap" container className={classes.nameWrapper}>
            <PopOverText
              hoverText={name}
              color="textPrimary"
              style={{ paddingRight: '4rem', fontSize: '0.9rem' }}
            >
              {name}
            </PopOverText>
          </Grid>
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <PopOverText
            color="textPrimary"
            hoverText={`${discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(holding, decimal, true)
            )} ${initial}`}
            style={{ fontSize: '0.9rem', paddingRight: '8px' }}
          >
            {`${discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(holding, 5, true)
            )} ${initial} `}
          </PopOverText>
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <PopOverText
            text={`$ ${discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(value, 2, true)
            )}`}
            color="textPrimary"
            hoverText={`$ ${discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(value, undefined, true)
            )} `}
            style={{ fontSize: '0.9rem', paddingRight: '8px' }}
          />
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <PopOverText
            text={`$ ${formatDisplayAmount(price, 2, true)}`}
            color="textPrimary"
            hoverText={`$ ${formatDisplayAmount(price, undefined, true)} `}
            style={{ fontSize: '0.9rem', paddingRight: '8px' }}
          />
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
      </Grid>
    </Root>
  );
};

OneNearAccount.propTypes = {
  initial: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  holding: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  isEmpty: PropTypes.bool.isRequired,
  price: PropTypes.string.isRequired,
  decimal: PropTypes.number.isRequired,
  walletId: PropTypes.string.isRequired
};

export default OneNearAccount;
