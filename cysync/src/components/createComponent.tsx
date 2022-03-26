import PropTypes from 'prop-types';
import React from 'react';

export interface CreateComponentProps {
  component: React.FC;
  props: object;
}

const CreateComponent: React.FC<CreateComponentProps> = ({
  component,
  props
}) => {
  const Component = component;
  return <Component {...props} />;
};

CreateComponent.propTypes = {
  component: PropTypes.func.isRequired,
  props: PropTypes.object.isRequired
};

export default CreateComponent;
