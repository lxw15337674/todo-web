import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const Loader = ({ className }: { className?: string }) => {
  return (
    <Button disabled variant="ghost">
      <Loader2 className={`animate-spin ${className}`} />
    </Button>
  );
};

export default Loader;
