import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';

import HorizontalTabs from './HorizontalTabs';

const PREFIX = 'Swap';

const classes = {
  root: `${PREFIX}-root`,
  tab: `${PREFIX}-tab`,
  loaderContainer: `${PREFIX}-loaderContainer`
};

const Root = styled(Grid)(({ theme }) => ({
  [`& .${classes.root}`]: {
    flexGrow: 1,
    background: theme.palette.primary.main,
    borderBottom: `1px solid ${theme.palette.primary.light}`
  },
  [`& .${classes.tab}`]: {
    color: theme.palette.text.primary,
    textTransform: 'none'
  },
  [`& .${classes.loaderContainer}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '4rem'
  }
}));

const Swap = () => {
  const theme = useTheme();
  return (
    <Root container>
      <Grid item xs={12}>
        <Typography
          variant="h2"
          style={{ color: theme.palette.secondary.dark }}
          gutterBottom
        >
          Swap
        </Typography>
      </Grid>
      <HorizontalTabs />
    </Root>
  );
};

export default Swap;
