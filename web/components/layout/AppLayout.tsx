import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <main className="min-h-screen bg-[#F6F4EF] text-[#201A14]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1">
          <Topbar />
          <div className="p-8">{children}</div>
        </section>
      </div>
    </main>
  );
}