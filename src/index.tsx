import React, { useEffect } from 'react';
import styles from './styles.module.css';

interface Props {
  message?: string;
}
/**
 * Main Component
 */
function Greeting(props: Props) {
  useEffect(() => {
    console.log('Incoming message: ', props.message);
  }, [props.message]);

  return (
    <div className={styles.container}>{props.message ?? 'No Message'}</div>
  );
}

export default Greeting;
