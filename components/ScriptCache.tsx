import { useRef } from 'react';

export class ScriptCache {
  private failed: Array<string>;
  private loaded: Array<string>;
  private pending: Array<string>;
  private onAdd: { [src: string]: () => void };
  private onSuccess?: () => void;

  constructor(
    scripts: Array<{ src: string; onAdd?: () => void }>,
    onSuccess?: () => void
  ) {
    this.onAdd = {};
    this.failed = [];
    this.loaded = [];
    this.pending = [];
    this.onSuccess = onSuccess;
    this.load(scripts);
  }

  private async load(scripts: Array<{ src: string; onAdd?: () => void }>) {
    scripts.forEach((script) => {
      if (script.onAdd) {
        this.onAdd[script.src] = script.onAdd;
      }
      this.loadSrc(script.src);
    });
  }

  private async loadSrc(src: string) {
    if (this.loaded.includes(src)) {
      return Promise.resolve(src);
    }
    this.pending.push(src);
    return this.addScriptElement(src)
      .then(() => {
        if (this.pending.length === 0 && this.onSuccess) {
          this.onSuccess();
        }
      })
      .catch((error) => {
        console.error(`>>> Failed to load script: ${src} <<<`, error);
      });
  }

  private async addScriptElement(src: string) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = false;
      script.src = src;
      script.type = 'text/javascript';
      script.addEventListener('load', () => {
        this.pending = this.pending.filter((pending) => pending !== src);
        this.loaded.push(src);
        resolve(script);
      });
      script.addEventListener('error', () => {
        this.pending = this.pending.filter((pending) => pending !== src);
        this.failed.push(src);
        reject(src);
      });
      document.body.appendChild(script);
      if (this.onAdd.hasOwnProperty(src)) {
        this.onAdd[src]();
      }
      return script;
    });
  }
}

export default function useScriptCache(
  load: boolean,
  scripts: Array<{ src: string; onAdd?: () => void }>,
  onSuccess?: () => void
) {
  const ref = useRef<ScriptCache>();
  if (load && !ref.current) {
    ref.current = new ScriptCache(scripts, onSuccess);
  }
}
