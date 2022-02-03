import type { NextPage } from 'next';
import fs from 'fs';
import Head from 'next/head';
import styles from '../styles/Memes.module.css';
import getPath from '../helpers/file';
import { LegacyRef, useEffect, useRef, useState } from 'react';

const Board: NextPage = ({
  files,
}: {
  files: Array<{ name: string; source: string; type: string }>;
}) => {
  const audioRef: LegacyRef<HTMLAudioElement> = useRef(null);
  const [replay, setReplay] = useState(false);
  const [selectedFile, setSelectedFile] = useState({});
  useEffect(() => {
    if (replay) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.load();
        audioRef.current.play();
      }
      setReplay(false);
    }
  }, [replay]);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [selectedFile]);

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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              let file = files[Math.floor(Math.random() * files.length)];
              while (file === selectedFile) {
                file = files[Math.floor(Math.random() * files.length)];
              }
              setSelectedFile(file);
            }}
          >
            Random
          </button>
        </div>
        {selectedFile.source && (
          <audio ref={audioRef}>
            <source src={selectedFile.source} type={selectedFile.type} />
            Your browser does not support the audio element.
          </audio>
        )}
      </header>

      <div className={styles.grid}>
        {files.map((file, index) => (
          <div
            key={index}
            className={styles.card}
            onClick={() => {
              if (file === selectedFile) {
                setReplay(true);
              } else {
                setSelectedFile(file);
              }
            }}
          >
            {file.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Board;

export async function getStaticProps() {
  const filetype = 'wav';
  const files = fs
    .readdirSync(getPath('public/static/audio/'))
    .filter((file) => file.endsWith(`.${filetype}`))
    .map((file) => ({
      name: file.replace(new RegExp(`\.${filetype}$`), ''),
      source: encodeURIComponent(`/static/audio/${file}`),
      type: `audio/${filetype}`,
    }));

  return { props: { files } };
}
