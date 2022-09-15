import { Grid } from '@mui/material';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { shell } from 'electron';
import React, { useEffect } from 'react';

import packageJson from '../../../../../../package.json';
import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import Analytics from '../../../../../utils/analytics';
import logger from '../../../../../utils/logger';

import Privacy from './aboutSettings/privacy';
import Terms from './aboutSettings/terms';

const PREFIX = 'AboutSettings';

const classes = {
  root: `${PREFIX}-root`,
  header: `${PREFIX}-header`,
  footer: `${PREFIX}-footer`,
  listWrapper: `${PREFIX}-listWrapper`,
  divider: `${PREFIX}-divider`,
  listItem: `${PREFIX}-listItem`,
  button: `${PREFIX}-button`,
  footerText: `${PREFIX}-footerText`,
  link: `${PREFIX}-link`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root}`]: {
    height: 'min-content'
  },
  [`& .${classes.header}`]: {
    maxHeight: '3rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.footer}`]: {
    display: 'flex',
    alignItems: 'flex-end',
    width: '100%',
    justifyContent: 'flex-end'
  },
  [`& .${classes.listWrapper}`]: {
    width: '100%'
  },
  [`& .${classes.divider}`]: {
    height: 3,
    background: '#13171D',
    margin: '0.3rem 0rem'
  },
  [`& .${classes.listItem}`]: {
    color: theme.palette.text.primary
  },
  [`& .${classes.button}`]: {
    background: '#71624C',
    color: '#FFFFFF',
    textTransform: 'none',
    padding: '0.5rem 1.5rem',
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  },
  [`& .${classes.footerText}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.link}`]: {
    display: 'flex',
    cursor: 'pointer'
  }
}));

const AboutSettings = () => {
  const theme = useTheme();

  const [dialogState, setDialogState] = React.useState({
    termsofuse: false,
    privacypolicy: false
  });

  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.ABOUT_SETTINGS);
    logger.info('In about settings');
  }, []);

  const ListData = [
    {
      name: 'Version',
      secondaryText: '',
      element: (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}
        >
          <Typography
            style={{ textAlign: 'right' }}
            variant="body1"
            color="textPrimary"
          >
            {packageJson.version}
          </Typography>
          <Typography
            style={{ textAlign: 'right' }}
            variant="caption"
            color="textSecondary"
          >
            Build Version: {process.env.BUILD_VERSION}
          </Typography>
        </div>
      )
    },
    {
      name: 'Terms of Use',
      secondaryText: '',
      element: (
        <CustomButton
          variant="contained"
          className={classes.button}
          onClick={() => {
            setDialogState({ ...dialogState, termsofuse: true });
          }}
        >
          Learn More
        </CustomButton>
      )
    },
    {
      name: 'Privacy Policy',
      secondaryText: '',
      element: (
        <CustomButton
          variant="contained"
          className={classes.button}
          onClick={() => {
            setDialogState({ ...dialogState, privacypolicy: true });
          }}
        >
          Learn More
        </CustomButton>
      )
    }
  ];
  return (
    <Root style={{ width: '100%' }}>
      <Terms
        open={dialogState.termsofuse}
        handleClose={() => {
          setDialogState({ ...dialogState, termsofuse: false });
        }}
      />
      <Privacy
        open={dialogState.privacypolicy}
        handleClose={() => {
          setDialogState({ ...dialogState, privacypolicy: false });
        }}
      />
      <Grid item xs={12} className={classes.header}>
        <Typography
          style={{ color: theme.palette.secondary.dark }}
          variant="h4"
        >
          About
        </Typography>
      </Grid>
      <div style={{ width: '100%' }}>
        <List className={classes.listWrapper}>
          {ListData.map(item => {
            return (
              <div key={item.name}>
                <ListItem>
                  <ListItemText
                    className={classes.listItem}
                    primary={item.name}
                    secondary={
                      item.secondaryText.length > 0 ? item.secondaryText : null
                    }
                  />
                  <ListItemSecondaryAction>
                    {item.element}
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider className={classes.divider} />
              </div>
            );
          })}
        </List>
      </div>
      <Grid item xs={12} className={classes.footer}>
        <div className={classes.footerText}>
          <Typography color="textSecondary">Price data from &nbsp;</Typography>
          <div
            className={classes.link}
            onClick={() =>
              shell.openExternal('https://www.coingecko.com/en/api')
            }
          >
            <Typography color="secondary"> CoinGecko</Typography>
          </div>
        </div>
      </Grid>
    </Root>
  );
};

export default AboutSettings;
