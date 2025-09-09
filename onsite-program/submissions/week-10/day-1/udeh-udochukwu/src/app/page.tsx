import Dashboard from "@/components/Positions";
import Navbar from "@/components/Navbar";
import PositionsPage from "@/components/PositionsPage";
import Image from "next/image";


export default function Home() {
  return (
     <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <Dashboard />
      <PositionsPage/>
    </div>
  );
}