import FloatingLumi from "./FloatingLumi";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <main className="flex-1 px-8 py-8">{children}</main>
        </div>
      </div>

      <FloatingLumi />
    </div>
  );
}