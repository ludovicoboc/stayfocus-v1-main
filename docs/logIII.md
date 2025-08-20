Uncaught Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
    getRootForUpdatedFiber webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:3852
    enqueueConcurrentHookUpdate webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:3812
    dispatchSetStateInternal webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:6516
    dispatchSetState webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:6477
    useCallback webpack-internal:///(app-pages-browser)/./node_modules/@radix-ui/react-presence/dist/index.mjs:163
    setRef webpack-internal:///(app-pages-browser)/./node_modules/@radix-ui/react-presence/node_modules/@radix-ui/react-compose-refs/dist/index.mjs:11
stitched-error.ts:23:20
