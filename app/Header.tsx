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
import { SidebarTrigger, useSidebar } from '../src/components/ui/sidebar';


export default function Header() {
  const router = usePathname();
  const currentApp = [...EfficiencyTools, ...APPS].find((app) => app.url === router);
  const {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  } = useSidebar()

  useEffect(() => {
    if (currentApp) {
      document.title = currentApp.name;
    }
  }, [router]);
  console.log(state)
  return (
    <header>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <Toaster />
      <div
        className={
          'px-4 py-2  bg-zine-800 dark:border-zinc-800 border-b-[1px] flex items-center '
        }
      >
        <div className="mr-4 flex items-center">
          <SidebarTrigger className='mr-2'/>
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
                  <Link href={app.url}>{app.name}</Link>
                </DropdownMenuCheckboxItem>
              ))}
              <Separator />
              {APPS.map((app) => (
                <DropdownMenuCheckboxItem
                  checked={currentApp?.url === app.url}
                  key={app.name}
                >
                  <Link href={app.url}>{app.name}</Link>
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
