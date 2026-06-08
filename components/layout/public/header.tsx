import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <div className="grid grid-cols-3">
      <div className="flex">
        <Button variant="ghost">
          <Menu />
        </Button>
      </div>
      <div className="flex"></div>
      <div className="flex"></div>
    </div>
  );
}
