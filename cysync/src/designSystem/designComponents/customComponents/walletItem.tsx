import Grid from '@mui/material/Grid';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { keyframes, styled, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../constants/routes';
import {
  addressDb,
  coinDb,
  erc20tokenDb,
  receiveAddressDb,
  transactionDb,
  walletDb2
} from '../../../store/database';
import logger from '../../../utils/logger';
import DeleteWalletIcon from '../../iconGroups/deleteWallet';
import CustomIconButton from '../buttons/customIconButton';
import CustomizedDialog from '../dialog/newDialogBox';
import Icon from '../icons/Icon';

const StyledMenu = withStyles((theme: Theme) =>
  createStyles({
    paper: {
      background: theme.palette.background.paper,
      boxShadow: `1px 1px 2px ${theme.palette.text.secondary}`
    }
  })
)((props: MenuProps) => (
  <Menu
    elevation={1}
    anchorOrigin={{
      vertical: 'top',
      horizontal: 'right'
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'left'
    }}
    {...props}
  />
));
{
  /* getContentAnchorEl={null} */
}

const StyledMenuItem = withStyles(theme => ({
  root: {
    color: theme.palette.text.primary,
    '&:focus': {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.secondary.main,
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: theme.palette.text.primary
      }
    }
  }
}))(MenuItem);

const PREFIX = 'WalletItem';

const classes = {
  walletItemRoot: `${PREFIX}-walletItemRoot`,
  iconButton: `${PREFIX}-iconButton`,
  menuClose: `${PREFIX}-menuClose`,
  red: `${PREFIX}-red`,
  dialogRoot: `${PREFIX}-dialogRoot`,
  marquee: `${PREFIX}-marquee`,
  marqueeContent: `${PREFIX}-marqueeContent`
};

const marqueeKeyframes = keyframes`
  0% { transform: translate(0, 0); }
  100% { transform: translate(-100%, 0); }
`;

const WalletItemRoot = styled(Grid)(() => ({
  [`& .${classes.walletItemRoot}`]: {
    padding: `3px 0px`
  },
  [`& .${classes.iconButton}`]: {
    padding: 5,
    borderRadius: 0
  },
  [`& .${classes.menuClose}`]: {
    position: 'absolute',
    right: -3,
    top: -10,
    zIndex: 2
  },
  [`& .${classes.red}`]: {
    color: 'red'
  },
  [`& .${classes.dialogRoot}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '4rem'
  },
  [`& .${classes.marquee}`]: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  [`& .${classes.marqueeContent}`]: {
    display: 'inline-block',
    paddingLeft: '100%',
    margin: '0',
    animation: `${marqueeKeyframes} 4s linear infinite`
  }
}));

interface WalletItemProps {
  title: string;
  walletDetails: any;
}

const WalletItem = (props: WalletItemProps) => {
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const handleDeleteOpen = () => {
    setDeleteOpen(true);
  };
  const handleDeleteClose = () => {
    setDeleteOpen(false);
    handleClose();
  };
  const handleDeleteConfirmation = async () => {
    try {
      const {
        walletDetails: { walletId }
      } = props;
      await walletDb2.delete({id: walletId});
      const coins = await coinDb.getAll({walletId});
      coins.map(async coin => {
        await addressDb.deleteAll({ xpub: coin.xpub });
      });
      await receiveAddressDb.deleteAll({
        walletId
      });
      await coinDb.delete({walletId});
      await erc20tokenDb.deleteWallet(walletId);
      await transactionDb.deleteWallet(walletId);
      navigate(Routes.wallet.index);
      setDeleteOpen(false);
      handleClose();
    } catch (error) {
      logger.error(error);
    }
  };

  const { walletDetails, title } = props;

  return (
    <WalletItemRoot container className={classes.walletItemRoot}>
      <CustomizedDialog
        open={deleteOpen}
        handleClose={handleDeleteClose}
        onYes={handleDeleteConfirmation}
      >
        <Icon
          viewBox="0 0 116 125"
          size={120}
          iconGroup={<DeleteWalletIcon />}
        />
        <Typography
          color="error"
          variant="h3"
          style={{ margin: '2rem 0rem 1rem' }}
        >
          Are you sure
        </Typography>
        <Typography
          style={{ marginBottom: '0rem' }}
        >{`You want to delete wallet ${walletDetails.name} ?`}</Typography>
      </CustomizedDialog>
      <Grid item xs={8}>
        <Typography variant="body2" color="textPrimary">
          {title.length > 5 ? (
            <div className={classes.marquee} style={{ width: '50px' }}>
              <p className={classes.marqueeContent}>{title}</p>
            </div>
          ) : (
            title
          )}
        </Typography>
      </Grid>
      <Grid item xs={4}>
        <CustomIconButton
          title="Options"
          onClick={handleClick}
          iconButtonClassName={classes.iconButton}
        >
          <Icon
            viewBox="0 0 13 3"
            size={13}
            iconGroup={
              <g>
                <circle cx="1.5" cy="1.5" r="1.5" fill="#A08362" />
                <circle cx="6.5" cy="1.5" r="1.5" fill="#A08362" />
                <circle cx="11.5" cy="1.5" r="1.5" fill="#A08362" />
              </g>
            }
          />
        </CustomIconButton>
        <StyledMenu
          id="customized-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <StyledMenuItem disableRipple onClick={handleDeleteOpen}>
            Delete
          </StyledMenuItem>
        </StyledMenu>
      </Grid>
    </WalletItemRoot>
  );
};

export default WalletItem;
