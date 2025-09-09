import './App.css'
import WalletButton from './components/WalletButton'
import StakingForm from './components/StakingForm'
import StakePositions from './components/StakePositions'
import ProtocolStats from './components/ProtocolStats'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Staking dApp</h1>
        <WalletButton />
      </header>

      <main className="app-main">
        <div className="app-section">
          <ProtocolStats />
        </div>

        <div className="app-section">
          <StakingForm />
        </div>

        <div className="app-section">
          <h2>Stake Positions</h2>
          <StakePositions />
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2024 Staking dApp - All rights reserved</p>
      </footer>
    </div>
  )
}

export default App
