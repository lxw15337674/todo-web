import Link from 'next/link'
import { cookies } from 'next/headers'
import { Apps, Links, canAccessApp, type Role } from './RouterConfig'

export default async function Home() {
  const adminCode = process.env.EDIT_CODE;
  const galleryCode = process.env.GALLERY_EDIT_CODE;
  let role: Role = 'none';

  if (!adminCode && !galleryCode) {
    role = 'admin';
  } else {
    const cookieStore = await cookies();
    const cookieRole = cookieStore.get('auth_role')?.value;
    if (cookieRole === 'admin' || cookieRole === 'gallery') {
      role = cookieRole;
    } else if (!cookieRole && cookieStore.has('auth_token') && adminCode) {
      role = 'admin';
    }
  }

  const visibleApps = Apps.filter((app) => canAccessApp(app, role));

  return (
    <div className="container px-4 py-4 mx-auto max-w-7xl">
      <h1 className="text-2xl font-bold mb-4">应用导航</h1>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {visibleApps.map((app) => (
          <Link
            key={app.url}
            href={app.url}
            className="flex flex-col items-center justify-center p-2 rounded-lg border hover:bg-accent transition-colors"
          >
            {app.icon && <app.icon className="w-8 h-8 mb-4" />}
            <span className="text-center">{app.name}</span>
          </Link>
        ))}
      </div>

      {Links.length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-12 mb-4">外部链接</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-6 rounded-lg border hover:bg-accent transition-colors"
              >
                {link.icon && <link.icon className="w-8 h-8 mb-4" />}
                <span className="text-center">{link.name}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
