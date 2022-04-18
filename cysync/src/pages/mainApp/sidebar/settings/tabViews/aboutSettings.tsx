import { Grid } from '@mui/material';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import { Theme, useTheme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';

import packageJson from '../../../../../../package.json';
import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import Analytics from '../../../../../utils/analytics';
import logger from '../../../../../utils/logger';

import Privacy from './aboutSettings/privacy';
import Terms from './aboutSettings/terms';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      height: 'min-content'
    },
    header: {
      maxHeight: '3rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    listWrapper: {
      width: '100%'
    },
    divider: {
      height: 3,
      background: '#13171D',
      margin: '0.3rem 0rem'
    },
    listItem: {
      color: theme.palette.text.primary
    },
    button: {
      background: '#71624C',
      color: '#FFFFFF',
      textTransform: 'none',
      padding: '0.5rem 1.5rem',
      '&:hover': {
        background: theme.palette.secondary.dark
      }
    }
  })
);

const AboutSettings = () => {
  const classes = useStyles();
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
        <Typography variant="body1" color="textPrimary">
          {packageJson.version}
        </Typography>
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
    <div style={{ width: '100%' }}>
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
    </div>
  );
};

export default AboutSettings;
