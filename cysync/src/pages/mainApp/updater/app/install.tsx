import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import success from '../../../../assets/icons/generic/success.png';
import Button from '../../../../designSystem/designComponents/buttons/button';
import ModAvatar from '../../../../designSystem/designComponents/icons/AvatarIcon';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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

interface UpdateInstallComponentProps {
  onInstall: () => void;
}

const UpdateInstallComponent: React.FC<UpdateInstallComponentProps> = ({
  onInstall
}) => {
  const classes = useStyles();
  return (
    <div className={classes.successContainer}>
      <ModAvatar src={success} alt="success" />
      <Typography
        color="textPrimary"
        style={{ margin: '1rem 0rem 5rem', fontWeight: 700 }}
      >
        Update downloaded successfully, do you want to install now?
      </Typography>
      <Button
        variant="contained"
        className={classes.button}
        onClick={onInstall}
        size="large"
      >
        Install
      </Button>
    </div>
  );
};

UpdateInstallComponent.propTypes = {
  onInstall: PropTypes.func.isRequired
};

export default UpdateInstallComponent;
