import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/jetbrains-mono';
import '../styles.css';
import { LegalPage } from './LegalPage';

const root = document.getElementById('root')!;
createRoot(root).render(
  <StrictMode>
    <LegalPage page={root.dataset.page as 'aviso-legal' | 'privacidad' | 'cookies'} />
  </StrictMode>,
);
