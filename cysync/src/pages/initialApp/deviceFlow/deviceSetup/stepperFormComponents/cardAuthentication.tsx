import ReportIcon from '@mui/icons-material/Report';
import { IconButton, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect, useRef } from 'react';

import success from '../../../../../assets/icons/generic/success.png';
import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import AvatarIcon from '../../../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../../designSystem/iconGroups/errorExclamation';
import { useCardAuth } from '../../../../../store/hooks/flows';
import { useConnection } from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import logger from '../../../../../utils/logger';
import DynamicTextView from '../../../../mainApp/sidebar/settings/tabViews/deviceHealth/dynamicTextView';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'DeviceSetupCardAuth';

const classes = {
  middle: `${PREFIX}-middle`,
  success: `${PREFIX}-success`,
  bottomContainer: `${PREFIX}-bottomContainer`,
  report: `${PREFIX}-report`,
  btnContainer: `${PREFIX}-btnContainer`
};

const Root = styled(Grid)(() => ({
  [`& .${classes.middle}`]: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '60vh',
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  [`& .${classes.success}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  [`& .${classes.bottomContainer}`]: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  [`& .${classes.report}`]: {
    position: 'absolute',
    right: 20,
    bottom: 20
  },
  [`& .${classes.btnContainer}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));

const CardAuthentication: React.FC<StepComponentProps> = ({ handleNext }) => {
  const { connected } = useConnection();

  const {
    cardsStatus,
    showRetry,
    enableRetry,
    enableRetryErrorMsg,
    cardsAuth,
    handleFeedbackOpen,
    onRetry,
    errorObj,
    setCardsStatus
  } = useCardAuth(true);

  const { internalDeviceConnection } = useConnection();
  const latestDeviceConnection = useRef<any>();

  useEffect(() => {
    latestDeviceConnection.current = internalDeviceConnection;
  }, [internalDeviceConnection]);

  useEffect(() => {
    Analytics.Instance.event(
      Analytics.Categories.INITIAL_CARD_AUTH,
      Analytics.Actions.OPEN
    );
    logger.info('InitialCardAuth: Opened');

    return () => {
      Analytics.Instance.event(
        Analytics.Categories.INITIAL_CARD_AUTH,
        Analytics.Actions.CLOSED
      );
      logger.info('InitialCardAuth: Closed');
    };
  }, []);

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
        Analytics.Categories.INITIAL_CARD_AUTH,
        Analytics.Actions.ERROR,
        cardsStatus === 0 ? 'some-cards' : 'all-cards'
      );
      logger.info('InitialCardAuth: Error');
    } else if (cardsStatus === 1) {
      Analytics.Instance.event(
        Analytics.Categories.INITIAL_CARD_AUTH,
        Analytics.Actions.COMPLETED
      );
      logger.info('InitialCardAuth: Completed');
    }
  }, [cardsStatus]);

  return (
    <Root container>
      <Grid item xs={3} />
      <Grid item xs={6} className={classes.middle}>
        <Typography
          color="textSecondary"
          gutterBottom
          style={{ marginBottom: '1rem' }}
        >
          Follow the instructions on X1 Wallet
        </Typography>
        <DynamicTextView
          text="Connect X1 wallet"
          state={latestDeviceConnection.current ? 2 : 1}
        />
        <br />
        <DynamicTextView text={getCardText('01')} state={cardsAuth['01']} />
        <br />
        <DynamicTextView text={getCardText('02')} state={cardsAuth['02']} />
        <br />
        <DynamicTextView text={getCardText('03')} state={cardsAuth['03']} />
        <br />
        <DynamicTextView text={getCardText('04')} state={cardsAuth['04']} />
        <br />
        {errorObj.isSet && (
          <div className={classes.bottomContainer}>
            <div className={classes.success}>
              <Icon
                size={50}
                viewBox="0 0 60 60"
                iconGroup={<ErrorExclamation />}
              />
              <Typography variant="body2" color="error">
                {errorObj.getMessage()}
              </Typography>
            </div>
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
              </div>
            )}
            <div className={classes.btnContainer}>
              {showRetry &&
                (!enableRetry ? (
                  <Tooltip title={enableRetryErrorMsg} placement="top">
                    <div>
                      <CustomButton
                        color="primary"
                        style={{ margin: '1rem 10px 1rem 0' }}
                        disabled
                      >
                        Retry
                      </CustomButton>
                    </div>
                  </Tooltip>
                ) : (
                  <CustomButton
                    color="primary"
                    onClick={onRetry}
                    style={{ margin: '1rem 10px 1rem 0' }}
                  >
                    Retry
                  </CustomButton>
                ))}
              <CustomButton
                onClick={handleFeedbackOpen}
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
        size="large"
      >
        <ReportIcon color="secondary" />
      </IconButton>
    </Root>
  );
};

CardAuthentication.propTypes = StepComponentPropTypes;

export default CardAuthentication;
