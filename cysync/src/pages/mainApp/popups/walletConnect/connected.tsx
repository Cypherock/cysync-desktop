import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../../designSystem/designComponents/buttons/button';
import CoinIcon from '../../../../designSystem/genericComponents/coinIcons';
import {
  useWalletConnect,
  WalletConnectContextInterface
} from '../../../../store/provider';

import ClientMeta from './clientMeta';

const PREFIX = 'WalletConnect-Connected';

const classes = {
  accountDisplayContainer: `${PREFIX}-accountDisplayContainer`,
  errorButtons: `${PREFIX}-errorButtons`,
  padBottom: `${PREFIX}-padBottom`
};

const Root = styled(Grid)(() => ({
  padding: '20px',
  [`& .${classes.accountDisplayContainer}`]: {
    marginTop: '24px',
    padding: '10px',
    background: '#1F262E',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column'
  },
  [`& .${classes.errorButtons}`]: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'center',
    width: '100%'
  },
  [`& .${classes.padBottom}`]: {
    marginBottom: 5
  }
}));

const AccountInfo: React.FC<{
  coinId: string;
  accountName: string;
  accountAddress: string;
  walletName?: string;
}> = ({ coinId, accountName, accountAddress, walletName }) => (
  <div className={classes.accountDisplayContainer}>
    <div
      style={{
        marginBottom: '8px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px'
      }}
    >
      <CoinIcon initial={coinId} />
      <Typography color="textPrimary" variant="body2">
        {accountName}
      </Typography>
      {walletName && (
        <Typography color="textSecondary" variant="body2">
          {walletName}
        </Typography>
      )}
    </div>
    <Typography
      color="textPrimary"
      variant="body2"
      gutterBottom
      sx={{ color: '#7E7D7D' }}
    >
      {accountAddress}
    </Typography>
  </div>
);

export const WalletConnectStatus: React.FC<{
  walletConnect: WalletConnectContextInterface;
}> = (props: { walletConnect: WalletConnectContextInterface }) => {
  return props.walletConnect.selectedAccount ? (
    <>
      <Typography
        align="center"
        color="textPrimary"
        variant="body2"
        gutterBottom
        sx={{ color: '#7E7D7D', marginLeft: 'auto', marginRight: 'auto' }}
      >
        Connected to the following account through your wallet:
      </Typography>

      <AccountInfo
        coinId={props.walletConnect.selectedAccount.coinId}
        accountName={props.walletConnect.selectedAccount.name}
        accountAddress={props.walletConnect.selectedAccount.address}
      />
    </>
  ) : (
    <>
      <Typography
        align="center"
        color="textPrimary"
        variant="body2"
        gutterBottom
        sx={{ color: '#7E7D7D', marginLeft: 'auto', marginRight: 'auto' }}
      >
        Connected to the following accounts:
      </Typography>

      {Object.keys(props.walletConnect.selectedAccountList.current).map(
        chain => {
          const { account, wallet } =
            props.walletConnect.selectedAccountList.current[chain];
          return (
            <AccountInfo
              key={`account-${chain}`}
              coinId={account.coinId}
              accountName={account.name}
              accountAddress={account.address}
              walletName={wallet.name}
            />
          );
        }
      )}
    </>
  );
};

type Props = {
  handleClose: () => void;
};

const WalletConnectConnected: React.FC<Props> = () => {
  const walletConnect = useWalletConnect();

  return (
    <Root container>
      <ClientMeta />
      <WalletConnectStatus walletConnect={walletConnect} />

      <div className={classes.errorButtons}>
        <CustomButton
          onClick={walletConnect.handleClose}
          style={{
            padding: '0.5rem 3rem',
            margin: '1rem 0rem'
          }}
        >
          Disconnect
        </CustomButton>
      </div>
    </Root>
  );
};

WalletConnectConnected.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default WalletConnectConnected;
