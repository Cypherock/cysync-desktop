import { IconButton } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ReportIcon from '@material-ui/icons/Report';
import React, { useEffect, useState } from 'react';

import success from '../../../../../assets/icons/generic/success.png';
import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import AvatarIcon from '../../../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../../designSystem/iconGroups/errorExclamation';
import { useCardAuth } from '../../../../../store/hooks/flows';
import {
  FeedbackState,
  useConnection,
  useFeedback
} from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import { hexToVersion, inTestApp } from '../../../../../utils/compareVersion';
import logger from '../../../../../utils/logger';
import sleep from '../../../../../utils/sleep';
import DynamicTextView from '../../../../mainApp/sidebar/settings/tabViews/deviceHealth/dynamicTextView';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const useStyles = makeStyles(() =>
  createStyles({
    middle: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '60vh',
      justifyContent: 'center',
      alignItems: 'flex-start'
    },
    success: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%'
    },
    bottomContainer: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    report: {
      position: 'absolute',
      right: 20,
      bottom: 20
    },
    btnContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }
  })
);

export interface ICardAuthState {
  '01': -1 | 0 | 1 | 2;
  '02': -1 | 0 | 1 | 2;
  '03': -1 | 0 | 1 | 2;
  '04': -1 | 0 | 1 | 2;
}

const CardAuthentication: React.FC<StepComponentProps> = ({
  handleNext,
  handleClose
}) => {
  const classes = useStyles();

  /**
   * -2 means authentication is remaining
   * -1 means all cards failed authentication
   * 0 means some cards failed authentication
   * 1 means all cards are successfully authenticated
   */
  const [cardsStatus, setCardsStatus] = React.useState<-2 | -1 | 0 | 1>(-2);
  const [connStatus, setConnStatus] = React.useState<-1 | 0 | 1 | 2>(1);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [initialStart, setInitialStart] = React.useState(false);
  const [showRetry, setShowRetry] = React.useState(false);
  const [cardsAuth, setCardsAuth] = React.useState<ICardAuthState>({
    '01': 0,
    '02': 0,
    '03': 0,
    '04': 0
  });

  const [currentCard, setCurrentCard] = useState<
    '00' | '01' | '02' | '03' | '04'
  >('00');

  const incrementCurrentCard = (current: string) => {
    if (current === '01') return '02';
    if (current === '02') return '03';
    if (current === '03') return '04';
    return '00';
  };

  const {
    internalDeviceConnection: deviceConnection,
    deviceSdkVersion,
    connected,
    inBootloader,
    firmwareVersion,
    inBackgroundProcess,
    verifyState,
    setIsInFlow,
    deviceState
  } = useConnection();

  const {
    handleCardAuth,
    verified,
    pairingFailed,
    resetHooks,
    completed,
    errorMessage
  } = useCardAuth(true);

  const feedback = useFeedback();

  useEffect(() => {
    Analytics.Instance.event(
      Analytics.Categories.INITIAL_CARD_AUTH_IN_MAIN,
      Analytics.Actions.OPEN
    );
    logger.info('InitialCardAuthInMain: Opened');

    return () => {
      Analytics.Instance.event(
        Analytics.Categories.INITIAL_CARD_AUTH_IN_MAIN,
        Analytics.Actions.CLOSED
      );
      logger.info('InitialCardAuthInMain: Closed');
    };
  }, []);

  useEffect(() => {
    if (
      deviceConnection &&
      !inBackgroundProcess &&
      [1, 2].includes(verifyState)
    ) {
      if (!connected) {
        return;
      }

      if (inBootloader) {
        setShowRetry(false);
        setErrorMsg(
          'Your device is misconfigured, Please restart cySync App. If the problem persists, please contact us.'
        );
        return;
      }

      setConnStatus(2);

      if (initialStart) {
        return;
      }

      setErrorMsg('');
      if (currentCard === '00') {
        setCardsAuth({ ...cardsAuth, '01': 1 });
        setCurrentCard('01');
      } else {
        // 0.1 second delay to give time to the device for processing
        const temp = { ...cardsAuth };
        temp[currentCard] = 1;
        setCardsAuth(temp);
        sleep(100)
          .then(() => {
            if (firmwareVersion) {
              return handleCardAuth({
                connection: deviceConnection,
                sdkVersion: deviceSdkVersion,
                setIsInFlow,
                firmwareVersion: hexToVersion(firmwareVersion),
                cardNumber: currentCard,
                isTestApp: inTestApp(deviceState)
              });
            }
          })
          .catch(() => {
            // empty
          });
      }
      setInitialStart(true);
    } else {
      setConnStatus(1);
    }
  }, [deviceConnection, connected, inBackgroundProcess]);

  useEffect(() => {
    const temp = { ...cardsAuth };
    if (currentCard === '00') {
      return;
    }

    if (completed) {
      if (errorMessage) {
        temp[currentCard] = -1;

        // Only show retry when the error is other than not verified
        if (verified !== -1 || pairingFailed) {
          setShowRetry(true);
        }

        setErrorMsg(errorMessage);
      } else if (verified === 2 && !pairingFailed) {
        temp[currentCard] = verified;
        setCurrentCard(incrementCurrentCard);
        resetHooks();
      } else {
        setErrorMsg('Some internal error occurred');
        setShowRetry(true);
      }
    }
    setCardsAuth(temp);
  }, [completed]);

  useEffect(() => {
    if (currentCard !== '00') {
      const temp = { ...cardsAuth };
      temp[currentCard] = 1;
      setCardsAuth(temp);
      setTimeout(() => {
        if (deviceConnection && firmwareVersion) {
          handleCardAuth({
            connection: deviceConnection,
            sdkVersion: deviceSdkVersion,
            setIsInFlow,
            firmwareVersion: hexToVersion(firmwareVersion),
            cardNumber: currentCard,
            isTestApp: inTestApp(deviceState)
          });
        }
      }, 3000);
    }
  }, [currentCard]);

  useEffect(() => {
    if (cardsAuth['04'] === -1 || cardsAuth['04'] === 2) {
      if (
        cardsAuth['01'] === 2 &&
        cardsAuth['02'] === 2 &&
        cardsAuth['03'] === 2 &&
        cardsAuth['04'] === 2
      ) {
        setTimeout(() => {
          setCardsStatus(1);
          handleNext();
        }, 1500);
      } else if (
        cardsAuth['01'] === -1 &&
        cardsAuth['02'] === -1 &&
        cardsAuth['03'] === -1 &&
        cardsAuth['04'] === -1
      )
        setCardsStatus(-1);
      else setCardsStatus(0);
    }
  }, [cardsAuth['04']]);

  const getCardText = (cardIndex: string) => {
    const cardName = ['1st', '2nd', '3rd', '4th'][Number(cardIndex) - 1];
    const defaultText = `Tap the ${cardName} X1 Card`;

    return defaultText;
  };

  useEffect(() => {
    if (cardsStatus === 0 || cardsStatus === -1) {
      Analytics.Instance.event(
        Analytics.Categories.INITIAL_CARD_AUTH_IN_MAIN,
        Analytics.Actions.ERROR,
        cardsStatus === 0 ? 'some-cards' : 'all-cards'
      );
      logger.info('InitialCardAuthInMain: Error');
    } else if (cardsStatus === 1) {
      Analytics.Instance.event(
        Analytics.Categories.INITIAL_CARD_AUTH_IN_MAIN,
        Analytics.Actions.COMPLETED
      );
      logger.info('InitialCardAuthInMain: Completed');
    }
  }, [cardsStatus]);

  const newFeedbackState: FeedbackState = {
    attachLogs: true,
    attachDeviceLogs: false,
    categories: ['Report'],
    category: 'Report',
    description: errorMsg || errorMessage || 'Something Went Wrong ...',
    descriptionError: '',
    email: '',
    emailError: '',
    subject: 'Reporting for Error (X1 Card Authentication)',
    subjectError: ''
  };

  const handleFeedbackOpen = () => {
    feedback.showFeedback({
      isContact: true,
      heading: 'Report',
      initFeedbackState: newFeedbackState
    });
  };

  let timeout: NodeJS.Timeout | undefined;
  const onRetry = () => {
    setShowRetry(false);
    setErrorMsg('');

    if (verifyState !== 1) {
      setShowRetry(true);
      setErrorMsg('Please connect the device and try again.');
      return;
    }

    if (currentCard === '00') {
      return;
    }

    const temp = { ...cardsAuth };
    if (deviceConnection) {
      temp[currentCard] = 1;
    } else {
      temp[currentCard] = 0;
    }
    setCardsAuth(temp);

    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }

    timeout = setTimeout(() => {
      if (deviceConnection && firmwareVersion) {
        handleCardAuth({
          connection: deviceConnection,
          sdkVersion: deviceSdkVersion,
          setIsInFlow,
          firmwareVersion: hexToVersion(firmwareVersion),
          cardNumber: currentCard,
          isTestApp: inTestApp(deviceState)
        });
      }
    }, 1000);
  };

  return (
    <Grid container>
      <Grid item xs={3} />
      <Grid item xs={6} className={classes.middle}>
        <Typography
          color="textSecondary"
          gutterBottom
          style={{ marginBottom: '1rem' }}
        >
          Follow the Steps on Device
        </Typography>
        <DynamicTextView text="Connect X1 wallet" state={connStatus} />
        <br />
        <DynamicTextView text={getCardText('01')} state={cardsAuth['01']} />
        <br />
        <DynamicTextView text={getCardText('02')} state={cardsAuth['02']} />
        <br />
        <DynamicTextView text={getCardText('03')} state={cardsAuth['03']} />
        <br />
        <DynamicTextView text={getCardText('04')} state={cardsAuth['04']} />
        <br />
        {errorMsg && (
          <div className={classes.bottomContainer}>
            <div className={classes.success}>
              <Icon
                size={50}
                viewBox="0 0 60 60"
                iconGroup={<ErrorExclamation />}
              />
              <Typography variant="body2" color="error">
                {errorMsg}
              </Typography>
            </div>
            <div className={classes.btnContainer}>
              <CustomButton
                onClick={() => {
                  handleClose();
                }}
                style={{ margin: '1rem 10px 1rem 0' }}
              >
                Close
              </CustomButton>
              {showRetry && (
                <CustomButton
                  onClick={() => {
                    onRetry();
                  }}
                  style={{ margin: '1rem 10px 1rem 0' }}
                >
                  Retry
                </CustomButton>
              )}
              <CustomButton
                onClick={() => {
                  feedback.showFeedback({ isContact: true });
                }}
                style={{ margin: '1rem 0rem' }}
              >
                Contact Us
              </CustomButton>
            </div>
          </div>
        )}
        {cardsStatus === -1 && (
          <div className={classes.bottomContainer}>
            <div className={classes.success}>
              <Icon
                size={50}
                viewBox="0 0 60 60"
                iconGroup={<ErrorExclamation />}
              />
              <Typography variant="body2" color="error">
                Validation failed on all cards
                <br />
                It is advised to contact cypherock immediately
              </Typography>
            </div>
            <div className={classes.btnContainer}>
              <CustomButton
                onClick={() => {
                  handleClose();
                }}
                style={{ margin: '1rem 10px 1rem 0' }}
              >
                Close
              </CustomButton>
              <CustomButton
                onClick={() => {
                  feedback.showFeedback({ isContact: true });
                }}
                style={{ margin: '1rem 0rem' }}
              >
                Contact Us
              </CustomButton>
            </div>
          </div>
        )}
        {cardsStatus === 0 && (
          <div className={classes.bottomContainer}>
            <div className={classes.success}>
              <Icon
                size={50}
                viewBox="0 0 60 60"
                iconGroup={<ErrorExclamation />}
              />
              <Typography variant="body2" color="secondary">
                Validation failed on some cards
                <br />
                It is advised to contact cypherock immediately
              </Typography>
            </div>
            <div className={classes.btnContainer}>
              <CustomButton
                onClick={() => {
                  handleClose();
                }}
                style={{ margin: '1rem 10px 1rem 0' }}
              >
                Close
              </CustomButton>
              <CustomButton
                onClick={() => {
                  feedback.showFeedback({ isContact: true });
                }}
                style={{ margin: '1rem 0rem' }}
              >
                Contact Us
              </CustomButton>
            </div>
          </div>
        )}
        {cardsStatus === 1 && (
          <div className={classes.success}>
            <AvatarIcon alt="success" src={success} size="small" />
            <Typography variant="body2" color="secondary">
              All X1 Cards are verified successfully
            </Typography>
          </div>
        )}
        {connected || (
          <div className={classes.success}>
            <Icon
              size={50}
              viewBox="0 0 60 60"
              iconGroup={<ErrorExclamation />}
            />
            <Typography variant="body2" color="secondary">
              Internet connection is required for this action
            </Typography>
          </div>
        )}
      </Grid>
      <Grid item xs={3} />
      <IconButton
        title="Report issue"
        onClick={handleFeedbackOpen}
        className={classes.report}
      >
        <ReportIcon color="secondary" />
      </IconButton>
    </Grid>
  );
};

CardAuthentication.propTypes = StepComponentPropTypes;

export default CardAuthentication;
