import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import withStyles from '@mui/styles/withStyles';
import PropTypes from 'prop-types';
import React from 'react';

const CustomLinearProgress = withStyles(() => ({
  root: {
    height: 8
  }
}))(LinearProgress);

const PREFIX = 'UpdaterAppDownloading';

const classes = {
  successContainer: `${PREFIX}-successContainer`,
  button: `${PREFIX}-button`
};

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  width: '100%',
  [`& .${classes.successContainer}`]: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '20rem'
  },
  [`& .${classes.button}`]: {
    background: '#71624C',
    color: theme.palette.text.primary,
    textTransform: 'none',
    padding: '0.5rem 1.5rem',
    marginBottom: '1rem',
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  }
}));

interface UpdateDownloadingComponentProps {
  progress: number;
}

const UpdateDownloadingComponent: React.FC<UpdateDownloadingComponentProps> = ({
  progress
}) => {
  return (
    <Root>
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
    </Root>
  );
};

UpdateDownloadingComponent.propTypes = {
  progress: PropTypes.number.isRequired
};

export default UpdateDownloadingComponent;
