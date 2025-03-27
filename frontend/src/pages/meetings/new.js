// pages/meetings/new.js
import dynamic from 'next/dynamic';

const NewMeetingPage = dynamic(
  () => import('@/components/NewMeetingPage'),
  { ssr: false } // skip SSR
);

export default NewMeetingPage;
