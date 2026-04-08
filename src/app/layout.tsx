import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blobby — Media to Summary',
  description: 'Upload PDFs, images, audio, or paste text. Get AI-powered summaries instantly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
