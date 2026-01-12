import { Metadata } from 'next';
import { ImportClient } from './ImportClient';

export const metadata: Metadata = {
  title: 'Import Questions | SG Math Pal',
  description: 'Import math questions from PDF files using AI extraction',
};

export default function ImportPage() {
  return <ImportClient />;
}
