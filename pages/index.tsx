import type { NextPage } from 'next';
import fs from 'fs';
import Head from 'next/head';
import styles from '../styles/Memes.module.css';
import getPath from '../helpers/file';
import { useState } from 'react';
import Header from '../components/Header';

const Board: NextPage = ({
  files,
}: {
  files: Array<{ name: string; source: string; type: string }>;
}) => {
  const [selectedFile, setSelectedFile] = useState({});

  return (
    <div className={styles.container}>
      <Head>
        <title>Soundboard</title>
        <meta name="description" content="Allemaal mooie dingen" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header
        playRandomFile={() => {
          let file = files[Math.floor(Math.random() * files.length)];
          while (file === selectedFile) {
            file = files[Math.floor(Math.random() * files.length)];
          }
          setSelectedFile(file);
        }}
        selectedFile={selectedFile}
      />

      <div className={styles.grid}>
        {files.map((file, index) => (
          <div
            key={index}
            className={styles.card}
            onClick={() => {
                //TODO make this hacky shit nicer
                setSelectedFile({name: '', source: '', type: ''});
                setTimeout(() => setSelectedFile(file), 1);
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
