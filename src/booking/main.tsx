import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/jetbrains-mono';
import '../styles.css';
import '../styles/booking.css';
import { ManagePage } from './ManagePage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ManagePage />
  </StrictMode>,
);
