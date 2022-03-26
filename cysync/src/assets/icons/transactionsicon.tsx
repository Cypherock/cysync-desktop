import PropTypes from 'prop-types';
import React from 'react';

const TransactionsIcon = ({ style }: any) => {
  return (
    <svg
      width="15"
      height="13"
      viewBox="0 0 100 100"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        id="57.-Exchange"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M56.8085106,33.6765957 L56.8085106,49.387234 L82.3404255,26.5106383 L56.8085106,2 L56.8085106,15.6170213 C26.9361702,15.6170213 21.0638298,51.0212766 21.0638298,51.0212766 C29.5212766,35.1914894 40.5957447,33.6765957 56.8085106,33.6765957 Z"
          id="Layer-1"
          stroke="#FFFFFF"
          style={style}
          strokeWidth="4"
          fill="#FFFFFF"
        />
        <path
          d="M53.7446809,79.7617021 L53.7446809,95.4723404 L79.2765957,72.5957447 L53.7446809,48.0851064 L53.7446809,61.7021277 C23.8723404,61.7021277 18,97.106383 18,97.106383 C26.4574468,81.2765957 37.5319149,79.7617021 53.7446809,79.7617021 Z"
          id="Layer-2"
          stroke="#FFFFFF"
          style={style}
          strokeWidth="4"
          fill="#FFFFFF"
          transform="translate(48.638298, 72.595745) scale(-1, -1) translate(-48.638298, -72.595745) "
        />
      </g>
    </svg>
  );
};

TransactionsIcon.propTypes = {
  style: PropTypes.object.isRequired
};

export default TransactionsIcon;
