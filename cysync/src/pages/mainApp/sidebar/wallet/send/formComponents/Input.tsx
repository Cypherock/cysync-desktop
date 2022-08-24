import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { MenuItem } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { styled, Theme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import withStyles from '@mui/styles/withStyles';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import React from 'react';

import IconButton from '../../../../../../designSystem/designComponents/buttons/customIconButton';

const ValidationTextField = withStyles((theme: Theme) => ({
  root: {
    '& input': {
      color: theme.palette.info.light,
      fontSize: '1.2rem'
    },
    '& input:valid + fieldset': {
      borderColor: 'green',
      borderWidth: 2
    },
    '& input:invalid + fieldset': {
      borderColor: 'red',
      borderWidth: 2
    },
    '& input:valid:focus + fieldset': {
      borderLeftWidth: 6,
      padding: '4px !important'
    }
  }
}))(TextField);

export const StyledMenuItem = withStyles(theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0.5rem 2rem',
    fontSize: '0.9rem',
    color: theme.palette.text.secondary,
    '&:focus': {
      background: '#272A2F'
    }
  },
  selected: {
    background: '#272A2F',
    color: theme.palette.text.primary
  }
}))(MenuItem);

const PREFIX = 'WalletSendInput';

const classes = {
  root: `${PREFIX}-root`,
  label: `${PREFIX}-label`,
  labelText: `${PREFIX}-labelText`,
  input: `${PREFIX}-input`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: '0.2rem 0.5rem'
  },
  [`& .${classes.label}`]: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    color: theme.palette.primary.light,
    fontSize: '0.9rem',
    marginBottom: '0.5rem'
  },
  [`& .${classes.labelText}`]: {
    display: 'block',
    height: '100%'
  },
  [`& .${classes.input}`]: {
    width: '95%',
    background: 'rgba(0,0,0,0)',
    border: `1px solid ${'#707070'}`,
    color: theme.palette.info.light,
    boxShadow: 'none',
    padding: '1rem',
    outline: 'none',
    borderRadius: 5,
    fontWeight: 400,
    fontSize: '1rem',
    '&:hover': {
      background: 'rgba(0,0,0,0)',
      opacity: 0.9
    },
    '&:focus': {
      background: 'rgba(0,0,0,0)'
    }
  }
}));

type InputProps = {
  label?: string | undefined;
  optionalElement?: JSX.Element | undefined;
  placeHolder?: string | undefined;
  type?: string | undefined;
  onChange?: (e: any) => void;
  name?: string | undefined;
  id?: string | undefined;
  value?: string | number | undefined;
  min?: number | string | undefined;
  max?: number | string | undefined;
  decimal?: number | undefined;
  helperText?: string | undefined;
  error?: boolean;
  isClipboardPresent?: boolean;
  handleCopyFromClipboard?: (id: string) => void;
  customIcon?: JSX.Element;
  disabled?: boolean;
  customIconStyle?: object | undefined;
  showLoading?: boolean;
  items?: string[];
};

const Input: React.FC<InputProps> = ({
  label,
  optionalElement,
  type,
  id,
  value,
  disabled,
  name,
  onChange,
  placeHolder,
  max,
  min,
  decimal,
  helperText,
  error,
  isClipboardPresent,
  handleCopyFromClipboard,
  customIcon,
  customIconStyle,
  showLoading,
  items
}) => {
  const onInput = (event: any) => {
    let isChanged = true;
    if (type === 'number') {
      if (min !== undefined) {
        const minNum = new BigNumber(min);
        const newVal = new BigNumber(event.target.value);

        if (newVal.lt(minNum)) {
          event.target.value = minNum.toFixed();
        }
      }

      if (decimal !== undefined) {
        const decimalPlaces = decimal;
        const newVal = event.target.value;
        const newValArr = newVal
          .split('.')
          .map((val: string) => val.replace(/[^0-9]*/, '')); // to remove all non numeric characters
        let isValid = true;

        if (newValArr.length > 1 && newValArr[1].length > decimalPlaces) {
          isValid = false;
        }

        if (!isValid) {
          isChanged = false;
        } else {
          const wholeNumber = new BigNumber(newValArr[0] || 0).toFixed();
          if (newValArr.length > 1) {
            event.target.value = `${wholeNumber}.${newValArr[1]}`;
          } else {
            if (newVal.length <= 0) event.target.value = '';
            else event.target.value = wholeNumber;
          }
        }
      }
    }

    if (isChanged && onChange) onChange(event);
  };

  return (
    <Root className={classes.root}>
      <div className={classes.label}>
        {label && (
          <Typography color="textPrimary" className={classes.labelText}>
            {' '}
            {label}
          </Typography>
        )}
        {optionalElement}
      </div>
      <ValidationTextField
        spellCheck={false}
        onWheel={(e: any) => e.target.blur()}
        disabled={disabled}
        id={id}
        name={name}
        className={classes.input}
        type="text"
        placeholder={showLoading ? '' : placeHolder}
        onChange={onInput}
        value={showLoading ? '' : value}
        error={error}
        helperText={helperText}
        InputProps={{
          endAdornment: isClipboardPresent ? (
            <IconButton
              title="Paste from Clipboard"
              onClick={() => {
                if (handleCopyFromClipboard && id) handleCopyFromClipboard(id);
              }}
            >
              <AssignmentOutlinedIcon color="secondary" />
            </IconButton>
          ) : customIconStyle ? (
            <div style={customIconStyle} />
          ) : (
            customIcon
          ),
          startAdornment: showLoading ? (
            <CircularProgress size={30} color="secondary" />
          ) : undefined,
          inputProps: { min, max }
        }}
        select={items ? true : false}
      >
        {items &&
          items.map((item: string) => (
            <StyledMenuItem key={item} value={item}>
              {item}
            </StyledMenuItem>
          ))}
      </ValidationTextField>
    </Root>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  optionalElement: PropTypes.element,
  type: PropTypes.string,
  id: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  disabled: PropTypes.bool,
  name: PropTypes.string,
  onChange: PropTypes.func,
  placeHolder: PropTypes.string,
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  decimal: PropTypes.number,
  helperText: PropTypes.string,
  error: PropTypes.bool,
  isClipboardPresent: PropTypes.bool,
  handleCopyFromClipboard: PropTypes.func,
  customIcon: PropTypes.element,
  customIconStyle: PropTypes.object,
  showLoading: PropTypes.bool
};

Input.defaultProps = {
  label: undefined,
  optionalElement: undefined,
  type: undefined,
  id: undefined,
  value: undefined,
  disabled: undefined,
  name: undefined,
  onChange: undefined,
  placeHolder: undefined,
  max: undefined,
  min: undefined,
  decimal: undefined,
  helperText: undefined,
  error: undefined,
  isClipboardPresent: undefined,
  handleCopyFromClipboard: undefined,
  customIcon: undefined,
  customIconStyle: undefined,
  showLoading: undefined
};

export default Input;
