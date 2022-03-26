import React from 'react';
import { render } from 'react-dom';

import CypherockImage from './cypherock.png';

const Loading = () => {
  return (
    <main>
      <img src={CypherockImage} />
      <div className="lds-ring">
        <div />
        <div />
        <div />
        <div />
      </div>
    </main>
  );
};

document.addEventListener('DOMContentLoaded', () =>
  render(<Loading />, document.getElementById('root'))
);
