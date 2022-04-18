import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import withStyles from '@mui/styles/withStyles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Routes from '../../../constants/routes';
import WalletItem from '../../../designSystem/designComponents/customComponents/walletItem';
import Icon from '../../../designSystem/designComponents/icons/Icon';
import LastTransaction from '../../../designSystem/iconGroups/lastTransaction';
import Portfolio from '../../../designSystem/iconGroups/portfolio';
import Settings from '../../../designSystem/iconGroups/settings';
import Tutorial from '../../../designSystem/iconGroups/tutorial';
import Wallet from '../../../designSystem/iconGroups/wallet';
import { useFeedback, useWallets, WalletInfo } from '../../../store/provider';

const StyledTabs = withStyles({
  root: {
    marginTop: 50,
    marginBottom: 50
  },
  indicator: {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    '& > span': {
      maxWidth: 20,
      width: '100%',
      backgroundColor: 'none'
    }
  }
})(Tabs);

const StyledTab = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: 'none',
      color: '#FFFFFF',
      letterSpacing: 0.5,
      minHeight: '30px',
      fontWeight: theme.typography.fontWeightMedium,
      fontSize: theme.typography.pxToRem(12),
      marginRight: theme.spacing(1),
      display: 'flex',
      '&:focus': {
        opacity: 1
      }
    },
    wrapper: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'start'
    },
    selected: {
      borderLeft: `3px solid ${theme.palette.secondary.main}`,
      color: theme.palette.secondary.main
    }
  })
)(Tab);

const StyledButton = withStyles(() =>
  createStyles({
    root: {
      textTransform: 'none',
      width: '100%',
      color: '#FFFFFF',
      background: '#4B3C2B',
      borderRadius: 0,
      padding: '0.7rem 0rem',
      borderBottomLeftRadius: '1rem',
      borderBottomRightRadius: '1rem'
    },
    label: {
      letterSpacing: 1,
      fontWeight: 500
    }
  })
)(Button);

const StyledAddWalletButton = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: 'none',
      color: theme.palette.text.primary,
      fontSize: '0.6rem',
      padding: `0px 16px`,
      border: `1px dashed ${theme.palette.text.secondary}`,
      background: theme.palette.primary.light,
      borderRadius: '1rem',
      position: 'absolute',
      bottom: 0,
      right: 30
    }
  })
)(Button);

const StyledListItem = withStyles(theme => ({
  root: {
    padding: 3,
    paddingLeft: 7,
    marginRight: 30
  },
  selected: {
    color: theme.palette.secondary.main,
    borderLeft: `3px solid ${theme.palette.secondary.main}`
  }
}))(ListItem);

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    maxWidth: '200px',
    background: theme.palette.primary.light,
    border: `0px solid ${theme.palette.text.secondary}`,
    height: '100%',
    borderRadius: '1rem',
    position: 'relative'
  },
  divider: {
    background: '#1E2328',
    margin: `0.6rem 0.8rem`
  },
  support: {
    position: 'absolute',
    bottom: 0
  },
  walletCollapse: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingLeft: '3rem',
    paddingRight: '0.5rem',
    position: 'relative',
    paddingBottom: '1.5rem'
  },
  walletScroll: {
    maxHeight: '100px',
    overflowY: 'auto',
    overflowX: 'hidden',
    '&::-webkit-scrollbar': {
      width: '4px',
      background: theme.palette.primary.light
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.text.secondary
    }
  }
}));

const TabValues = [
  {
    tab: 2,
    route: Routes.wallet.index
  },
  {
    tab: 5,
    route: Routes.transactions.index
  },
  {
    tab: 7,
    route: Routes.tutorial.index
  },
  {
    tab: 9,
    route: Routes.settings.index
  },
  {
    tab: 0,
    route: Routes.portfolio.index
  }
];

const Index = () => {
  const classes = useStyles();
  const { allWallets: walletData } = useWallets();

  const feedback = useFeedback();
  const [value, setValue] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [walletIndex, setWalletIndex] = React.useState(-1);

  const navigate = useNavigate();
  const location = useLocation();

  const handleOpen = () => {
    feedback.showFeedback();
  };

  useEffect(() => {
    if (value === 2) {
      setOpen(!open);
    } else {
      setOpen(false);
    }
  }, [value]);

  const handleWalletChange = (wallet: WalletInfo, index: number) => {
    setWalletIndex(index);
    navigate(`${Routes.wallet.index}/${wallet.walletId}`);
  };

  const handleChange = (
    _event: React.ChangeEvent<{}> | undefined,
    val: number
  ) => {
    setValue(val);
    const tab = TabValues.find(elem => elem.tab === val);

    if (tab) {
      // If wallet tab is selected, route to the first wallet
      if (tab.tab === 2 && walletData && walletData.length > 0) {
        // Check if there is any valid wallet
        if (walletData.filter(elem => !!elem.name).length > 0) {
          handleWalletChange(walletData[0], 0);
          return;
        }
      }
      navigate(tab.route);
    }
  };

  // This sets the active tab when the route is changed outside of the sidebar component
  useEffect(() => {
    const pathTab = TabValues.find(elem =>
      location.pathname.startsWith(elem.route)
    );

    if (pathTab) {
      if (pathTab.tab === 2) {
        const pathArr = location.pathname.split('/');
        const walletId = pathArr[pathArr.length - 1];
        const index = walletData.findIndex(elem => elem.walletId === walletId);
        setWalletIndex(index);
      }

      if (pathTab.tab !== value) {
        setValue(pathTab.tab);
      }
    }
  }, [location.pathname]);

  const onImportWallet = () => {
    setWalletIndex(-1);
    navigate(Routes.wallet.index);
  };

  return (
    <div className={classes.root}>
      <StyledTabs
        value={value}
        onChange={handleChange}
        orientation="vertical"
        aria-label="side bar menu"
      >
        <StyledTab
          label="Portfolio"
          icon={
            <Icon size={21} viewBox="0 0 24 21" iconGroup={<Portfolio />} />
          }
        />
        <Divider className={classes.divider} />
        <StyledTab
          label="Wallets"
          icon={<Icon size={21} viewBox="0 0 24 21" iconGroup={<Wallet />} />}
        />
        <Collapse
          in={open}
          timeout="auto"
          unmountOnExit
          className={classes.walletCollapse}
        >
          <div className={classes.walletScroll}>
            {walletData.map((wallet, index: number) => {
              if (!wallet.name) return null;
              return (
                <StyledListItem
                  key={wallet.walletId}
                  selected={walletIndex === index}
                  onClick={() => handleWalletChange(wallet, index)}
                >
                  <WalletItem title={wallet.name} walletDetails={wallet} />
                </StyledListItem>
              );
            })}
          </div>
          <StyledAddWalletButton onClick={onImportWallet}>
            + Import Wallet
          </StyledAddWalletButton>
        </Collapse>
        <Divider className={classes.divider} />
        <StyledTab
          label="Transactions"
          icon={
            <Icon
              size={21}
              viewBox="0 0 24 21"
              iconGroup={<LastTransaction />}
            />
          }
        />
        <Divider className={classes.divider} />
        <StyledTab
          label="Tutorial"
          icon={<Icon size={21} viewBox="0 0 24 21" iconGroup={<Tutorial />} />}
        />
        <Divider className={classes.divider} />
        <StyledTab
          label="Settings"
          icon={<Icon size={21} viewBox="0 0 24 21" iconGroup={<Settings />} />}
        />
      </StyledTabs>
      <StyledButton className={classes.support} onClick={handleOpen}>
        Support
      </StyledButton>
    </div>
  );
};

export default Index;
