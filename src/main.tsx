
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize Supabase storage on app start
import { ensureStorageBucketExists } from '@/integrations/supabase/storage';
ensureStorageBucketExists().then(result => {
  console.log('Storage bucket initialization:', result ? 'Success' : 'Failed');
});

createRoot(document.getElementById("root")!).render(<App />);
