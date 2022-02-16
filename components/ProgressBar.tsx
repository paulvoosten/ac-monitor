import styles from '../styles/Spotify.module.css';

const ProgressBar = ({
  value,
  max,
  onClick,
}: {
  value: number;
  max: number;
  onClick: (value: number) => void;
}) => {
  return (
    <input
      className={styles.progressBar}
      type="range"
      max={max}
      value={value}
      onChange={(e) => {
        onClick(Number(e.target.value));
      }}
    />
  );
};

export default ProgressBar;
