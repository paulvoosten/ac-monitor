import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PropsWithChildren, useRef, useState } from 'react';
import { useOnClickOutside } from '../hooks/events';
import styles from '../styles/Spotify.module.css';

const ToggleMenu = ({ children }: PropsWithChildren<{}>) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));
  return (
    <div ref={ref}>
      <div
        className={`${styles.toggleMenu}${open ? ' ' + styles.open : ''}`}
        onClick={() => setOpen(!open)}
      >
        <FontAwesomeIcon icon={faBars} className={styles.bars} />
      </div>
      {open && <div className={styles.menu}>{children}</div>}
    </div>
  );
};

export default ToggleMenu;
