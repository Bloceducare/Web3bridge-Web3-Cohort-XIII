

// // app/page.tsx (Dashboard/Main Page)
// import Dashboard from '@/components/Dashboard'

// export default function Home() {
//   return <Dashboard />
// }

// // app/positions/page.tsx (Positions/History Page)
// import Positions from '@/components/Positions'

// export default function PositionsPage() {
//   return <Positions />
// }

// // components/Dashboard.tsx (Main dashboard component)
// 'use client'
// import { useState } from 'react'
// import Link from 'next/link'

// export default function Dashboard() {
//   const [walletConnected, setWalletConnected] = useState(false)
//   const [stakeAmount, setStakeAmount] = useState('')

//   return (
//     <div>
//       <h1>Staking Dashboard</h1>
      
//       <div>
//         <Link href="/positions">View Positions</Link>
//         <button onClick={() => setWalletConnected(!walletConnected)}>
//           {walletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
//         </button>
//       </div>

//       <div>
//         <p>Current APR: 12.00%</p>
//         <p>Total Staked: 1,234,567</p>
//         <p>Reward Rate: 0.032%/day</p>
//       </div>

//       <div>
//         <h2>Stake Tokens</h2>
//         <input
//           type="number"
//           value={stakeAmount}
//           onChange={(e) => setStakeAmount(e.target.value)}
//           placeholder="Enter amount"
//         />
//         <button disabled={!walletConnected}>Stake</button>
//       </div>

//       <div>
//         <h2>Your Position</h2>
//         <p>Staked: 10,000 TOKENS</p>
//         <p>Pending Rewards: 234.56 TOKENS</p>
//         <p>Unlock in: 5 days 12 hours</p>
//         <button disabled={!walletConnected}>Claim Rewards</button>
//         <button disabled={!walletConnected}>Emergency Withdraw</button>
//       </div>
//     </div>
//   )
// }

// // components/Positions.tsx (Positions page component)
// 'use client'
// import Link from 'next/link'

// export default function Positions() {
//   return (
//     <div>
//       <h1>Stake Positions</h1>
//       <Link href="/">Back to Dashboard</Link>

//       <div>
//         <h2>Your Stakes</h2>
//         <table>
//           <tr>
//             <th>Amount</th>
//             <th>Rewards</th>
//             <th>Status</th>
//             <th>Action</th>
//           </tr>
//           <tr>
//             <td>10,000 TOKENS</td>
//             <td>234.56 TOKENS</td>
//             <td>Locked</td>
//             <td><button disabled>5d 12h left</button></td>
//           </tr>
//           <tr>
//             <td>5,000 TOKENS</td>
//             <td>145.23 TOKENS</td>
//             <td>Unlocked</td>
//             <td><button>Withdraw</button></td>
//           </tr>
//         </table>
//       </div>

//       <div>
//         <h2>All Stakes</h2>
//         <table>
//           <tr>
//             <th>User</th>
//             <th>Amount</th>
//             <th>Status</th>
//           </tr>
//           <tr>
//             <td>0x1234...5678</td>
//             <td>50,000 TOKENS</td>
//             <td>Active</td>
//           </tr>
//           <tr>
//             <td>0xabcd...efgh</td>
//             <td>25,000 TOKENS</td>
//             <td>Locked</td>
//           </tr>
//         </table>
//       </div>
//     </div>
//   )
// }