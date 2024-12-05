'use client'
import React, { useEffect } from 'react';
import { ModeToggle } from 'src/components/ModeToggle';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { LayoutGrid } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Toaster } from './ui/toaster';
import { APPS, EfficiencyTools, Links } from '../config/RouterConfig';


export default function Header() {
  const router = usePathname();
  const currentApp = [...EfficiencyTools, ...APPS].find((app) => app.url === router);

  if (currentApp) {
    document.title = currentApp.name;
  }

  return (
    <header>
      <Toaster />
      <div
        className={
          'px-4 py-2  bg-zine-800 dark:border-zinc-800 border-b-[1px] flex items-center '
        }
      >
        <div className="mr-4 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <LayoutGrid />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {EfficiencyTools.map((app) => (
                <DropdownMenuCheckboxItem
                  onClick={() => {
                    window.location.href = app.url;
                  }}
                  checked={currentApp?.url === app.url}
                  key={app.name}
                >
                  {app.name}
                </DropdownMenuCheckboxItem>
              ))}
              <Separator />
              {APPS.map((app) => (
                <DropdownMenuCheckboxItem
                  onClick={() => {
                    window.location.href = app.url;
                  }}
                  checked={currentApp?.url === app.url}
                  key={app.name}
                >
                  {app.name}
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
          <span className="font-bold ml-2">{currentApp?.name}</span>
        </div>
        <div className="flex-1" />
        <ModeToggle />
      </div>
    </header>
  );
}