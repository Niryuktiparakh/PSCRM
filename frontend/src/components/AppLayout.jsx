import SideNav from "./SideNav";
import TopBar from "./TopBar";

export default function AppLayout({ title, children }) {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <SideNav />
      <main className="ml-[240px] min-h-screen">
        <TopBar title={title} />
        <div className="p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
