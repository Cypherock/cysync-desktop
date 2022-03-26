import { DialogProps } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import clsx from 'clsx';
import React from 'react';

import ICONS from '../../iconGroups/iconConstants';
import IconButton from '../buttons/customIconButton';
import Icon from '../icons/Icon';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      height: '100vh'
    },
    mainView: {
      background: theme.palette.primary.light,
      padding: `20px 0px`,
      positon: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '10rem'
    },
    closeButton: {
      position: 'absolute',
      right: '10px',
      top: '10px'
    },
    headingContainer: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0px',
      margin: '0px'
    },
    heading: {
      fontSize: '1.5rem',
      margin: '10px'
    },
    restContainer: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 0,
      margin: 0
    },
    fullScreen: {
      height: '100%',
      padding: 0,
      overflow: 'hidden !important'
    }
  })
);

export interface Props extends DialogProps {
  handleClose: () => void;
  dialogHeading?: string | undefined;
  restComponents?: string | undefined | JSX.Element | JSX.Element[];
  isClosePresent?: boolean | undefined;
  noBottomPadding?: boolean;
}

const DialogBox: React.FC<Props> = ({
  fullWidth,
  maxWidth,
  open,
  handleClose,
  dialogHeading,
  restComponents,
  TransitionComponent,
  fullScreen,
  isClosePresent,
  noBottomPadding,
  disableBackdropClick,
  ...rest
}: Props) => {
  const classes = useStyles();
  return (
    <Dialog
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      open={open}
      scroll="body"
      onClose={handleClose}
      TransitionComponent={TransitionComponent}
      fullScreen={fullScreen}
      className={classes.root}
      disableBackdropClick={disableBackdropClick}
      {...rest}
    >
      <div
        className={clsx(
          classes.mainView,
          fullScreen ? classes.fullScreen : ' '
        )}
        style={noBottomPadding ? { paddingBottom: '0' } : {}}
      >
        {isClosePresent ? (
          <IconButton
            title="Close"
            onClick={handleClose}
            placement="bottom-end"
            tooltipClassName={classes.closeButton}
          >
            <Icon icon={ICONS.close} color="#cccccc" viewBox="0 0 14 14" />
          </IconButton>
        ) : null}

        <div className={classes.headingContainer}>
          <Typography
            className={classes.heading}
            variant="h3"
            color="textPrimary"
          >
            {dialogHeading}
          </Typography>
        </div>
        <div className={classes.restContainer}>{restComponents}</div>
      </div>
    </Dialog>
  );
};

export default DialogBox;
