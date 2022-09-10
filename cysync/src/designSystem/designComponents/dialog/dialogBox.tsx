import { DialogProps } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import ICONS from '../../iconGroups/iconConstants';
import IconButton from '../buttons/customIconButton';
import Icon from '../icons/Icon';

const PREFIX = 'DialogBox';

const classes = {
  root: `${PREFIX}-root`,
  mainView: `${PREFIX}-mainView`,
  closeButton: `${PREFIX}-closeButton`,
  headingContainer: `${PREFIX}-headingContainer`,
  heading: `${PREFIX}-heading`,
  restContainer: `${PREFIX}-restContainer`,
  fullScreen: `${PREFIX}-fullScreen`
};

const Root = styled(Dialog)(({ theme }) => ({
  [`& .${classes.root}`]: {
    height: '100vh'
  },
  [`& .${classes.mainView}`]: {
    background: theme.palette.primary.light,
    padding: `20px 0px`,
    positon: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: '10rem'
  },
  [`& .${classes.closeButton}`]: {
    position: 'absolute',
    right: '10px',
    top: '10px'
  },
  [`& .${classes.headingContainer}`]: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0px',
    margin: '0px'
  },
  [`& .${classes.heading}`]: {
    fontSize: '1.5rem',
    margin: '10px'
  },
  [`& .${classes.restContainer}`]: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    margin: 0
  },
  [`& .${classes.fullScreen}`]: {
    height: '100%',
    padding: 0,
    overflow: 'hidden !important'
  }
}));

export interface Props extends DialogProps {
  handleClose: () => void;
  dialogHeading?: string | undefined;
  restComponents?: string | undefined | JSX.Element | JSX.Element[];
  isClosePresent?: boolean | undefined;
  noBottomPadding?: boolean;
  disableBackdropClick?: boolean;
}

const DialogBox: React.FC<Props> = ({
  fullWidth,
  maxWidth,
  open,
  handleClose,
  dialogHeading,
  restComponents,
  TransitionComponent,
  BackdropComponent,
  fullScreen,
  isClosePresent,
  noBottomPadding,
  disableBackdropClick,
  ...rest
}: Props) => {
  const onClose: DialogProps['onClose'] = (_event, reason) => {
    if (reason === 'backdropClick' && !disableBackdropClick) {
      handleClose();
      return;
    }

    if (reason === 'escapeKeyDown' && !rest.disableEscapeKeyDown) {
      handleClose();
      return;
    }
  };
  const [bottomMarginStyle, setBottomMarginStyle] =
    useState<React.CSSProperties>({});

  useEffect(() => {
    const transactionScreens = ['Add Coin(s)', 'Send', 'Receive'];
    if (transactionScreens.includes(dialogHeading))
      setBottomMarginStyle({ marginBottom: '30px' });
  }, []);

  return (
    <Root
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      open={open}
      scroll="body"
      onClose={onClose}
      TransitionComponent={TransitionComponent}
      BackdropComponent={BackdropComponent}
      fullScreen={fullScreen}
      className={classes.root}
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
            <Icon
              icon={ICONS.close}
              color="#cccccc"
              viewBox="0 0 14 14"
              style={{
                display: 'inline-block',
                verticalAlign: 'middle'
              }}
            />
          </IconButton>
        ) : null}

        <div className={classes.headingContainer}>
          <Typography
            className={classes.heading}
            variant="h3"
            color="textPrimary"
            style={bottomMarginStyle}
          >
            {dialogHeading}
          </Typography>
        </div>
        <div className={classes.restContainer}>{restComponents}</div>
      </div>
    </Root>
  );
};

export default DialogBox;
