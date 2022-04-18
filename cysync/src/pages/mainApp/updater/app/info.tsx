import MUIButton from '@mui/material/Button';
import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import { shell } from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import Button from '../../../../designSystem/designComponents/buttons/button';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column'
    },
    versionText: {
      marginBottom: '20px'
    },
    button: {
      background: '#71624C',
      color: theme.palette.text.primary,
      textTransform: 'none',
      padding: '0.5rem 3.5rem',
      marginBottom: '2rem',
      marginTop: '20px',
      '&:hover': {
        background: theme.palette.secondary.dark
      }
    },
    knowMoreText: {
      textTransform: 'none'
    }
  })
);

interface UpdateInfoComponentProps {
  onUpdate: () => void;
  version: string;
}

const UpdateInfoComponent: React.FC<UpdateInfoComponentProps> = ({
  onUpdate,
  version
}) => {
  const classes = useStyles();

  const knowMoreLink = 'https://www.cypherock.com/about/';

  const knowMore = () => {
    shell.openExternal(knowMoreLink);
  };

  return (
    <div className={classes.container}>
      <Typography className={classes.versionText} variant="body1">
        {`New CySync Version ${version} Available!`}
      </Typography>
      <Typography className={classes.versionText} variant="body2">
        Please download the latest CySync app from the Cypherock website.
      </Typography>
      <Button onClick={onUpdate} size="large" className={classes.button}>
        Update
      </Button>
      <MUIButton onClick={knowMore}>
        <Typography variant="body1" className={classes.knowMoreText}>
          Know more
        </Typography>
      </MUIButton>
    </div>
  );
};

UpdateInfoComponent.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired
};

export default UpdateInfoComponent;
