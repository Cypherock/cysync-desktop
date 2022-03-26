import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';

const useStyles = makeStyles(() =>
  createStyles({
    content: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '80vh'
    },
    buttons: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '15vh'
    }
  })
);

interface SignUpProps {
  handleNext: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ handleNext }) => {
  const classes = useStyles();
  return (
    <Grid container>
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
    </Grid>
  );
};

SignUp.propTypes = {
  handleNext: PropTypes.func.isRequired
};

export default SignUp;
