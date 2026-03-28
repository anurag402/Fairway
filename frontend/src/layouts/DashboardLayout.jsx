import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[auto_1fr] lg:px-8">
        <Sidebar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
