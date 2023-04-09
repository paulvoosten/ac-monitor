import fs from 'fs';
import Head from 'next/head';
import styles from '../styles/Memes.module.css';
import getPath from '../helpers/file';
import { LegacyRef, useEffect, useRef, useState } from 'react';

export default function Board({
  files,
}: {
  files: Array<{ name: string; source: string; type: string }>;
}) {
  const audioRef: LegacyRef<HTMLAudioElement> = useRef(null);
  const [queue, setQueue] = useState<Array<{ name: string; source: string; type: string }>>([]);
  useEffect(() => {
    if (queue.length > 0 && audioRef.current && audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [queue]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Soundboard</title>
        <meta name="description" content="Allemaal mooie dingen" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.title}>
          <h1>AdCalls Soundboard</h1>
          <button
            className={styles.button}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setQueue([...queue, files[Math.floor(Math.random() * files.length)]]);
            }}
          >
            Random
          </button>
          <button
            className={styles.button}
            disabled={!audioRef.current || queue.length === 0}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              audioRef.current?.pause();
              setQueue(queue.slice(1));
            }}
          >
            Next
          </button>
        </div>
        {queue.length > 0 && (
          <audio ref={audioRef} onEnded={() => setQueue(queue.slice(1))}>
            <source src={queue[0].source} type={queue[0].type} />
            Your browser does not support the audio element.
          </audio>
        )}
      </header>

      <div className={styles.grid}>
        {files.map((file, i) => (
          <div
            key={i}
            className={styles.card}
            onClick={() => {
              setQueue([...queue, file]);
            }}
          >
            {file.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const filetype = 'wav';
  const files = fs
    .readdirSync(getPath('public/static/audio/'))
    .filter(file => file.endsWith(`.${filetype}`))
    .map(file => ({
      name: file.replace(new RegExp(`\.${filetype}$`), ''),
      source: encodeURIComponent(`/static/audio/${file}`),
      type: `audio/${filetype}`,
    }));

  return { props: { files } };
}
