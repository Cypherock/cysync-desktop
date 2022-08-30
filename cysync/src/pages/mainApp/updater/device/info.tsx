import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import Button from '../../../../designSystem/designComponents/buttons/button';
import CustomCheckbox from '../../../../designSystem/designComponents/input/checkbox';

const PREFIX = 'UpdaterDeviceInfo';

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
  dontShowAgain: boolean;
  setDontShowAgain: (val: boolean) => void;
}

const UpdateInfoComponent: React.FC<UpdateInfoComponentProps> = ({
  onUpdate,
  version,
  dontShowAgain,
  setDontShowAgain
}) => {
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDontShowAgain(event.target.checked);
  };

  return (
    <Root>
      <Typography className={classes.versionText} variant="body1">
        {`New X1 wallet version ${version} Available!`}
      </Typography>
      <Button onClick={onUpdate} size="large" className={classes.button}>
        Update
      </Button>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CustomCheckbox
          checked={dontShowAgain}
          onChange={onChange}
          inputProps={{ 'aria-label': 'primary checkbox' }}
        />
        <Typography variant="body1">Don&apos;t show again</Typography>
      </div>
    </Root>
  );
};

UpdateInfoComponent.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired,
  dontShowAgain: PropTypes.bool.isRequired,
  setDontShowAgain: PropTypes.func.isRequired
};

export default UpdateInfoComponent;
