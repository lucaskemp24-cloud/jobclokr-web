import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <TopBar />

        <main className="flex-1 bg-slate-100 dark:bg-slate-900 p-10">
          {children}
        </main>
      </div>
    </div>
  );
}