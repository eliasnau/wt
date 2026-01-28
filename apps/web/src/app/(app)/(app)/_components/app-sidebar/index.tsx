import { Sidebar } from '@/components/ui/sidebar'
import { DashboardLayout } from './dashboard'
// import { AccountLayout } from './account'
import { SidebarHeader } from './header'
import { SidebarFooter } from './footer'
import { MobileSidebarTrigger } from './mobile-sidebar-trigger'
import { usePathname } from 'next/navigation'
import { AccountSidebar } from './account'

export function AppSidebar () {
  const pathname = usePathname();

  let Content = null;
  if (pathname?.startsWith('/dashboard')) {
    Content = <DashboardLayout />;
  } else if (pathname?.startsWith('/account')) {
    Content = <AccountSidebar />
  } else {
    Content = null;
  }

  return (
    <>
      <Sidebar collapsible='icon'>
        <SidebarHeader />
        {Content}
        <SidebarFooter />
      </Sidebar>
      <MobileSidebarTrigger />
    </>
  )
}
