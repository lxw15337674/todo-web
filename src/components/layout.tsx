import { Alert, Fade, Snackbar } from '@mui/material';
import Header from '../../app/Header';
import type { ReactNode } from 'react';
import { useNotificationStore } from 'store/notification';

export default function Layout({ children }: { children: ReactNode }) {
  const { open, message, close } = useNotificationStore();
  return (
    <>
      <Header />
      <main>{children}</main>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={() => {
          close();
        }}
        TransitionComponent={Fade}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
}
