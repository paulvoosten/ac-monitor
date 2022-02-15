import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Component, PropsWithChildren, useState } from 'react';
import styles from '../styles/Spotify.module.css';

const ToggleMenu = ({ children }: PropsWithChildren<{}>) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className={`${styles.toggleMenu}${open ? ' ' + styles.open : ''}`}
        onClick={() => setOpen(!open)}
      >
        <FontAwesomeIcon icon={faBars} className={styles.bars} />
      </div>
      <div className={`${styles.menu}${open ? ' ' + styles.open : ''}`}>
        {children}
      </div>
    </>
  );
};

export default ToggleMenu;
