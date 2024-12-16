'use client'
import React, { useEffect } from 'react';
import { ModeToggle } from 'src/components/ModeToggle';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../src/components/ui/dropdown-menu';
import { Button } from '../src/components/ui/button';
import { Separator } from '../src/components/ui/separator';
import { LayoutGrid } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Toaster } from '../src/components/ui/toaster';
import { APPS, EfficiencyTools, Links } from '../src/config/RouterConfig';
import Link from 'next/link';
import { SidebarTrigger } from '../src/components/ui/sidebar';
import { usePermission } from '../src/hooks/usePermission';


export default function Header() {
  usePermission();
  const router = usePathname();
  const currentApp = [...EfficiencyTools, ...APPS].find((app) => app.url === router);

  useEffect(() => {
    if (currentApp) {
      document.title = currentApp.name;
    }
  }, [router]);
  return (
    <header className="sticky top-0 z-50 bg-black">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <Toaster />
      <div
        className={
          'px-4 py-2   bg-zine-800 dark:border-zinc-800 border-b-[1px] flex items-center '
        }
      >
        <div className="mr-4 flex items-center space-x-2">

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <LayoutGrid />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {EfficiencyTools.map((app) => (
                <DropdownMenuCheckboxItem
                  checked={currentApp?.url === app.url}
                  key={app.name}
                >
                  <Link href={app.url} className='w-full'>{app.name}</Link>
                </DropdownMenuCheckboxItem>
              ))}
              <Separator />
              {APPS.map((app) => (
                <DropdownMenuCheckboxItem
                  checked={currentApp?.url === app.url}
                  key={app.name}
                >
                  <Link href={app.url} className='w-full'>{app.name}</Link>
                </DropdownMenuCheckboxItem>
              ))}
              <Separator />
              {Links.map((app) => (
                <DropdownMenuItem
                  onClick={() => {
                    window.open(app.url);
                  }}
                  key={app.name}
                >
                  {app.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="font-bold ">{currentApp?.name}</span>
          {
            currentApp?.showSidebar && <SidebarTrigger />
          }
        </div>
        <div className="flex-1" />
        <ModeToggle />
      </div>
    </header>
  );
}
