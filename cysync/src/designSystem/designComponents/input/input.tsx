import { TextField, TextFieldProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const LightTextField = styled(TextField)(({ theme }) => ({
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
  '& .MuiInput-input': {
    padding: '15px 14px'
  }
}));

const DefaultTextField = styled(TextField)(({ theme }) => ({
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
}));

export interface InputProps {
  styleType?: string;
}

const Input = (props: TextFieldProps & InputProps) => {
  const { styleType, ...inputProps } = props;

  return styleType === 'light' ? (
    <LightTextField variant="outlined" {...inputProps} />
  ) : (
    <DefaultTextField variant="outlined" {...inputProps} />
  );
};

export default Input;
