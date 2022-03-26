import { TypographyProps } from '@material-ui/core';
import Popover from '@material-ui/core/Popover';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    popover: {
      pointerEvents: 'none'
    },
    paper: {
      padding: theme.spacing(1)
    }
  })
);

type MouseOverProps = {
  text: string;
  hoverText: string;
  color?: TypographyProps['color'];
  variant?: TypographyProps['variant'];
  className?: TypographyProps['className'];
  style?: TypographyProps['style'];
};

const PopOverText: React.FC<MouseOverProps> = props => {
  const { text, hoverText, variant, className } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const handlePopoverOpen = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <div>
      <Typography
        variant={variant}
        aria-owns={open ? 'mouse-over-popover' : undefined}
        aria-haspopup="true"
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
        color={props.color}
        style={props.style}
        className={props.className}
        id="popOverBaseText"
      >
        <span className={className}>{text}</span>
      </Typography>
      <Popover
        id="mouse-over-popover"
        className={classes.popover}
        classes={{
          paper: classes.paper
        }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Typography variant="body2">{hoverText}</Typography>
      </Popover>
    </div>
  );
};

PopOverText.propTypes = {
  text: PropTypes.string.isRequired,
  hoverText: PropTypes.string.isRequired,
  color: PropTypes.oneOf([
    'initial',
    'inherit',
    'primary',
    'secondary',
    'textPrimary',
    'textSecondary',
    'error'
  ]),
  variant: PropTypes.oneOf([
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'subtitle1',
    'subtitle2',
    'body1',
    'body2',
    'caption',
    'button',
    'overline'
  ]),
  className: PropTypes.string
};

PopOverText.defaultProps = {
  variant: undefined,
  className: undefined
};

export default PopOverText;
