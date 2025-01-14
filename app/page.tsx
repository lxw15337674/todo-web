import { redirect } from 'next/navigation';
import { Apps } from './RouterConfig';

export default function Home() {
  return redirect(Apps[0].url);
}
