import Checkbox from '@material-ui/core/Checkbox';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
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
  dontShowAgain: boolean;
  setDontShowAgain: (val: boolean) => void;
}

const UpdateInfoComponent: React.FC<UpdateInfoComponentProps> = ({
  onUpdate,
  version,
  dontShowAgain,
  setDontShowAgain
}) => {
  const classes = useStyles();

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDontShowAgain(event.target.checked);
  };

  return (
    <div className={classes.container}>
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
        <Checkbox
          checked={dontShowAgain}
          onChange={onChange}
          inputProps={{ 'aria-label': 'primary checkbox' }}
        />
        <Typography variant="body1">Don&apos;t show again</Typography>
      </div>
    </div>
  );
};

UpdateInfoComponent.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired,
  dontShowAgain: PropTypes.bool.isRequired,
  setDontShowAgain: PropTypes.func.isRequired
};

export default UpdateInfoComponent;
