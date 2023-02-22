import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';

import CySyncIcon from '../../../../assets/icons/cypherock.png';
import LineImg from '../../../../assets/icons/line.png';
import { useWalletConnect } from '../../../../store/provider';

const PREFIX = 'WalletConnect-ClientMeta';

const classes = {
  imgContainer: `${PREFIX}-imgContainer`,
  clientImg: `${PREFIX}-clientImg`,
  cysyncImg: `${PREFIX}-cysyncImg`,
  lineImg: `${PREFIX}-lineImg`,
  errorButtons: `${PREFIX}-errorButtons`,
  padBottom: `${PREFIX}-padBottom`
};

const Root = styled(Grid)(() => ({
  [`& .${classes.imgContainer}`]: {
    width: '216px',
    margin: 'auto'
  },
  [`& .${classes.clientImg}`]: {
    width: 'auto',
    height: '50px'
  },
  [`& .${classes.cysyncImg}`]: {
    width: 'auto',
    height: '50px'
  },
  [`& .${classes.lineImg}`]: {
    width: '100%',
    height: 'auto'
  },
  [`& .${classes.errorButtons}`]: {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%'
  },
  [`& .${classes.padBottom}`]: {
    marginBottom: 5
  }
}));

type Props = {};

const ClientMeta: React.FC<Props> = () => {
  const walletConnect = useWalletConnect();

  if (walletConnect.connectionClientMeta) {
    const icon =
      walletConnect.connectionClientMeta?.icons?.length > 0 &&
      walletConnect.connectionClientMeta.icons[0];

    return (
      <Root direction="column" container>
        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
          className={classes.imgContainer}
        >
          <Grid item xs={3}>
            <img
              src={icon}
              alt={walletConnect.connectionClientMeta.name}
              className={classes.clientImg}
            />
          </Grid>
          <Grid item xs={6}>
            <img src={LineImg} alt="Line" className={classes.lineImg} />
          </Grid>
          <Grid item xs={3}>
            <img src={CySyncIcon} alt="CySync" className={classes.cysyncImg} />
          </Grid>
        </Grid>
        <Typography
          align="center"
          color="textPrimary"
          variant="body2"
          gutterBottom
          style={{ marginTop: '18px' }}
        >
          {walletConnect.connectionClientMeta.name}
        </Typography>
        <hr
          style={{
            marginTop: '18px',
            marginBottom: '30px',
            borderColor: '#363636',
            width: '100%'
          }}
        />
      </Root>
    );
  }

  return <></>;
};

ClientMeta.propTypes = {};

export default ClientMeta;
