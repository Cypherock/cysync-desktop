import Button from '@material-ui/core/Button';
import React from 'react';

type Props = {
  text?: string | number;
};

const outlinedButton: React.FC<Props> = ({ text }) => {
  return <Button>{text}</Button>;
};

export default outlinedButton;
