import ReactDOM from 'react-dom/client';
import * as esbuild from 'esbuild-wasm';
import { useEffect, useState, useRef } from 'react';
import { unpkgPathPlugin } from './plugins/unpkg-glupin';

const App = () => {
  const ref = useRef<any>();
  const [input, setInput] = useState('');
  const [code, setCode] = useState<any>();

  const startService = () => {
    try {
      ref.current = esbuild.initialize({
        worker: true,
        wasmURL: '/esbuild.wasm',
      });
    } catch (err) {
      throw new Error('Something went wrong');
    }
  };

  const onClick = async () => {
    if (!ref.current) {
      return;
    }
    const result = await esbuild.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(input)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      },
    });
    setCode(result.outputFiles[0].text);
  };

  useEffect(() => {
    startService();
  }, []);

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) =>
          setInput(e.target.value)
        }></textarea>
      <div>
        <button onClick={onClick}>Compile</button>
        <pre>{code}</pre>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(<App />);
