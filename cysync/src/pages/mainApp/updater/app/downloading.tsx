import CircularProgress from '@material-ui/core/CircularProgress';
import LinearProgress from '@material-ui/core/LinearProgress';
import {
  createStyles,
  makeStyles,
  Theme,
  withStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';

const CustomLinearProgress = withStyles(() => ({
  root: {
    height: 8
  }
}))(LinearProgress);

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    progressContainer: {
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      width: '100%'
    },
    successContainer: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '20rem'
    },
    button: {
      background: '#71624C',
      color: theme.palette.text.primary,
      textTransform: 'none',
      padding: '0.5rem 1.5rem',
      marginBottom: '1rem',
      '&:hover': {
        background: theme.palette.secondary.dark
      }
    }
  })
);

interface UpdateDownloadingComponentProps {
  progress: number;
}

const UpdateDownloadingComponent: React.FC<UpdateDownloadingComponentProps> = ({
  progress
}) => {
  const classes = useStyles();
  return (
    <div className={classes.progressContainer}>
      <div style={{ margin: '30px auto' }}>
        <CircularProgress size={70} color="secondary" />
      </div>
      <Typography variant="h5" style={{ margin: 'auto', marginBottom: '30px' }}>
        Download In Progress...
      </Typography>
      <Typography
        variant="subtitle1"
        style={{ margin: 'auto', marginBottom: '5px' }}
      >
        {`${progress}%`}
      </Typography>
      <CustomLinearProgress
        variant="determinate"
        value={progress}
        style={{ width: '100%' }}
        color="secondary"
      />
    </div>
  );
};

UpdateDownloadingComponent.propTypes = {
  progress: PropTypes.number.isRequired
};

export default UpdateDownloadingComponent;
