import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import React from 'react';

import colors from '../../designConstants/colors';
import typography from '../../designConstants/typography';

const CustomButton = withStyles({
  root: {
    background: colors.primary.mainColor,
    color: colors.systemColors.textAndBackground.light[100],
    textTransform: 'none',
    height: 32,
    fontSize: typography.textLabel,
    '&:hover': {
      background: colors.primary.lighter
    },
    '&:focus': {
      background: colors.primary.darker,
      border: `1px solid ${colors.primary.lighter}`
    },
    '&:active': {
      background: colors.primary.darker,
      border: 'none'
    }
  },
  disabled: {
    background: colors.systemColors.textAndBackground.light[400],
    color: `${colors.systemColors.textAndBackground.light[100]} !important`
  }
})(Button);

export interface StyleProps {
  borderRadius?: string;
}

type Props = {
  text?: string | number;
  type?: 'default' | 'round';
};

const containedButton: React.FC<Props> = ({ text }) => {
  return <CustomButton disableElevation>{text}</CustomButton>;
};

export default containedButton;
