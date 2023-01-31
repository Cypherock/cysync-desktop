import MUIButton from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { shell } from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import Button from '../../../../../designSystem/designComponents/buttons/button';

const PREFIX = 'UpdaterAppInfo';

const classes = {
  versionText: `${PREFIX}-versionText`,
  button: `${PREFIX}-button`,
  knowMoreText: `${PREFIX}-knowMoreText`
};

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  [`& .${classes.versionText}`]: {
    marginBottom: '20px'
  },
  [`& .${classes.button}`]: {
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
  [`& .${classes.knowMoreText}`]: {
    textTransform: 'none'
  }
}));

interface UpdateInfoComponentProps {
  onUpdate: () => void;
  version: string;
}

const UpdateInfoComponent: React.FC<UpdateInfoComponentProps> = ({
  onUpdate,
  version
}) => {
  const knowMoreLink = 'https://www.cypherock.com/about/';

  const knowMore = () => {
    shell.openExternal(knowMoreLink);
  };

  return (
    <Root>
      <Typography className={classes.versionText} variant="body1">
        {`New CySync Version ${version} Available!`}
      </Typography>
      <Typography className={classes.versionText} variant="body2">
        Download the latest CySync app from the Cypherock website.
      </Typography>
      <Button onClick={onUpdate} size="large" className={classes.button}>
        Update
      </Button>
      <MUIButton onClick={knowMore}>
        <Typography
          variant="body1"
          color="textPrimary"
          className={classes.knowMoreText}
        >
          Know more
        </Typography>
      </MUIButton>
    </Root>
  );
};

UpdateInfoComponent.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired
};

export default UpdateInfoComponent;
