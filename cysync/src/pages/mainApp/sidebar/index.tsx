import Button from '@mui/material/Button';
import Collapse, { CollapseProps } from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import {
  createTheme,
  styled,
  Theme,
  ThemeProvider
} from '@mui/material/styles';
import Tab, { TabProps } from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Routes from '../../../constants/routes';
import WalletItem from '../../../designSystem/designComponents/customComponents/walletItem';
import Icon from '../../../designSystem/designComponents/icons/Icon';
import colors from '../../../designSystem/designConstants/colors';
import LastTransaction from '../../../designSystem/iconGroups/lastTransaction';
import Portfolio from '../../../designSystem/iconGroups/portfolio';
import Settings from '../../../designSystem/iconGroups/settings';
import Tutorial from '../../../designSystem/iconGroups/tutorial';
import Wallet from '../../../designSystem/iconGroups/wallet';
import { useFeedback, useWallets, WalletInfo } from '../../../store/provider';

const customTheme = (defaultTheme: Theme) =>
  createTheme({
    ...defaultTheme,
    components: {
      ...defaultTheme.components,
      MuiTabs: {
        styleOverrides: {
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
        }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            color: '#FFFFFF',
            letterSpacing: 0.5,
            minHeight: '30px',
            fontWeight: defaultTheme.typography.fontWeightMedium,
            fontSize: defaultTheme.typography.pxToRem(12),
            marginRight: defaultTheme.spacing(1),
            display: 'flex',
            '&:focus': {
              opacity: 1
            },
            '&.Mui-selected': {
              borderLeft: `3px solid ${colors.primary.darker}`,
              color: colors.primary.darker
            }
          },
          wrapped: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'start'
          }
        }
      }
    }
  });

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

const StyledAddWalletButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  color: theme.palette.text.primary,
  fontSize: '0.6rem',
  padding: `0px 16px`,
  border: `1px dashed ${theme.palette.text.secondary}`,
  background: theme.palette.primary.light,
  borderRadius: '1rem'
}));

const StyledListItem = withStyles(theme => ({
  root: {
    padding: 3,
    paddingLeft: 7,
    marginRight: 30,
    cursor: 'pointer'
  },
  selected: {
    color: theme.palette.secondary.main,
    borderLeft: `3px solid ${theme.palette.secondary.main}`
  }
}))(ListItem);

const PREFIX = 'Sidebar';

const classes = {
  divider: `${PREFIX}-divider`,
  support: `${PREFIX}-support`,
  walletCollapse: `${PREFIX}-walletCollapse`,
  walletScroll: `${PREFIX}-walletScroll`,
  importWalletContainer: `${PREFIX}-importWalletContainer`
};

const Root = styled('div')(({ theme }) => ({
  flexGrow: 1,
  maxWidth: '200px',
  background: theme.palette.primary.light,
  border: `0px solid ${theme.palette.text.secondary}`,
  height: '100%',
  borderRadius: '1rem',
  position: 'relative',
  [`& .${classes.divider}`]: {
    background: '#1E2328',
    margin: `0.6rem 0.8rem`
  },
  [`& .${classes.support}`]: {
    position: 'absolute',
    bottom: 0
  },
  [`& .${classes.walletCollapse}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingRight: '0.5rem',
    position: 'relative',
    paddingBottom: '1.5rem'
  },
  [`& .${classes.walletScroll}`]: {
    paddingLeft: '3rem',
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
  },
  [`& .${classes.importWalletContainer}`]: {
    marginTop: '10px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
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

/**
 * Custom components for Divider and Collapse is made because any component inside
 * `Tabs` will receive `TabProps` by default. This causes errors when the component
 * does not expect these props.
 *
 * Hence we create custom components that ignores such props.
 */
const CustomDivider = (props: TabProps) => {
  return <Divider className={props.className} />;
};

const CustomCollapse = (props: Omit<TabProps, 'children'> & CollapseProps) => {
  return (
    <div>
      <Collapse
        className={props.className}
        in={props.in}
        timeout={props.timeout}
        unmountOnExit={props.unmountOnExit}
      >
        {props.children}
      </Collapse>
    </div>
  );
};

const Sidebar = () => {
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

  const handleChange = (_event: React.ChangeEvent | undefined, val: number) => {
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
    <ThemeProvider theme={customTheme}>
      <Root>
        <Tabs
          value={value}
          onChange={handleChange}
          orientation="vertical"
          aria-label="side bar menu"
        >
          <Tab
            label="Portfolio"
            wrapped={true}
            value={0}
            icon={
              <Icon size={21} viewBox="0 0 24 21" iconGroup={<Portfolio />} />
            }
          />
          <CustomDivider value={1} className={classes.divider} />
          <Tab
            label="Wallets"
            wrapped={true}
            value={2}
            icon={<Icon size={21} viewBox="0 0 24 21" iconGroup={<Wallet />} />}
          />
          <CustomCollapse
            in={open}
            timeout="auto"
            unmountOnExit
            className={classes.walletCollapse}
            value={3}
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
            <div className={classes.importWalletContainer}>
              {walletData.length >= 4 ? (
                <Tooltip title="You cannot add more than 4 wallets">
                  <span style={{ margin: 'auto' }}>
                    <StyledAddWalletButton
                      disabled={true}
                      onClick={onImportWallet}
                    >
                      + Import Wallet
                    </StyledAddWalletButton>
                  </span>
                </Tooltip>
              ) : (
                <StyledAddWalletButton onClick={onImportWallet}>
                  + Import Wallet
                </StyledAddWalletButton>
              )}
            </div>
          </CustomCollapse>
          <CustomDivider value={4} className={classes.divider} />
          <Tab
            label="Transactions"
            wrapped={true}
            value={5}
            icon={
              <Icon
                size={21}
                viewBox="0 0 24 21"
                iconGroup={<LastTransaction />}
              />
            }
          />
          <CustomDivider value={6} className={classes.divider} />
          <Tab
            label="Tutorial"
            value={7}
            wrapped={true}
            icon={
              <Icon size={21} viewBox="0 0 24 21" iconGroup={<Tutorial />} />
            }
          />
          <CustomDivider value={8} className={classes.divider} />
          <Tab
            label="Settings"
            value={9}
            wrapped={true}
            icon={
              <Icon size={21} viewBox="0 0 24 21" iconGroup={<Settings />} />
            }
          />
        </Tabs>
        <StyledButton className={classes.support} onClick={handleOpen}>
          Support
        </StyledButton>
      </Root>
    </ThemeProvider>
  );
};

export default Sidebar;
