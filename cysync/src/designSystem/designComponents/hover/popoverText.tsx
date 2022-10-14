import { TypographyProps } from '@mui/material';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

type MouseOverProps = {
  text?: any;
  children?: any;
  hoverText: string;
  color?: TypographyProps['color'];
  variant?: TypographyProps['variant'];
  className?: TypographyProps['className'];
  style?: TypographyProps['style'];
};

const PopOverText: React.FC<MouseOverProps> = props => {
  const { children, text, hoverText, variant } = props;
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
    <>
      <Typography
        variant={variant}
        aria-owns={open ? 'mouse-over-popover' : undefined}
        aria-haspopup="true"
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
        color={props.color}
        style={props.style}
        className={props.className}
        noWrap={true}
      >
        {children || text}
      </Typography>
      <Popover
        id="mouse-over-popover"
        sx={{
          pointerEvents: 'none'
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
        <Typography sx={{ p: 1 }} variant="body2">
          {hoverText}
        </Typography>
      </Popover>
    </>
  );
};

PopOverText.propTypes = {
  text: PropTypes.any,
  children: PropTypes.any,
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
