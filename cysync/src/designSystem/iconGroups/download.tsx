import * as React from 'react';
import { SVGProps } from 'react';

const Download = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={18}
    height={17}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M2.4 10.82a5.6 5.6 0 1 1 9.368-5.52H13.2a3.6 3.6 0 0 1 2 6.594M8.8 8.5v7.2m-3.2-3.2 3.2 3.2 3.2-3.2"
      stroke="#C78D4E"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Download;
