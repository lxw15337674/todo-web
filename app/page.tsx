import { redirect } from 'next/navigation';
import { EfficiencyTools } from '../src/config/RouterConfig';

export default function Home() {
  console.log(EfficiencyTools)
  return redirect(EfficiencyTools[0].url);
}
