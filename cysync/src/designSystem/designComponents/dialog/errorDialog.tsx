import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Backdrop, Collapse } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect, useRef } from 'react';

import { CyError } from '../../../errors';
import { useFeedback } from '../../../store/provider/feedbackProvider';
import logger from '../../../utils/logger';
import prevent from '../../../utils/preventPropagation';
import ErrorExclamation from '../../iconGroups/errorExclamation';
import CustomButton from '../buttons/button';
import Icon from '../icons/Icon';

import DialogBox from './dialogBox';

const PREFIX = 'errorDialog';

const classes = {
  root: `${PREFIX}-root`,
  btnCointainer: `${PREFIX}-btnCointainer`,
  report: `${PREFIX}-report`,
  advanceText: `${PREFIX}-advanceText`,
  detailedText: `${PREFIX}-detailedText`
};

const Root = styled('div')({
  [`& .${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '20rem',
    padding: '2rem',
    position: 'relative'
  },
  [`& .${classes.btnCointainer}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.report}`]: {
    position: 'absolute',
    right: 20,
    bottom: 0
  },
  [`& .${classes.advanceText}`]: {
    marginBottom: '2rem',
    padding: '15px',
    backgroundColor: '#171717',
    borderRadius: '3px',
    fontSize: '14px',
    wordBreak: 'break-all'
  },
  [`& .${classes.detailedText}`]: {
    marginBottom: '0.5rem',
    padding: '5px',
    backgroundColor: '#171717',
    borderRadius: '3px',
    fontSize: '14px'
  }
});

const Error = (props: any) => {
  const {
    text,
    handleClose,
    handleFeedbackOpen,
    actionText,
    handleAction,
    closeText,
    advanceText,
    detailedText,
    detailedCTAText,
    disableAction
  } = props;

  const [collapseTab, setCollapseTab] = React.useState(false);

  const getAdvanceText = () => {
    if (advanceText.length > 200) {
      return `${advanceText.slice(0, 200)} ...`;
    }

    return advanceText;
  };

  const getDetailedText = () => {
    const errors = detailedText.split('\n');
    return (
      <>
        {errors.map((error: any) =>
          error.length > 0 ? (
            <div className={classes.detailedText}>
              <Typography variant="caption">{error}</Typography>
            </div>
          ) : (
            <></>
          )
        )}
      </>
    );
  };

  return (
    <Root>
      <Grid container className={classes.root}>
        <Icon
          size={100}
          viewBox=" 0 0 55 55"
          iconGroup={<ErrorExclamation />}
        />
        <Typography
          color="textPrimary"
          align="center"
          style={{ margin: '0.5rem 0', whiteSpace: 'pre-line' }}
        >
          {text}
        </Typography>
        {detailedText && (
          <>
            <CustomButton
              onClick={(e: React.MouseEvent) => {
                prevent(e);
                setCollapseTab(!collapseTab);
              }}
              disabled={disableAction}
              style={{
                borderRadius: '0 0 5px 5px',
                marginBottom: '1rem',
                textTransform: 'none'
              }}
            >
              {detailedCTAText}
              {collapseTab ? <ExpandLess /> : <ExpandMore />}
            </CustomButton>
            <Collapse in={collapseTab} timeout="auto" unmountOnExit>
              <div className={classes.detailedText}>
                <Typography variant="caption">{getDetailedText()}</Typography>
              </div>
            </Collapse>
          </>
        )}
        {advanceText && (
          <div className={classes.advanceText}>
            <Typography variant="caption">{getAdvanceText()}</Typography>
          </div>
        )}
        <div className={classes.btnCointainer}>
          {!actionText && (
            <CustomButton
              disabled={disableAction}
              style={{ marginRight: '20px', textTransform: 'none' }}
              variant="outlined"
              onClick={handleClose}
              autoFocus
            >
              {closeText}
            </CustomButton>
          )}
          {actionText && (
            <CustomButton
              disabled={disableAction}
              style={{ marginRight: '20px', textTransform: 'none' }}
              variant="outlined"
              onClick={handleAction || handleClose}
              autoFocus
            >
              {actionText}
            </CustomButton>
          )}
          <CustomButton
            disabled={disableAction}
            color="primary"
            onClick={handleFeedbackOpen}
          >
            REPORT
          </CustomButton>
        </div>
      </Grid>
    </Root>
  );
};

export interface ErrorProps {
  open: boolean;
  handleClose: () => void;
  errorObj?: CyError;
  overrideErrorObj?: boolean;
  text?: string;
  actionText?: string;
  closeText?: string;
  handleAction?: () => void;
  advanceText?: string;
  flow?: string;
  detailedText?: string;
  detailedCTAText?: string;
  disableAction?: boolean;
}

const errorDialog: React.FC<ErrorProps> = ({
  open,
  handleClose,
  text,
  errorObj,
  overrideErrorObj,
  actionText,
  handleAction,
  closeText = 'Ok',
  advanceText,
  detailedText,
  detailedCTAText,
  disableAction
}: ErrorProps) => {
  const { showFeedback, closeFeedback } = useFeedback();
  const feedbackIdRef = useRef<string>('');

  useEffect(() => {
    if (errorObj?.isSet)
      logger.error(`In Error Dialog: ${errorObj.showError()}`);
  }, [errorObj]);

  const handleFeedbackOpen = () => {
    const showId = showFeedback({
      isContact: true,
      heading: 'Report',
      initFeedbackState: {
        attachLogs: true,
        attachDeviceLogs: false,
        categories: ['Report'],
        category: 'Report',
        description: errorObj?.getMessage(),
        descriptionError: '',
        email: '',
        emailError: '',
        subject: `Reporting for Error ${errorObj?.getCode()}`,
        subjectError: ``
      },
      handleClose
    });
    feedbackIdRef.current = showId;
  };

  useEffect(() => {
    return () => {
      closeFeedback(feedbackIdRef.current);
    };
  }, []);

  return (
    <DialogBox
      fullWidth
      maxWidth="sm"
      open={open}
      dialogHeading="Error"
      isClosePresent={!disableAction}
      handleClose={handleClose}
      disableBackdropClick={disableAction}
      BackdropComponent={styled(Backdrop, {
        name: 'MuiModal',
        slot: 'Backdrop',
        overridesResolver: (_props, styles) => {
          return styles.backdrop;
        }
      })({
        zIndex: -1,
        backdropFilter: 'blur(10px)',
        transition: 'none !important'
      })}
      restComponents={
        <Error
          advanceText={advanceText}
          text={overrideErrorObj ? text : errorObj?.showError()}
          closeText={closeText}
          disableAction={disableAction}
          handleClose={disableAction ? () => {} : handleClose}
          handleFeedbackOpen={disableAction ? () => {} : handleFeedbackOpen}
          actionText={actionText}
          handleAction={disableAction ? () => {} : handleAction}
          detailedText={detailedText}
          detailedCTAText={detailedCTAText}
        />
      }
    />
  );
};

export default errorDialog;
