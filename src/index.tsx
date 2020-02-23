import React, { useEffect } from 'react';

interface Props {
  message?: string;
}
/**
 * Main Component
 */
function Main(props: Props) {
  useEffect(() => {
    console.log('Incoming message: ', props.message);
  }, [props.message]);
  return <div>{props.message ?? 'No Message'}</div>;
}

export default Main;
