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
        <title>Wat heb je?</title>
        <meta name="description" content="Allemaal mooie dingen" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header selectedFile={selectedFile} />

      <div className={styles.grid}>
        {files.map((file, index) => (
          <div
            key={index}
            className={styles.card}
            onClick={() => setSelectedFile(file)}
          >
            <h2>{file.name}</h2>
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
