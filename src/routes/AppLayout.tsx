import { Outlet } from "react-router-dom";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function AppLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">

      {/* Top Bar */}
      <Header />
      {/* Page content */}
      <main id="main" className="container mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer className="mt-auto" />
    </div>
  );
}