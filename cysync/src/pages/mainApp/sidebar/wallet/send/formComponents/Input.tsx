import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import withStyles from '@mui/styles/withStyles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
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

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: '0.2rem 0.5rem'
    },
    label: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      color: theme.palette.primary.light,
      fontSize: '0.9rem',
      marginBottom: '0.5rem'
    },
    labelText: {
      display: 'block',
      height: '100%'
    },
    input: {
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
  })
);

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
  customIconStyle
}) => {
  const classes = useStyles();

  const onInput = (event: any) => {
    let isChanged = true;
    if (type === 'number') {
      if (min !== undefined) {
        const minNum = Number(min);
        const newVal = Number(event.target.value);

        if (newVal < minNum) {
          event.target.value = min;
        }
      }

      if (decimal !== undefined) {
        const decimalPlaces = decimal;
        const newVal = event.target.value;
        const newValArr = newVal.split('.');
        let isValid = true;

        if (newValArr.length > 1 && newValArr[1].length > decimalPlaces) {
          isValid = false;
        }

        if (!isValid) {
          isChanged = false;
        }
      }
    }

    if (isChanged && onChange) onChange(event);
  };

  return (
    <div className={classes.root}>
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
        disabled={disabled}
        id={id}
        name={name}
        className={classes.input}
        type={type}
        placeholder={placeHolder}
        onChange={onInput}
        value={value}
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
          inputProps: { min, max }
        }}
      />
    </div>
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
  customIconStyle: PropTypes.object
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
  customIconStyle: undefined
};

export default Input;
