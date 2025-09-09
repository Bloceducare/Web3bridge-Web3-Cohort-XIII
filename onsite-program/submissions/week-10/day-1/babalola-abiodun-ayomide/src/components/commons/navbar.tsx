import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar() { 
    return (
        <nav className="bg-gray-100 dark:bg-gray-900 shadow-sm flex items-center justify-between p-1 w-full bg-gray-100 p-3">
            <p className="text-[1.4rem] bold">Staketh</p>
            <ConnectButton/>
        </nav>
    )
}