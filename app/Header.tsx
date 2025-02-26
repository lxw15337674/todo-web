'use client'
import React, { useEffect } from 'react';
import { ModeToggle } from 'src/components/ModeToggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../src/components/ui/dropdown-menu';
import { Button } from '../src/components/ui/button';
import { Separator } from '../src/components/ui/separator';
import { LayoutGrid, Github } from 'lucide-react'; // 新增导入
import { usePathname } from 'next/navigation';
import { Apps, Links } from './RouterConfig';
import Link from 'next/link';
import { usePermission } from '../src/hooks/usePermission';
import { cn } from "@/lib/utils"
import { ScrollToTop } from '../src/components/ScrollToTop';
import { ArrowUpToLine } from 'lucide-react';
export default function Header() {
  usePermission();
  const router = usePathname();
  const currentApp = Apps.find((app) => app.url === router);
  useEffect(() => {
    if (currentApp) {
      document.title = currentApp.name;
    }
  }, [router]);
  return (
    <header className="sticky left-0 right-0 top-0  z-50 bg-background border-b-0.5 border-border">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <div
        className={
          'px-4 py-2 bg-background border-b border-border flex items-center'
        }
      >
        <div className="mr-4 flex items-center space-x-2">

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <LayoutGrid />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[300px] p-4">
              <div className="grid grid-cols-3 gap-4">
                {Apps.map((app) => {
                  const Icon = app.icon;
                  return (
                    <Link
                      href={app.url}
                      key={app.name}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-md border p-2 hover:bg-accent",
                        currentApp?.url === app.url && "bg-accent"
                      )}
                    >
                      {Icon && <Icon className="mb-2 h-6 w-6" />}
                      <span className="text-xs">{app.name}</span>
                    </Link>
                  );
                })}
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-3 gap-4">
                {Links.map((app) => {
                  const Icon = app.icon;
                  return (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={app.name}
                      className="flex flex-col items-center justify-center rounded-md border p-2 hover:bg-accent"
                    >
                      {Icon && <Icon className="mb-2 h-6 w-6" />}
                      <span className="text-xs">{app.name}</span>
                    </a>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="font-bold ">{currentApp?.name}</span>
        </div>
        <div className="flex-1 " />
        <div className='space-x-2'>
          <ScrollToTop scrollTo={10} variant="outline"
            size="icon"
          >
            <ArrowUpToLine />
          </ScrollToTop>
          <ModeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              window.open('https://github.com/lxw15337674/todo-web', '_blank')
            }}
          >
            <Github />
          </Button>
        </div>
      </div>
    </header>
  );
}
