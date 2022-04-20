import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

const PREFIX = 'InitialFlowSignup';

const classes = {
  content: `${PREFIX}-content`,
  buttons: `${PREFIX}-buttons`
};

const Root = styled(Grid)(() => ({
  [`& .${classes.content}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '80vh'
  },
  [`& .${classes.buttons}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '15vh'
  }
}));

interface SignUpProps {
  handleNext: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ handleNext }) => {
  return (
    <Root container>
      <Grid item xs={3} />
      <Grid item xs={6} className={classes.content}>
        <Typography color="secondary" variant="h3" align="center" gutterBottom>
          For optimal privacy and user experience, it is recommended that you
          generate your own auth token by signing up
        </Typography>
        <div className={classes.buttons}>
          <Button variant="contained" color="secondary">
            SignUp
          </Button>
          <Button color="secondary" variant="outlined" onClick={handleNext}>
            Skip
          </Button>
        </div>
      </Grid>
      <Grid item xs={3} />
    </Root>
  );
};

SignUp.propTypes = {
  handleNext: PropTypes.func.isRequired
};

export default SignUp;
