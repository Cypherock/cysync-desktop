import { feedback as feedbackServer } from '@cypherock/server-wrapper';
import { CircularProgress, createSvgIcon, Grid } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import InputBase from '@material-ui/core/InputBase';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme,
  withStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AlertIcon from '@material-ui/icons/ReportProblemOutlined';
import Alert from '@material-ui/lab/Alert';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import packageJson from '../../../package.json';
import success from '../../assets/icons/generic/success.png';
import CustomButton from '../../designSystem/designComponents/buttons/button';
import DialogBox from '../../designSystem/designComponents/dialog/dialogBox';
import ModAvatar from '../../designSystem/designComponents/icons/AvatarIcon';
import CustomCheckbox from '../../designSystem/designComponents/input/checkbox';
import Input from '../../designSystem/designComponents/input/input';
import Analytics from '../../utils/analytics';
import { hexToVersion } from '../../utils/compareVersion';
import { getDesktopLogs, getDeviceLogs } from '../../utils/getLogs';
import logger from '../../utils/logger';
import { getSystemInfo } from '../../utils/systemInfo';
import getUUID from '../../utils/uuid';
import { useLogFetcher } from '../hooks/flows/useLogFetcher';

import { useConnection } from './connectionProvider';
import { useSnackbar } from './snackbarProvider';

const iconDropDown = createSvgIcon(
  <path d="M7 10l5 5 5-5z" color="#FFF" />,
  'Custom'
);

const BootstrapInput = withStyles((theme: Theme) =>
  createStyles({
    root: {
      'label + &': {
        marginTop: theme.spacing(3)
      }
    },
    input: {
      borderRadius: 4,
      position: 'relative',
      backgroundColor: theme.palette.background.paper,
      fontSize: 16,
      padding: '5px 26px 5px 12px'
    }
  })
)(InputBase);

const useStyles = makeStyles((theme: Theme) => ({
  option: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.primary,
    padding: 10
  },
  alignCenterCenter: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '5rem'
  },
  dropmenu: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0rem 1rem',
    border: `1px solid ${theme.palette.text.secondary}`,
    borderRadius: 3
  },
  buttonGroup: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  padBottom: {
    marginBottom: 5
  },
  extras: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: -10
  },
  loading: {
    marginLeft: 10
  },
  primaryColor: {
    color: theme.palette.secondary.dark
  },
  errorColor: {
    color: theme.palette.error.dark
  }
}));

export interface FeedbackState {
  subject: string;
  categories: string[];
  category: string;
  description: string;
  email: string;
  emailError: string;
  subjectError: string;
  descriptionError: string;
  attachLogs: boolean;
  attachDeviceLogs: boolean;
  disableDeviceLogs?: boolean;
}

type HandleCloseType = (() => void) | undefined;

interface FeedbackData {
  handleClose?: HandleCloseType;
  isContact?: boolean;
  heading?: string;
  isInitFeedbackState?: FeedbackState;
}

type ShowFeedback = (options?: {
  isContact?: FeedbackData['isContact'];
  heading?: FeedbackData['heading'];
  initFeedbackState?: FeedbackData['isInitFeedbackState'];
  handleClose?: FeedbackData['handleClose'];
  disableDeviceLogs?: boolean;
}) => void;

export interface FeedbackContextInterface {
  showFeedback: ShowFeedback;
}

export const FeedbackContext: React.Context<FeedbackContextInterface> =
  React.createContext<FeedbackContextInterface>({} as FeedbackContextInterface);

export const FeedbackProvider: React.FC = ({ children }) => {
  const classes = useStyles();
  const theme = useTheme();
  const snackbar = useSnackbar();

  const initFeedbackState = {
    subject: '',
    categories: ['Complaint', 'Feedback', 'Others'],
    category: 'Feedback',
    description: '',
    email: localStorage.getItem('email') || '',
    emailError: '',
    subjectError: '',
    descriptionError: '',
    attachLogs: true,
    attachDeviceLogs: false,
    disableDeviceLogs: false
  };

  const [externalHandleClose, setExternalHandleClose] =
    useState<HandleCloseType>(undefined);
  const [heading, setHeading] = useState<string | undefined>(undefined);
  const [isContact, setIsContact] = useState(false);

  const [isOpen, setIsOpen] = useState(false);

  const {
    internalDeviceConnection: deviceConnection,
    devicePacketVersion,
    deviceSdkVersion,
    firmwareVersion,
    deviceSerial,
    verifyState,
    beforeFlowStart,
    setIsInFlow
  } = useConnection();
  const [feedbackInput, setFeedbackInput] =
    React.useState<FeedbackState>(initFeedbackState);

  const [deviceLogsLoading, setDeviceLogsLoading] = React.useState(false);

  const [isSubmitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [isError, setError] = React.useState('');

  const {
    handleLogFetch,
    errorMessage: logErrorMessage,
    setErrorMessage: setLogErrorMessage,
    completed: logFetchCompleted,
    logFetched: logFetchState,
    requestStatus: logRequestStatus,
    resetHooks: resetLogFetcherHooks,
    cancelLogFetcher
  } = useLogFetcher();

  const resetFeedbackState = () => {
    setDeviceLogsLoading(false);
    setSubmitted(false);
    setSubmitting(false);
    setError('');
    resetLogFetcherHooks();
    setLogErrorMessage('');
  };

  const showFeedback: ShowFeedback = ({
    isContact: _isContact,
    heading: _heading,
    initFeedbackState: _initFeedbackState,
    handleClose: _handleClose,
    disableDeviceLogs
  } = {}) => {
    resetFeedbackState();

    setExternalHandleClose(_handleClose);
    setIsContact(_isContact || false);
    setHeading(_heading);

    if (_initFeedbackState) {
      if (_initFeedbackState.email) {
        setFeedbackInput({
          ..._initFeedbackState,
          disableDeviceLogs:
            _initFeedbackState.disableDeviceLogs || disableDeviceLogs
        });
      } else {
        // If email not specified, get from localStorage
        setFeedbackInput({
          ..._initFeedbackState,
          email: localStorage.getItem('email') || '',
          disableDeviceLogs:
            _initFeedbackState.disableDeviceLogs || disableDeviceLogs
        });
      }
    } else {
      setFeedbackInput({
        ...initFeedbackState,
        disableDeviceLogs
      });
    }

    setIsOpen(true);
  };

  const fetchLogs = () => {
    if (
      !feedbackInput.attachDeviceLogs &&
      deviceConnection &&
      firmwareVersion &&
      beforeFlowStart(true)
    ) {
      setLogErrorMessage('');
      resetLogFetcherHooks();
      handleLogFetch({
        connection: deviceConnection,
        packetVersion: devicePacketVersion,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        firmwareVersion
      });
      setDeviceLogsLoading(true);
    } else if (feedbackInput.attachDeviceLogs) {
      setFeedbackInput({ ...feedbackInput, attachDeviceLogs: false });
    }
  };

  useEffect(() => {
    if (!deviceConnection) {
      setLogErrorMessage('');
    }
  }, [deviceConnection]);

  useEffect(() => {
    if (logFetchCompleted) {
      setDeviceLogsLoading(false);
      if (logFetchState === 2) {
        setFeedbackInput({ ...feedbackInput, attachDeviceLogs: true });
      }
    }
  }, [logFetchCompleted]);

  const handleChange = (event: any) => {
    setFeedbackInput({
      ...feedbackInput,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async () => {
    setError('');
    const checkArray: boolean[] = [];

    if (feedbackInput.subject.trim().length === 0) {
      checkArray.push(true);
    } else {
      checkArray.push(false);
    }

    if (feedbackInput.email.trim().length === 0) {
      checkArray.push(true);
    } else {
      checkArray.push(false);
    }

    if (feedbackInput.description.trim().length === 0) {
      checkArray.push(true);
    } else {
      checkArray.push(false);
    }

    if (checkArray[0] || checkArray[1] || checkArray[2]) {
      logger.info('Feedback: Verification failed');
      setFeedbackInput({
        ...feedbackInput,
        subjectError: checkArray[0] ? 'Please Enter a Subject' : '',
        emailError: checkArray[1] ? 'Please Enter a Valid Email Address' : '',
        descriptionError: checkArray[2] ? 'Please Enter a description' : ''
      });
    } else {
      setSubmitting(true);

      if (feedbackInput.email) {
        localStorage.setItem('email', feedbackInput.email);
      }

      const data: {
        subject: string;
        category: string;
        email: string;
        description: string;
        uuid: string;
        systemInfo?: any;
        deviceLogs?: any;
        deviceInfo?: any;
        desktopLogs?: any;
        appVersion: string;
      } = {
        subject: feedbackInput.subject,
        category: feedbackInput.category,
        email: feedbackInput.email,
        description: feedbackInput.description,
        systemInfo: await getSystemInfo(),
        uuid: await getUUID(),
        appVersion: packageJson.version,
        deviceInfo:
          firmwareVersion && deviceSerial
            ? {
                firmwareVersion: hexToVersion(firmwareVersion),
                deviceSerial
              }
            : undefined
      };

      if (feedbackInput.attachLogs) {
        data.desktopLogs = await getDesktopLogs();
      }
      if (feedbackInput.attachDeviceLogs) {
        data.deviceLogs = await getDeviceLogs();
      }

      feedbackServer
        .send(data)
        .then(() => {
          logger.info('Feedback submitted');
          setSubmitted(true);
          setSubmitting(false);
          Analytics.Instance.event(
            Analytics.Categories.FEEDBACK,
            Analytics.Actions.COMPLETED
          );

          return setFeedbackInput({
            subject: isContact ? 'Contact Us' : '',
            categories: ['Complaint', 'Feedback', 'Others'],
            category: isContact ? 'Complaint' : 'Feedback',
            description: '',
            email: '',
            emailError: '',
            subjectError: '',
            descriptionError: '',
            attachLogs: true,
            attachDeviceLogs: false
          });
        })
        .catch(e => {
          Analytics.Instance.event(
            Analytics.Categories.FEEDBACK,
            Analytics.Actions.ERROR
          );
          setSubmitted(false);
          setSubmitting(false);
          setError('Failed to submit feedback, please try again later.');
          logger.error('Feedback: Error');
          logger.error(e);
        });
    }
  };

  const handleListItem = (event: any) => {
    handleChange(event);
  };

  const isDeviceConnected = () => {
    return deviceConnection && [0, 1].includes(verifyState);
  };

  const handleOk = () => {
    setIsOpen(false);

    if (externalHandleClose) {
      externalHandleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetFeedbackState();
      Analytics.Instance.event(
        Analytics.Categories.FEEDBACK,
        Analytics.Actions.OPEN
      );
      logger.info('Feedback: Initiated');
    }
  }, [isOpen]);

  const onClose = () => {
    if (deviceLogsLoading) {
      if (logRequestStatus === 2) {
        snackbar.showSnackbar(
          'Please wait while the logs are being fetched.',
          'info'
        );
        return;
      }

      if (deviceConnection) {
        cancelLogFetcher(deviceConnection, devicePacketVersion);
      }
    }

    setIsOpen(false);

    Analytics.Instance.event(
      Analytics.Categories.FEEDBACK,
      Analytics.Actions.CLOSED
    );
    logger.info('Feedback: Closed');

    resetLogFetcherHooks();
    setLogErrorMessage('');

    if (externalHandleClose) {
      externalHandleClose();
    }
  };

  const getDeviceStateErrorMsg = () => {
    const defaultText = 'Looks like the device is not configured.';
    switch (verifyState) {
      case -1:
        return 'Please connect the device to attach device logs.';
      case 2:
      case 3:
        return 'Looks like your device was disconnected while upgrading.';
      case 4:
        return 'Looks like this device is connected for the first time.';
      case 5:
        return 'Looks like the device authentication failed the last time.';
      case 6:
        return 'Looks like the device is not in the main menu.';
      case 7:
        return 'An unknown error occurred while connecting the device.';
      default:
        return defaultText;
    }
  };

  return (
    <>
      <DialogBox
        fullWidth
        maxWidth="sm"
        isClosePresent
        open={isOpen}
        handleClose={onClose}
        restComponents={
          <Grid container>
            {!isSubmitted &&
              (isContact ? (
                <Typography
                  variant="h1"
                  color="textPrimary"
                  style={{ margin: '0rem 0rem 2rem 3rem' }}
                >
                  Contact Us
                </Typography>
              ) : (
                <Typography
                  variant="h3"
                  color="textPrimary"
                  style={{ margin: '0rem 0rem 1rem 3rem' }}
                >
                  {heading ? (
                    <>{heading}</>
                  ) : (
                    <>
                      <span>How can we help you ?</span>
                    </>
                  )}
                </Typography>
              ))}
            {!isSubmitted ? (
              <Grid container>
                <Grid item xs={1} />
                <Grid item xs={10}>
                  {isError ? (
                    <Alert
                      style={{ marginBottom: '10px' }}
                      severity="error"
                      variant="outlined"
                    >
                      {isError}
                    </Alert>
                  ) : null}
                  <Typography color="textPrimary" variant="body2" gutterBottom>
                    Subject
                  </Typography>
                  <Input
                    id="subject"
                    fullWidth
                    name="subject"
                    placeholder={"What's about it?"}
                    value={feedbackInput.subject}
                    onChange={handleChange}
                  />
                  {feedbackInput.subjectError.length > 0 && (
                    <Typography
                      variant="caption"
                      style={{ color: theme.palette.error.main }}
                    >
                      {feedbackInput.subjectError}
                    </Typography>
                  )}
                  <Divider style={{ margin: '10px 0px' }} />
                  <Typography color="textPrimary" variant="body2" gutterBottom>
                    Email
                  </Typography>
                  <Input
                    id="email"
                    fullWidth
                    name="email"
                    placeholder="Your email"
                    value={feedbackInput.email}
                    onChange={handleChange}
                  />
                  {feedbackInput.emailError.length > 0 && (
                    <Typography
                      variant="caption"
                      style={{ color: theme.palette.error.main }}
                    >
                      {feedbackInput.emailError}
                    </Typography>
                  )}
                  <Divider style={{ margin: '10px 0px' }} />
                  <Typography color="textPrimary" variant="body2" gutterBottom>
                    Category
                  </Typography>
                  <FormControl
                    style={{
                      width: '100%',
                      border: `1px solid ${theme.palette.text.secondary}`,
                      padding: '5px 0px',
                      borderRadius: '5px'
                    }}
                  >
                    <Select
                      labelId="select-category"
                      id="category-select"
                      value={feedbackInput.category}
                      onChange={handleListItem}
                      IconComponent={iconDropDown}
                      name="category"
                      input={<BootstrapInput />}
                    >
                      {feedbackInput.categories.map(option => {
                        return (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>

                  <Divider style={{ margin: '10px 0px' }} />
                  <Typography color="textPrimary" variant="body2" gutterBottom>
                    Description
                  </Typography>
                  <Input
                    id="description"
                    fullWidth
                    multiline
                    rows={3}
                    name="description"
                    placeholder="Describe Your Issue Here"
                    value={feedbackInput.description}
                    onChange={handleChange}
                    className={classes.padBottom}
                  />
                  {feedbackInput.descriptionError.length > 0 && (
                    <Typography
                      variant="caption"
                      style={{ color: theme.palette.error.main }}
                    >
                      {feedbackInput.descriptionError}
                    </Typography>
                  )}
                  <Grid container className={classes.extras}>
                    <CustomCheckbox
                      checked={feedbackInput.attachLogs}
                      onClick={() => {
                        setFeedbackInput({
                          ...feedbackInput,
                          attachLogs: !feedbackInput.attachLogs
                        });
                      }}
                    />
                    <Typography color="textPrimary">
                      Attach Application Logs
                    </Typography>
                  </Grid>
                  {!feedbackInput.disableDeviceLogs && (
                    <>
                      {isDeviceConnected() && (
                        <Grid
                          container
                          className={classes.extras}
                          style={{ marginBottom: '10px' }}
                        >
                          {deviceLogsLoading && (
                            <CircularProgress
                              color="secondary"
                              size={20}
                              thickness={3}
                              className={classes.loading}
                              style={{ marginRight: '10px' }}
                            />
                          )}
                          {deviceLogsLoading || (
                            <CustomCheckbox
                              checked={feedbackInput.attachDeviceLogs}
                              onClick={fetchLogs}
                              disabled={!isDeviceConnected()}
                            />
                          )}
                          <Typography color="textPrimary">
                            Attach Device Logs
                          </Typography>
                        </Grid>
                      )}
                      {logErrorMessage && (
                        <Grid
                          container
                          className={classes.extras}
                          style={{ marginLeft: '0', marginBottom: '10px' }}
                          wrap="nowrap"
                        >
                          <AlertIcon
                            className={classes.errorColor}
                            style={{ marginRight: '5px' }}
                          />
                          <Typography
                            variant="body2"
                            className={classes.errorColor}
                          >
                            {logErrorMessage}
                          </Typography>
                        </Grid>
                      )}
                      {logRequestStatus === 1 && (
                        <Grid
                          container
                          className={classes.extras}
                          style={{ marginLeft: '0', marginBottom: '10px' }}
                          wrap="nowrap"
                        >
                          <AlertIcon
                            className={classes.primaryColor}
                            style={{ marginRight: '5px' }}
                          />
                          <Typography variant="body2" color="textSecondary">
                            Please confirm the request on device.
                          </Typography>
                        </Grid>
                      )}
                      {!isDeviceConnected() && (
                        <Grid
                          container
                          className={classes.extras}
                          style={{ marginLeft: '0' }}
                          wrap="nowrap"
                        >
                          <AlertIcon
                            className={classes.primaryColor}
                            style={{ marginRight: '5px' }}
                          />
                          <Typography variant="body2" color="textSecondary">
                            {getDeviceStateErrorMsg()}
                          </Typography>
                        </Grid>
                      )}
                    </>
                  )}
                  <Grid container className={classes.buttonGroup}>
                    <Button
                      onClick={onClose}
                      style={{
                        padding: '0.3rem 1.5rem',
                        margin: '0rem 0.5rem',
                        textTransform: 'none'
                      }}
                    >
                      Close
                    </Button>
                    <CustomButton
                      disabled={deviceLogsLoading || submitting}
                      onClick={handleSubmit}
                      style={{
                        padding: '0.3rem 1.5rem',
                        margin: '0rem 0.5rem'
                      }}
                    >
                      {submitting ? <CircularProgress size={25} /> : 'Submit'}
                    </CustomButton>
                  </Grid>
                </Grid>
                <Grid item xs={1} />
              </Grid>
            ) : (
              <Grid container>
                <Grid item xs={1} />
                <Grid item xs={10} className={classes.alignCenterCenter}>
                  <ModAvatar src={success} alt="success" />
                  <Typography
                    variant="h2"
                    color="textPrimary"
                    align="center"
                    style={{ margin: '1rem 0rem 2rem' }}
                  >
                    Someone from our team
                    <br />
                    will reach you within 48
                    <br />
                    hours.
                  </Typography>
                  <CustomButton
                    onClick={handleOk}
                    style={{
                      padding: '0.5rem 3rem',
                      margin: '0.5rem',
                      color: '#FFFFFF'
                    }}
                  >
                    Ok
                  </CustomButton>
                </Grid>
                <Grid item xs={1} />
              </Grid>
            )}
          </Grid>
        }
      />
      <FeedbackContext.Provider value={{ showFeedback }}>
        {children}
      </FeedbackContext.Provider>
    </>
  );
};

FeedbackProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useFeedback(): FeedbackContextInterface {
  return React.useContext(FeedbackContext);
}
