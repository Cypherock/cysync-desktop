import PropTypes from 'prop-types';
import React from 'react';

import { completeFirstBoot, removePassword } from '../../../utils/auth';
import InternetStatus from '../../InternetStatus';

import InitialScreen from './InitialScreen';
import SetPassword from './SetPassword';
import StartOptions from './StartOptions';

interface RootInitialProps {
  handleClose: () => void;
  handleSnackbarOpen: () => void;
  handleSkipPassword: () => void;
}

const RootInitial: React.FC<RootInitialProps> = ({
  handleClose,
  handleSnackbarOpen,
  handleSkipPassword
}) => {
  const [active, setActive] = React.useState(0);

  const handleKeyPressDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.keyCode === 84) {
      completeFirstBoot();
      removePassword();
      localStorage.setItem('tnc', 'true');
      localStorage.setItem('initialFlow', 'true');
      handleClose();
    }
  };

  React.useEffect(() => {
    if (process.env.BUILD_TYPE === 'debug') {
      window.addEventListener('keydown', handleKeyPressDown);
    }

    return () => {
      if (process.env.BUILD_TYPE === 'debug') {
        window.removeEventListener('keydown', handleKeyPressDown);
      }
    };
  });

  const handleNext = () => {
    setActive(active + 1);
  };

  const activeView = () => {
    switch (active) {
      case 0:
        return <InitialScreen handleNext={handleNext} />;
      case 1:
        return <StartOptions handleNext={handleNext} />;
      case 2:
        return (
          <SetPassword
            handleClose={handleClose}
            handleSnackbarOpen={handleSnackbarOpen}
            handleSkipPassword={handleSkipPassword}
          />
        );
      default:
        return <p>Error</p>;
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', width: '100%', top: 0 }}>
        <InternetStatus />
      </div>
      {activeView()}
    </>
  );
};

RootInitial.propTypes = {
  handleClose: PropTypes.func.isRequired,
  handleSnackbarOpen: PropTypes.func.isRequired,
  handleSkipPassword: PropTypes.func.isRequired
};

export default RootInitial;
