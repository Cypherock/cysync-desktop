import { InfoOutlined } from '@mui/icons-material';
import { Divider, Grid, Link, Typography } from '@mui/material';
import React from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import Changelly from '../../../../../../designSystem/iconGroups/changelly';
import formatDisplayAmount from '../../../../../../utils/formatDisplayAmount';

type FeeDetailsProps = {
  fromToken: string;
  toToken: string;
  fees: string;
  exchangeRate: string;
  result: number;
  price: number;
};

const NetworkFeeDetails: React.FC<FeeDetailsProps> = ({
  fromToken,
  toToken,
  fees,
  exchangeRate,
  result,
  price
}) => {
  return (
    <>
      <Grid container>
        <Grid item xs={12} sx={{ marginTop: '30px' }}>
          <Grid container>
            <Grid item xs={6}>
              <Typography variant="h5" color="textSecondary">
                NETWORK FEES
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Grid container direction="row" textAlign={'right'}>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  display={'inline'}
                >
                  Medium &nbsp; &#x2022; &nbsp;
                </Typography>
                <Typography
                  variant="body1"
                  color="textPrimary"
                  display={'inline'}
                >
                  {`${formatDisplayAmount(fees, 5, true)} ${fromToken}`}
                  <Link
                    href="#"
                    color="secondary"
                    underline="hover"
                    padding={1}
                  >
                    Change
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Divider />
        </Grid>
        <Grid item xs={12} sx={{ marginTop: '20px' }}>
          <Grid container>
            <Grid item xs={5}>
              <Typography variant="body1" color="textSecondary">
                Provider
                <Icon
                  size={16}
                  viewBox="0 0 24 21"
                  iconGroup={<InfoOutlined />}
                  color="textSecondary"
                />
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body1" color="textSecondary">
                Exchange Rate
                <Icon
                  size={16}
                  viewBox="0 0 24 21"
                  iconGroup={<InfoOutlined />}
                  color="textSecondary"
                />
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography
                variant="body1"
                color="textSecondary"
                textAlign={'right'}
              >
                Receive
                <Icon
                  size={16}
                  viewBox="0 0 24 21"
                  iconGroup={<InfoOutlined />}
                  color="textSecondary"
                />
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} paddingTop={2}>
          <Grid
            container
            sx={{
              padding: '9px 17px',
              background: '#1F1D1B',
              border: '0.5px solid #5F5143',
              borderRadius: '10px'
            }}
          >
            <Grid
              container
              xs={5}
              display={'flex'}
              alignItems={'center'}
              spacing={2}
            >
              <Grid item>
                <Changelly />
              </Grid>
              <Grid item>
                <Typography variant="body1" color="textPrimary">
                  Changelly
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  No registration required
                </Typography>
              </Grid>
            </Grid>
            <Grid item xs={4}>
              <Grid item>
                <Typography variant="body1" color="textPrimary">
                  {`1 ${fromToken} = ${parseFloat(exchangeRate).toFixed(
                    6
                  )} ${toToken}`}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Fixed
                </Typography>
              </Grid>
            </Grid>
            <Grid item xs={3}>
              <Grid item>
                <Typography
                  variant="body1"
                  color="textPrimary"
                  textAlign={'right'}
                >
                  {`${formatDisplayAmount(result, 5, true)} ${toToken}`}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  textAlign={'right'}
                >
                  {`$${(price * result).toFixed(2)}`}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default NetworkFeeDetails;
