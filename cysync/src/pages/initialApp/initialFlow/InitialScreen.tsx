import Grow from '@material-ui/core/Grow';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import StartScreen from './startScreen';

interface InitialScreenProps {
  handleNext: () => void;
}

const InitialScreen: React.FC<InitialScreenProps> = ({ handleNext }) => {
  const [screen, setScreen] = React.useState(0);

  const getScreen = () => {
    switch (screen) {
      case 0:
        setTimeout(() => {
          setScreen(screen + 1);
        }, 3000);
        return (
          <Grow in timeout={2000}>
            <Typography
              color="textPrimary"
              variant="h1"
              style={{ fontWeight: 400, fontFamily: 'Lato', fontSize: '50px' }}
            >
              Hi
            </Typography>
          </Grow>
        );
      case 1:
        setTimeout(() => {
          setScreen(screen + 1);
        }, 3000);
        return (
          <>
            <div>
              <Typography
                color="textSecondary"
                variant="h2"
                align="center"
                style={{ fontWeight: 300 }}
              >
                Welcome to
              </Typography>
              <br />
              <Typography
                color="textPrimary"
                variant="h1"
                align="center"
                style={{
                  fontWeight: 900,
                  letterSpacing: 7,
                  fontFamily: 'Lato',
                  fontSize: '50px'
                }}
              >
                CYPHEROCK
              </Typography>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <StartScreen handleNext={handleNext} />
          </>
        );
      default:
        return <p>Some Error Occurred</p>;
    }
  };

  return getScreen();
};

InitialScreen.propTypes = {
  handleNext: PropTypes.func.isRequired
};

export default InitialScreen;
