import { IconButton, IconButtonProps } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import PropTypes from 'prop-types';
import React from 'react';

interface Props {
  title: string;
  color?: 'inherit' | 'primary' | 'secondary' | 'default' | undefined;
  tooltipClassName?: string | undefined;
  iconButtonClassName?: string | undefined;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: IconButtonProps['disabled'];
  placement?:
    | 'bottom-end'
    | 'bottom-start'
    | 'bottom'
    | 'left-end'
    | 'left-start'
    | 'left'
    | 'right-end'
    | 'right-start'
    | 'right'
    | 'top-end'
    | 'top-start'
    | 'top'
    | undefined;
  children?: React.ReactNode | undefined;
}

const CustomIconButton: React.FC<Props> = ({
  children,
  title,
  placement,
  color,
  tooltipClassName,
  iconButtonClassName,
  onClick,
  disabled
}: Props) => {
  return (
    <Tooltip title={title} placement={placement} className={tooltipClassName}>
      <IconButton
        color={color}
        className={iconButtonClassName}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
};

CustomIconButton.propTypes = {
  title: PropTypes.string.isRequired,
  color: PropTypes.oneOf([
    'inherit',
    'primary',
    'secondary',
    'default',
    undefined
  ]),
  tooltipClassName: PropTypes.string,
  iconButtonClassName: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  placement: PropTypes.oneOf([
    'bottom-end',
    'bottom-start',
    'bottom',
    'left-end',
    'left-start',
    'left',
    'right-end',
    'right-start',
    'right',
    'top-end',
    'top-start',
    'top',
    undefined
  ]),
  children: PropTypes.node,
  disabled: PropTypes.bool
};

CustomIconButton.defaultProps = {
  color: undefined,
  tooltipClassName: undefined,
  iconButtonClassName: undefined,
  placement: undefined,
  children: undefined,
  disabled: undefined
};

export default CustomIconButton;
