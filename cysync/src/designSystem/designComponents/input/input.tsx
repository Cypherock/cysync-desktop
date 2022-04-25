import { TextField, TextFieldProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const PREFIX = 'Input';

const classes = {
  root: `${PREFIX}-root`,
  root2: `${PREFIX}-root2`
};

const CssTextField = TextField;
const LightCssTextField = TextField;

const StyledCssTextField = styled(CssTextField)(({ theme }) => ({
  [`& .${classes.root}`]: {
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
  },

  [`& .${classes.root2}`]: {
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
}));

export interface InputProps {
  styleType?: string;
}

const Input = (props: TextFieldProps & InputProps) => {
  const { styleType, ...inputProps } = props;

  return styleType === 'light' ? (
    <LightCssTextField
      variant="outlined"
      {...inputProps}
      classes={{
        root: classes.root2
      }}
    />
  ) : (
    <StyledCssTextField variant="outlined" {...inputProps} />
  );
};

export default Input;
