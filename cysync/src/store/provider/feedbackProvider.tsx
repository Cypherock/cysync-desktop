import { DeviceError, DeviceErrorType } from '@cypherock/communication';
import { feedback as feedbackServer } from '@cypherock/server-wrapper';
// import { CheckCircle } from '@mui/icons-material';
import AlertIcon from '@mui/icons-material/ReportProblemOutlined';
import { CircularProgress, createSvgIcon, Grid } from '@mui/material';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputBase from '@mui/material/InputBase';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { fileTypeFromBuffer } from 'file-type';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { RecordRTCPromisesHandler } from 'recordrtc';
import * as uuid from 'uuid';

import packageJson from '../../../package.json';
import success from '../../assets/icons/generic/success.png';
import CustomButton from '../../designSystem/designComponents/buttons/button';
import DialogBox from '../../designSystem/designComponents/dialog/dialogBox';
import ModAvatar from '../../designSystem/designComponents/icons/AvatarIcon';
import CustomCheckbox from '../../designSystem/designComponents/input/checkbox';
import Input from '../../designSystem/designComponents/input/input';
import {
  CyError,
  CysyncError,
  handleDeviceErrors,
  handleErrors
} from '../../errors';
import Analytics from '../../utils/analytics';
import { hexToVersion } from '../../utils/compareVersion';
import { getDesktopLogs, getDeviceLogs } from '../../utils/getLogs';
import logger from '../../utils/logger';
// import { initRecorder, stopRecorder } from '../../utils/recorder';
import { stopRecorder } from '../../utils/recorder';
import sleep from '../../utils/sleep';
import { getSystemInfo } from '../../utils/systemInfo';
import getUUID from '../../utils/uuid';
import { useLogFetcher } from '../hooks/flows/useLogFetcher';

import { DeviceConnectionState, useConnection } from './connectionProvider';
import { useSnackbar } from './snackbarProvider';

const PREFIX = 'FeedbackContext';

const classes = {
  root: `${PREFIX}-root`,
  input: `${PREFIX}-input`,
  option: `${PREFIX}-option`,
  alignCenterCenter: `${PREFIX}-alignCenterCenter`,
  dropmenu: `${PREFIX}-dropmenu`,
  buttonGroup: `${PREFIX}-buttonGroup`,
  padBottom: `${PREFIX}-padBottom`,
  extras: `${PREFIX}-extras`,
  loading: `${PREFIX}-loading`,
  primaryColor: `${PREFIX}-primaryColor`,
  errorColor: `${PREFIX}-errorColor`
};

const Root = styled(Grid)(({ theme }) => ({
  [`& .${classes.option}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.primary,
    padding: 10
  },

  [`& .${classes.alignCenterCenter}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '5rem'
  },

  [`& .${classes.dropmenu}`]: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0rem 1rem',
    border: `1px solid ${theme.palette.text.secondary}`,
    borderRadius: 3
  },

  [`& .${classes.buttonGroup}`]: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },

  [`& .${classes.padBottom}`]: {
    marginBottom: 5
  },

  [`& .${classes.extras}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: -10
  },

  [`& .${classes.loading}`]: {
    marginLeft: 10
  },

  [`& .${classes.primaryColor}`]: {
    color: theme.palette.secondary.dark
  },

  [`& .${classes.errorColor}`]: {
    color: theme.palette.error.dark
  }
}));

const iconDropDown = createSvgIcon(
  <path d="M7 10l5 5 5-5z" color="#FFF" />,
  'Custom'
);

const BootstrapInput = InputBase;

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
}) => string;

export interface FeedbackContextInterface {
  showFeedback: ShowFeedback;
  /**
   * use this to cleanup feedback component
   */
  closeFeedback: (id?: string) => void;
  /**
   * use this to silently submit feedback behind the scenes
   */
  submitFeedback: (_feedbackInput: FeedbackState) => void;
  isRecording: boolean;
  stopRecording: () => void;
}

export const FeedbackContext: React.Context<FeedbackContextInterface> =
  React.createContext<FeedbackContextInterface>({} as FeedbackContextInterface);

export const FeedbackProvider: React.FC = ({ children }) => {
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

  const [heading, setHeading] = useState<string | undefined>(undefined);
  const [isContact, setIsContact] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [openId, setOpenId] = useState('');
  const [recorder, setRecorder] = useState<
    RecordRTCPromisesHandler | undefined
  >(undefined);
  const [attachmentBuffer, setAttachmentBuffer] = useState<Buffer | undefined>(
    undefined
  );
  const [attachmentMimeType, setAttachmentMimeType] = useState<
    string | undefined
  >(undefined);
  /**
   * -1 - upload error
   * 0 - not uploading
   * 1 - uploading
   * 2 - upload finished
   */
  const [_uploadAttachmentStatus, setUploadAttachmentStatus] = useState<
    -1 | 0 | 1 | 2
  >(0);
  const [recording, setRecording] = useState(false);
  // const attachmentEl = useRef(null);

  const {
    internalDeviceConnection: deviceConnection,
    deviceSdkVersion,
    firmwareVersion,
    deviceSerial,
    deviceConnectionState,
    setIsInFlow,
    blockNewConnection,
    isDeviceAvailable,
    isDeviceUpdating
  } = useConnection();
  const [feedbackInput, setFeedbackInput] =
    React.useState<FeedbackState>(initFeedbackState);

  const [deviceLogsLoading, setDeviceLogsLoading] = React.useState(false);

  const [isSubmitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [isError, setError] = React.useState('');

  const {
    handleLogFetch,
    errorObj,
    setErrorObj,
    clearErrorObj,
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
    clearErrorObj();
  };

  const resetRecordingState = () => {
    setRecording(false);
    setRecorder(undefined);
    setAttachmentBuffer(undefined);
    setAttachmentMimeType(undefined);
    setUploadAttachmentStatus(0);
  };

  const showFeedback: ShowFeedback = ({
    isContact: _isContact,
    heading: _heading,
    initFeedbackState: _initFeedbackState,
    handleClose: _handleClose,
    disableDeviceLogs
  } = {}) => {
    if (recording) {
      setIsOpen(true);
      logger.info('showFeedback triggered while recording');
      return;
    }
    resetFeedbackState();
    resetRecordingState();

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

    const randomId = uuid.v4();
    setOpenId(randomId);
    triggerOpen();

    return randomId;
  };

  const triggerOpen = async () => {
    // If already open, then close the previously opened feedback form
    if (isOpen) {
      setIsOpen(false);
      // Wait for the form to be closed before opening the new one
      await sleep(300);
    }
    setIsOpen(true);
  };

  const fetchLogs = async () => {
    if (!feedbackInput.attachDeviceLogs) {
      try {
        let sdkVersion: string = deviceSdkVersion;

        if (!deviceConnection) {
          throw new DeviceError(DeviceErrorType.NOT_CONNECTED);
        }

        if (deviceConnection.inBootloader) {
          throw new CyError(CysyncError.DEVICE_IN_BOOTLOADER);
        }

        if (blockNewConnection && isDeviceAvailable) {
          setDeviceLogsLoading(true);

          try {
            await deviceConnection.beforeOperation();
            const response = await deviceConnection.isDeviceSupported();
            sdkVersion = response.sdkVersion;

            if (!response.isSupported) {
              throw new CyError(CysyncError.INCOMPATIBLE_DEVICE_AND_DESKTOP);
            }
          } catch (error) {
            await deviceConnection.afterOperation();
            throw error;
          }
        }

        clearErrorObj();
        resetLogFetcherHooks();
        handleLogFetch({
          connection: deviceConnection,
          sdkVersion,
          setIsInFlow,
          firmwareVersion
        });
        setDeviceLogsLoading(true);
      } catch (error) {
        const flowName = Analytics.Categories.FETCH_LOG;
        const cyError = new CyError();
        if (error instanceof CyError) {
          setErrorObj(handleErrors(errorObj, error, flowName, { error }));
        } else {
          if (error instanceof DeviceError) {
            handleDeviceErrors(cyError, error, flowName);
          } else {
            cyError.setError(CysyncError.LOG_FETCHER_UNKNOWN_ERROR);
          }
          setErrorObj(handleErrors(errorObj, cyError, flowName, { error }));
        }
        setDeviceLogsLoading(false);
      }
    } else if (feedbackInput.attachDeviceLogs) {
      setFeedbackInput({ ...feedbackInput, attachDeviceLogs: false });
    }
  };

  useEffect(() => {
    if (!deviceConnection) {
      clearErrorObj();
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

  const handleSubmit = async (_feedbackInput: FeedbackState) => {
    try {
      setError('');
      const checkArray: boolean[] = [];

      if (_feedbackInput.subject.trim().length === 0) {
        checkArray.push(true);
      } else {
        checkArray.push(false);
      }

      if (_feedbackInput.email.trim().length === 0) {
        checkArray.push(true);
      } else {
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        checkArray.push(!_feedbackInput.email.trim().match(emailPattern));
      }

      if (_feedbackInput.description.trim().length === 0) {
        checkArray.push(true);
      } else {
        checkArray.push(false);
      }

      if (checkArray[0] || checkArray[1] || checkArray[2]) {
        logger.info('Feedback: Verification failed');
        setFeedbackInput({
          ..._feedbackInput,
          subjectError: checkArray[0] ? 'Enter a Subject' : '',
          emailError: checkArray[1] ? 'Enter a Valid Email Address' : '',
          descriptionError: checkArray[2] ? 'Enter a description' : ''
        });
      } else {
        setSubmitting(true);

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
          attachmentUrls?: string[];
        } = {
          subject: _feedbackInput.subject,
          category: _feedbackInput.category,
          email: _feedbackInput.email,
          description: _feedbackInput.description,
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

        if (_feedbackInput.attachLogs) {
          data.desktopLogs = await getDesktopLogs();
        }
        if (_feedbackInput.attachDeviceLogs) {
          data.deviceLogs = await getDeviceLogs();
        }
        if (attachmentBuffer) {
          const { url, error } = await submitAttachment();
          if (error) {
            Analytics.Instance.event(
              Analytics.Categories.FEEDBACK,
              Analytics.Actions.ERROR
            );
            setSubmitted(false);
            setSubmitting(false);
            setError(error);
            logger.error('Feedback: Error');
            logger.error(error);
            return;
          }
          data.attachmentUrls = [url];
        }

        await feedbackServer.send(data).request();

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
      }
    } catch (error) {
      Analytics.Instance.event(
        Analytics.Categories.FEEDBACK,
        Analytics.Actions.ERROR
      );
      setSubmitted(false);
      setSubmitting(false);
      setError('Failed to submit feedback, try again later.');
      logger.error('Feedback: Error');
      logger.error(error);
    }
  };

  const handleListItem = (event: any) => {
    handleChange(event);
  };

  const isDeviceConnected = () => {
    return (
      (deviceConnection &&
        [
          DeviceConnectionState.VERIFIED,
          DeviceConnectionState.LAST_AUTH_FAILED,
          DeviceConnectionState.NEW_DEVICE,
          DeviceConnectionState.PARTIAL_STATE,
          DeviceConnectionState.IN_TEST_APP
        ].includes(deviceConnectionState)) ||
      (blockNewConnection && isDeviceAvailable)
    );
  };

  const handleOk = () => {
    setIsOpen(false);
  };

  const ENTER_KEY = 13;
  const handleKeyPress = (isMultiline?: boolean) => (event: any) => {
    if (deviceLogsLoading || submitting) {
      return;
    }

    let doSubmit = false;

    if (isMultiline) {
      doSubmit = event.keyCode === ENTER_KEY && event.shiftKey;
    } else {
      doSubmit = event.keyCode === ENTER_KEY;
    }

    if (doSubmit) {
      handleSubmit(feedbackInput);
    }
  };

  /*
  const startRecording = async () => {
    setRecording(true);
    const recorderObj = await initRecorder();
    setRecorder(recorderObj);
    setIsOpen(false);
  };
   */

  const stopRecording = async () => {
    setRecording(false);
    setIsOpen(true);
    const buffer = await stopRecorder(recorder);
    const fileType = await fileTypeFromBuffer(buffer);
    setAttachmentMimeType(fileType.mime);
    setAttachmentBuffer(buffer);
  };

  const submitAttachment = async () => {
    setUploadAttachmentStatus(1);
    try {
      const response = await feedbackServer
        .uploadAttachment({
          attachment: attachmentBuffer,
          mimeType: attachmentMimeType
        })
        .request();
      const recordingUrl = response.data.key;
      setUploadAttachmentStatus(2);
      return { url: recordingUrl as string };
    } catch (e: any) {
      logger.error('Error uploading attachment');
      logger.error(e);
      setUploadAttachmentStatus(-1);
      let error = 'Failed to upload attachment, try again later.';
      if (e?.isAxiosError) {
        if (e?.response.status === 406) {
          error =
            'Invalid attachment type, only videos and images are supported.';
        } else if (e?.response.status === 413) {
          error = 'Failed to upload attachment, attachment is too large.';
        }
      }
      return { error };
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

  const onClose = (id = '') => {
    if (id !== openId) return;
    if (deviceLogsLoading) {
      if (logRequestStatus === 2) {
        snackbar.showSnackbar('Wait while the logs are being fetched.', 'info');
        return;
      }

      if (deviceConnection) {
        cancelLogFetcher(deviceConnection);
      }
    }

    setIsOpen(false);

    Analytics.Instance.event(
      Analytics.Categories.FEEDBACK,
      Analytics.Actions.CLOSED
    );
    logger.info('Feedback: Closed');

    resetLogFetcherHooks();
    clearErrorObj();
    setOpenId('');
  };

  const getDeviceStateErrorMsg = () => {
    const defaultText = 'Looks like the device is not configured.';
    switch (deviceConnectionState) {
      case DeviceConnectionState.NOT_CONNECTED:
        return 'Connect the device to attach device logs.';
      case DeviceConnectionState.IN_BOOTLOADER:
      case DeviceConnectionState.PARTIAL_STATE:
        return 'Looks like your device was disconnected while updating.';
      case DeviceConnectionState.NEW_DEVICE:
        return 'Looks like this device is connected for the first time.';
      case DeviceConnectionState.LAST_AUTH_FAILED:
        return 'Looks like the device authentication failed the last time.';
      case DeviceConnectionState.DEVICE_NOT_READY:
        return 'Looks like the device is not in the main menu.';
      case DeviceConnectionState.UPDATE_REQUIRED:
        return 'This device is not supported on the current version of cysync.';
      case DeviceConnectionState.UNKNOWN_ERROR:
        return 'An unknown error occurred while connecting the device.';
      default:
        return defaultText;
    }
  };

  /*
  const removeAttachment = () => {
    setAttachmentBuffer(undefined);
    setAttachmentMimeType(undefined);
  };

  const getAttachmentActions = () => {
    switch (uploadAttachmentStatus) {
      case 1:
        return (
          <>
            <CustomButton disabled endIcon={<CircularProgress size={20} />}>
              Uploading
            </CustomButton>
          </>
        );
      case 2:
        return (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            {attachmentBuffer && attachmentMimeType && (
              <CustomButton disabled={submitting} onClick={removeAttachment}>
                Remove Attachment
              </CustomButton>
            )}
            <CustomButton disabled endIcon={<CheckCircle />}>
              Uploaded
            </CustomButton>
          </div>
        );
    }

    if (recording)
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%'
          }}
        >
          <CustomButton disabled endIcon={<CircularProgress size={20} />}>
            Recording
          </CustomButton>
          <CustomButton onClick={stopRecording}>Stop Recording</CustomButton>
        </div>
      );

    // Embed the recorded video from buffer
    if (attachmentBuffer && attachmentMimeType) {
      return (
        <div>
          <CustomButton onClick={removeAttachment} disabled={submitting}>
            Remove Attachment
          </CustomButton>
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%'
        }}
      >
        <CustomButton
          onClick={() => {
            attachmentEl.current.click();
          }}
        >
          Upload File
        </CustomButton>
        <input
          ref={attachmentEl}
          type="file"
          style={{ visibility: 'hidden' }}
          placeholder="upload file"
          accept="image/png, image/jpeg, video/mp4"
          onChange={async (e: any) => {
            const rawFile = e.target.files[0];
            if (
              !(
                rawFile.type.includes('image') || rawFile.type.includes('video')
              )
            ) {
              setError('Select images or videos as attachment.');
              return;
            }

            const file = new Blob([rawFile], {
              type: rawFile.type
            });
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            setAttachmentMimeType(e.target.files[0].type);
            setAttachmentBuffer(fileBuffer);
          }}
        />
        <CustomButton onClick={startRecording}>Start Recording</CustomButton>
      </div>
    );
  };

  const getAttachmentComponent = () => {
    if (attachmentBuffer && attachmentMimeType) {
      const sourceString = `data:${attachmentMimeType};base64,${attachmentBuffer.toString(
        'base64'
      )}`;

      if (attachmentMimeType.includes('video')) {
        return (
          <video controls style={{ width: '100%', marginTop: '4px' }}>
            <source type={attachmentMimeType} src={sourceString} />
          </video>
        );
      } else {
        return (
          <img
            src={sourceString}
            alt="attachment"
            style={{ width: '100%', marginTop: '4px' }}
          />
        );
      }
    }
  };
   */

  return (
    <>
      <DialogBox
        fullWidth
        maxWidth="sm"
        isClosePresent
        open={isOpen}
        handleClose={() => onClose(openId)}
        restComponents={
          <Root container>
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
                    onKeyDown={handleKeyPress(false)}
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
                    onKeyDown={handleKeyPress(false)}
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
                      sx={{
                        paddingLeft: '14px'
                      }}
                      value={feedbackInput.category}
                      onChange={handleListItem}
                      IconComponent={iconDropDown}
                      name="category"
                      input={
                        <BootstrapInput
                          classes={{
                            root: classes.root,
                            input: classes.input
                          }}
                        />
                      }
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
                    onKeyDown={handleKeyPress(true)}
                  />
                  {feedbackInput.descriptionError.length > 0 && (
                    <Typography
                      variant="caption"
                      style={{ color: theme.palette.error.main }}
                    >
                      {feedbackInput.descriptionError}
                    </Typography>
                  )}
                  {/* <Grid container> */}
                  {/*   <Grid item xs={12}> */}
                  {/*     {getAttachmentActions()} */}
                  {/*     {getAttachmentComponent()} */}
                  {/*   </Grid> */}
                  {/* </Grid> */}

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
                      {isDeviceConnected && !isDeviceUpdating && (
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
                      {isDeviceUpdating && (
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
                            {'Device is busy.'}
                          </Typography>
                        </Grid>
                      )}
                      {errorObj.isSet && (
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
                            {errorObj.getMessage()}
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
                            Confirm the request on device.
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
                    <CustomButton
                      disabled={deviceLogsLoading || submitting || recording}
                      onClick={() => {
                        handleSubmit(feedbackInput);
                      }}
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
          </Root>
        }
      />
      <FeedbackContext.Provider
        value={{
          showFeedback,
          closeFeedback: onClose,
          submitFeedback: handleSubmit,
          isRecording: recording,
          stopRecording
        }}
      >
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
