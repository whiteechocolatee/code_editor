import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localforage from 'localforage';

const fileCache = localforage.createInstance({
  name: 'filecache',
});

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      //  This code block is defining a plugin for esbuild that handles resolving of module paths. The
      // `build.onResolve` function is called whenever esbuild tries to resolve a module path. The function
      // takes a filter and a callback function. The filter in this case is '/.*/', which matches all
      // paths. The callback function is an async function that takes an `args` object as its argument. The
      // function checks if the path is 'index.js' and returns the path and namespace 'a' if it is. If the
      // path includes './' or '../', it constructs a URL using the path and the resolveDir property of the
      // args object, and returns the URL and namespace 'a'. Otherwise, it constructs a URL using the path
      // and returns the URL and namespace 'a'.
      build.onResolve(
        { filter: /.*/ },
        async (args: any) => {
          console.log('onResolve', args);
          if (args.path === 'index.js') {
            return { path: args.path, namespace: 'a' };
          }

          if (
            args.path.includes('./') ||
            args.path.includes('../')
          ) {
            return {
              namespace: 'a',
              path: new URL(
                args.path,
                'https://unpkg.com' + args.resolveDir + '/',
              ).href,
            };
          }

          return {
            namespace: 'a',
            path: `https://unpkg.com/${args.path}`,
          };
        },
      );

      //  This code block is defining a plugin for esbuild that handles loading of modules. The
      // `build.onLoad` function is called whenever esbuild tries to load a module. The function takes a
      // filter and a callback function. The filter in this case is '/.*/', which matches all paths. The
      // callback function is an async function that takes an `args` object as its argument.

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);

        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: `
              const message = require('react')
              console.log(message)
            `,
          };
        }

        const cachedResult = await fileCache.getItem(
          args.path,
        );

        if (cachedResult) {
          return cachedResult;
        }

        const { data, request } = await axios.get(
          args.path,
        );

        const result = {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL)
            .pathname,
        };

        await fileCache.setItem(args.path, result);

        return result;
      });
    },
  };
};
