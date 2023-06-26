import tou from '!!html-loader!markdown-loader!../../../../../../constants/markdown/terms.md';
import PropTypes from 'prop-types';
import React from 'react';

import DialogBox from '../../../../../../designSystem/designComponents/dialog/dialogBox';
import Markdown from '../../../../../../designSystem/designComponents/textComponents/Markdown';

type PrivacyProps = {
  open: boolean;
  handleClose: () => void;
};

const Terms: React.FC<PrivacyProps> = ({ open, handleClose }) => {
  return (
    <DialogBox
      open={open}
      handleClose={handleClose}
      fullWidth
      isClosePresent
      maxWidth="md"
      dialogHeading="Terms of Use"
      restComponents={<Markdown style={{ padding: '5rem' }}>{tou}</Markdown>}
    />
  );
};

Terms.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default Terms;
