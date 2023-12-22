import { CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';
import { useState } from 'react';
import ReactPlayer from 'react-player';

export interface CustomPlayerProps {
  url: string;
}

export const CustomPlayer = ({ url }: CustomPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const loadingComponent = () => {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '4rem'
        }}
      >
        <CircularProgress color="secondary" />
      </div>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      {isLoading && loadingComponent()}
      <ReactPlayer
        style={{ opacity: isLoading ? '0' : '1' }}
        width="100%"
        url={url}
        onReady={() => setIsLoading(false)}
      />
    </div>
  );
};

CustomPlayer.propTypes = {
  url: PropTypes.string.isRequired
};
