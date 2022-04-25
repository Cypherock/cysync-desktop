import Grid from '@material-ui/core/Grid';
import Menu, { MenuProps } from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {
  createStyles,
  makeStyles,
  Theme,
  withStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../constants/routes';
import {
  addressDb,
  erc20tokenDb,
  receiveAddressDb,
  transactionDb,
  walletDb,
  xpubDb
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
    getContentAnchorEl={null}
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

const walletItemStyles = makeStyles({
  walletItemRoot: {
    padding: `3px 0px`
  },
  iconButton: {
    padding: 5,
    borderRadius: 0
  },
  menuClose: {
    position: 'absolute',
    right: -3,
    top: -10,
    zIndex: 2
  },
  red: {
    color: 'red'
  },
  dialogRoot: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '4rem'
  },
  marquee: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  marqueeContent: {
    display: 'inline-block',
    paddingLeft: '100%',
    margin: '0',
    animation: '$marquee 4s linear infinite'
  },
  '@keyframes marquee': {
    '0%': { transform: 'translate(0, 0)' },
    '100%': { transform: 'translate(-100%, 0)' }
  }
});

interface WalletItemProps {
  title: string;
  walletDetails: any;
}

const WalletItem = (props: WalletItemProps) => {
  const classes = walletItemStyles();
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
      await walletDb.delete(walletId);
      const allXpubs = await xpubDb.getByWalletId(walletId);
      allXpubs.map(async xpub => {
        await addressDb.deleteAll({ xpub: xpub.xpub });
      });
      await receiveAddressDb.deleteAll({
        walletId
      });
      await xpubDb.deleteWallet(walletId);
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
    <Grid container className={classes.walletItemRoot}>
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
          <StyledMenuItem button disableRipple onClick={handleDeleteOpen}>
            Delete
          </StyledMenuItem>
        </StyledMenu>
      </Grid>
    </Grid>
  );
};

export default WalletItem;
