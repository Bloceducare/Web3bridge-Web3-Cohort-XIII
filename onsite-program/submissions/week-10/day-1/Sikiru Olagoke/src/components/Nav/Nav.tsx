import { ConnectKitButton } from "connectkit";
import { Link } from "react-router-dom";
function Nav() {
  return (
    <nav className="flex justify-between">
      <h1 className="text-3xl font-mono font-bold">StakeWithMe</h1>
      <ul className="flex items-center gap-8 text-[1.25rem] font-bold">
        <li className="hover:text-gray-600">
          <Link to="/stake">Stake</Link>
        </li>
        <li className="hover:text-gray-600">
          <Link to="/withdraw">Withdraw</Link>
        </li>

        <li className="hover:text-gray-600">
          <Link to="/positions">Positions</Link>
        </li>

        <li className="hover:text-gray-600">
          <Link to="/claim">Claim Reward</Link>
        </li>
      </ul>

      <ConnectKitButton />
    </nav>
  );
}

export default Nav;
