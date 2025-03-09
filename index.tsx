import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return <h1>Hello, world!</h1>;
}

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
