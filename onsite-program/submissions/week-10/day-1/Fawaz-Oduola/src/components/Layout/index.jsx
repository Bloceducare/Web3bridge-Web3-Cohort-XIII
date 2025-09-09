import { Toaster } from "sonner";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const AppLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="h-20 border-b bg-white shadow-sm">
        <div className="container mx-auto flex justify-between items-center h-full px-6">
          <span className="text-2xl font-bold text-amber-600">Cohort XIII</span>
          <ConnectButton />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full py-8">
        <div className="container mx-auto grid gap-6 md:grid-cols-2 px-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 bg-white border-t">
        <div className="container mx-auto flex items-center justify-center h-full text-sm text-gray-500">
          &copy; Cohort XIII {new Date().getFullYear()}
        </div>
      </footer>

      <Toaster position="top-right" />
    </div>
  );
};

export default AppLayout;
