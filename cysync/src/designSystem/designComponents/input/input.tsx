import { TextField } from '@material-ui/core';
import { Theme, withStyles } from '@material-ui/core/styles';
import React from 'react';

const CssTextField = withStyles((theme: Theme) => ({
  root: {
    '& label.Mui-focused': {
      color: theme.palette.text.primary
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: theme.palette.text.primary
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: theme.palette.text.secondary
      },
      '&:hover fieldset': {
        borderColor: theme.palette.text.primary
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.text.primary
      }
    },
    '&&& $input': {
      padding: '15px 14px'
    }
  }
}))(TextField);
const LightCssTextField = withStyles((theme: Theme) => ({
  root: {
    '& label.Mui-focused': {
      color: theme.palette.text.primary
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: theme.palette.text.primary
    },
    '& .MuiOutlinedInput-root': {
      background: '#151921',
      '& fieldset': {
        borderColor: theme.palette.text.secondary
      },
      '&:hover fieldset': {
        borderColor: theme.palette.text.primary
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.text.primary
      }
    }
  }
}))(TextField);

const Input = (props: any) => {
  const { styleType } = props;
  return styleType === 'light' ? (
    <LightCssTextField variant="outlined" {...props} />
  ) : (
    <CssTextField variant="outlined" {...props} />
  );
};

export default Input;
