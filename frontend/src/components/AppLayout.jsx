import { useState } from "react";
import SideNav from "./SideNav";
import TopBar from "./TopBar";
import { Sheet, SheetContent } from "./ui/sheet";

export default function AppLayout({ title, children, unreadCount = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <SideNav />
      </div>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60 border-r border-black/8 bg-transparent">
          <SideNav isMobile onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="md:ml-60 flex-1 min-h-screen w-full overflow-x-hidden flex flex-col">
        <TopBar title={title} unreadCount={unreadCount} onMenuClick={() => setMobileOpen(true)} />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
