import { useEffect, useMemo, useState } from 'react'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
  useChains,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { parseUnits, formatUnits, zeroAddress } from 'viem'
import { CONTRACT_ABI } from './config/ABI.ts'

const STAKING_ADDRESS = (import.meta as any).env.VITE_STAKING_CONTRACT as `0x${string}`
const STAKING_TOKEN = (import.meta as any).env.VITE_STAKING_TOKEN as `0x${string}`

const ERC20_ABI = [
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [{ type: 'bool' }] },
]

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <li className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </li>
  )
}

function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white/70 backdrop-blur shadow-sm ${className}`}>
      {title && (
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

function truncateAddress(addr: string) {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

function App() {
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'your' | 'all'>('your')
  const [positionIdInput, setPositionIdInput] = useState('')

 
  const { address, isConnected, chain } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, status: connectStatus, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const chains = useChains()

  const onSwitchToSepolia = () => {
    switchChain({ chainId: sepolia.id })
  }

  const { data: tokenDecimals } = useReadContract({
    abi: ERC20_ABI as any,
    address: STAKING_TOKEN,
    functionName: 'decimals',
  })

  const { data: tokenBalance } = useReadContract({
    abi: ERC20_ABI as any,
    address: STAKING_TOKEN,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  } as any)

  const { data: tokenAllowance } = useReadContract({
    abi: ERC20_ABI as any,
    address: STAKING_TOKEN,
    functionName: 'allowance',
    args: address ? [address, STAKING_ADDRESS] : undefined,
    query: { enabled: Boolean(address) },
  } as any)

  const { data: totalStaked } = useReadContract({ abi: CONTRACT_ABI as any, address: STAKING_ADDRESS, functionName: 'totalStaked' })
  const { data: rewardRate } = useReadContract({ abi: CONTRACT_ABI as any, address: STAKING_ADDRESS, functionName: 'rewardRate' })
  const { data: protocolAprBps } = useReadContract({ abi: CONTRACT_ABI as any, address: STAKING_ADDRESS, functionName: 'protocolAprBps' })
  // const { data: nextPositionId } = useReadContract({ abi: CONTRACT_ABI as any, address: STAKING_ADDRESS, functionName: 'nextPositionId' })

 
  const { data: userPositionIds } = useReadContract({
    abi: CONTRACT_ABI as any,
    address: STAKING_ADDRESS,
    functionName: 'getUserPositionIds',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  } as any)

  useEffect(() => {
    if (!positionIdInput && Array.isArray(userPositionIds) && userPositionIds.length > 0) {
      setPositionIdInput(String(userPositionIds[0]))
    }
  }, [userPositionIds, positionIdInput])

  const decimals = Number(tokenDecimals ?? 18)
  const amountWei = useMemo(() => {
    try {
      return amount ? parseUnits(amount as `${number}`, decimals) : 0n
    } catch {
      return 0n
    }
  }, [amount, decimals])

  const balanceFormatted = useMemo(() => (tokenBalance != null ? Number(formatUnits(tokenBalance as any, decimals)) : undefined), [tokenBalance, decimals])

   
  const { data: hashApprove, writeContract: writeApprove, status: statusApprove } = useWriteContract()
  const { data: hashAction, writeContract: writeAction, status: statusAction } = useWriteContract()
  const { isLoading: isWaitingApprove } = useWaitForTransactionReceipt({ hash: hashApprove as any })
  const { isLoading: isWaitingAction } = useWaitForTransactionReceipt({ hash: hashAction as any })

  const onConnect = () => {
    const injected = connectors.find((c) => c.id === 'io.metamask' || c.type === 'injected') || connectors[0]
    if (injected) connect({ connector: injected })
  }

  const wrongNetwork = isConnected && chainId !== sepolia.id

  const needApproval = useMemo(() => {
    if (!isConnected) return false
    if (amountWei === 0n) return false
    try {
      return (tokenAllowance as any ?? 0n) < amountWei
    } catch {
      return true
    }
  }, [isConnected, amountWei, tokenAllowance])

  const handleMax = () => {
    if (balanceFormatted != null) setAmount(String(balanceFormatted))
  }

  const handleStake = async () => {
    if (!isConnected || wrongNetwork || amountWei === 0n) return
    try {
      if (needApproval) {
        writeApprove({ abi: ERC20_ABI as any, address: STAKING_TOKEN, functionName: 'approve', args: [STAKING_ADDRESS, amountWei] })
        return
      }
      writeAction({ abi: CONTRACT_ABI as any, address: STAKING_ADDRESS, functionName: 'stake', args: [amountWei] })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (hashApprove && !isWaitingApprove && needApproval) {
      if (amountWei > 0n) {
        try {
          writeAction({ abi: CONTRACT_ABI as any, address: STAKING_ADDRESS, functionName: 'stake', args: [amountWei] })
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [hashApprove, isWaitingApprove, needApproval, amountWei, writeAction])

  const selectedPositionId = useMemo(() => {
    const n = BigInt(Number(positionIdInput || '0'))
    return n > 0n ? n : undefined
  }, [positionIdInput])

  const handleWithdraw = () => {
    if (!isConnected || wrongNetwork || !selectedPositionId) return
    writeAction({ abi: CONTRACT_ABI as any, address: STAKING_ADDRESS, functionName: 'withdraw', args: [selectedPositionId] })
  }

  const handleClaim = () => {
    if (!isConnected || wrongNetwork || !selectedPositionId) return
    writeAction({ abi: CONTRACT_ABI as any, address: STAKING_ADDRESS, functionName: 'claimRewards', args: [selectedPositionId] })
  }

  const handleEmergency = () => {
    if (!isConnected || wrongNetwork || !selectedPositionId) return
    writeAction({ abi: CONTRACT_ABI as any, address: STAKING_ADDRESS, functionName: 'emergencyWithdraw', args: [selectedPositionId] })
  }

  const userIdsArray = useMemo(() => (Array.isArray(userPositionIds) ? (userPositionIds as any[]).map((x) => BigInt(x)) : []), [userPositionIds])
  const userGetPositionContracts = useMemo(
    () => userIdsArray.map((id) => ({ abi: CONTRACT_ABI as any, address: STAKING_ADDRESS, functionName: 'getPosition', args: [id] as any })),
    [userIdsArray],
  )
  const { data: userPositionsData } = useReadContracts({ contracts: userGetPositionContracts, query: { enabled: userIdsArray.length > 0 } } as any)

  const { data: pendingRewards } = useReadContract({
    abi: CONTRACT_ABI as any,
    address: STAKING_ADDRESS,
    functionName: 'pendingRewards',
    args: selectedPositionId ? [selectedPositionId] : undefined,
    query: { enabled: Boolean(selectedPositionId) },
  } as any)

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-sky-400/20 to-teal-300/20" />
        <div className="w-full px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-sky-500 text-white font-bold">S</div>
              <div>
                <p className="text-lg font-semibold tracking-tight">Staking dApp</p>
                <p className="text-xs text-gray-600">{chains.find((c) => c.id === sepolia.id)?.name ?? 'Sepolia'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {wrongNetwork && (
                <button
                  onClick={onSwitchToSepolia}
                  disabled={isSwitching}
                  className="rounded-lg border border-yellow-400 bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-200 disabled:opacity-60"
                >
                  {isSwitching ? 'Switching…' : 'Switch to Sepolia'}
                </button>
              )}

              {!isConnected ? (
                <button
                  onClick={onConnect}
                  disabled={connectStatus === 'pending'}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                >
                  {connectStatus === 'pending' ? 'Connecting…' : 'Connect Wallet'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white/70 px-3 py-2 text-sm text-gray-800 border">{truncateAddress(address!)}</span>
                  <button onClick={disconnect} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>

          {connectError && (
            <div className="mb-3 rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {connectError.message}
            </div>
          )}

          {wrongNetwork && (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              You are connected to <b>{chain?.name ?? 'Unknown'}</b>. Please switch to Sepolia to interact.
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="w-full px-4 md:px-6 lg:px-8 py-8 h- ">
        <div className="grid gap-6 md:grid-cols-3">
          <Card title="Stake" className="md:col-span-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-gray-600">Amount</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={handleMax} className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">MAX</button>
                </div>
                <p className="mt-2 text-xs text-gray-500">Available: {balanceFormatted != null ? balanceFormatted.toLocaleString() : '—'}</p>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleStake}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white shadow hover:bg-emerald-700 disabled:opacity-60"
                  disabled={!isConnected || wrongNetwork || amountWei === 0n || statusApprove === 'pending' || statusAction === 'pending' || isWaitingApprove || isWaitingAction}
                >
                  {needApproval ? (statusApprove === 'pending' || isWaitingApprove ? 'Approving…' : 'Approve & Stake') : (statusAction === 'pending' || isWaitingAction ? 'Staking…' : 'Stake')}
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button onClick={handleWithdraw} className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-60" disabled={!isConnected || wrongNetwork || !selectedPositionId || statusAction === 'pending' || isWaitingAction}>Withdraw</button>
              <button onClick={handleClaim} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60" disabled={!isConnected || wrongNetwork || !selectedPositionId || statusAction === 'pending' || isWaitingAction}>Claim Rewards</button>
              <button onClick={handleEmergency} className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700 disabled:opacity-60" disabled={!isConnected || wrongNetwork || !selectedPositionId || statusAction === 'pending' || isWaitingAction}>Emergency Withdraw</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">Position ID</label>
                <input
                  type="number"
                  min="0"
                  value={positionIdInput}
                  onChange={(e) => setPositionIdInput(e.target.value)}
                  placeholder="Enter Position ID"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-2 text-xs text-gray-500">Pending rewards: {pendingRewards != null ? Number(formatUnits(pendingRewards as any, decimals)).toLocaleString() : '—'}</p>
              </div>
            </div>
          </Card>

          <Card title="Protocol Stats">
            <ul className="space-y-2">
              <StatItem label="Total Staked" value={totalStaked != null ? Number(formatUnits(totalStaked as any, decimals)).toLocaleString() : '—'} />
              <StatItem label="Reward Rate" value={rewardRate != null ? `${Number(formatUnits(rewardRate as any, decimals)).toLocaleString()} / sec` : '—'} />
              <StatItem label="Current APR" value={protocolAprBps != null ? `${(Number(protocolAprBps) / 100).toFixed(2)}%` : '—'} />
            </ul>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setActiveTab('your')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    activeTab === 'your' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Your Positions
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    activeTab === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  All Positions
                </button>
              </div>
              <div className="text-xs text-gray-500">Updated just now</div>
            </div>

            <div className="mt-4">
              {activeTab === 'your' ? (
                <div className="grid gap-3">
                  {userIdsArray.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">You have no positions yet. Stake to get started.</div>
                  )}
                  {Array.isArray(userPositionsData) && userPositionsData.map((res: any, idx: number) => {
                    const id = userIdsArray[idx]
                    const [owner_, amount_, start_, unlock_] = res?.result ?? []
                    if (!owner_ || owner_ === zeroAddress) return null
                    return (
                      <div key={String(id)} className="rounded-lg border p-4 bg-white/70">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">Position #{String(id)}</div>
                          <button className="text-xs underline" onClick={() => setPositionIdInput(String(id))}>Use for actions</button>
                        </div>
                        <ul className="mt-2 text-sm text-gray-700">
                          <li>Amount: {Number(formatUnits(amount_ as any, decimals)).toLocaleString()}</li>
                          <li>Unlock: {unlock_ ? new Date(Number(unlock_) * 1000).toLocaleString() : '—'}</li>
                        </ul>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <AllPositions
                  stakingAddress={STAKING_ADDRESS}
                  decimals={decimals}
                />
              )}
            </div>
          </Card>

          <Card title="Helpful Info">
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600">
              <li>Rewards accrue over time and can be claimed anytime after lock.</li>
              <li>Emergency withdraw may forfeit rewards depending on contract rules.</li>
              <li>Ensure you are connected to Sepolia before interacting.</li>
            </ul>
          </Card>
        </div>

        <footer className="mt-12 border-t pt-6 text-center text-sm text-gray-500">Made with ❤️ for Web3bridge</footer>
      </main>
    </div>
  )
}

export default App

function AllPositions({ stakingAddress, decimals }: { stakingAddress: `0x${string}`; decimals: number }) {
  const { data: nextPositionId } = useReadContract({ abi: CONTRACT_ABI as any, address: stakingAddress, functionName: 'nextPositionId' }) as any
  const count = Math.min(Number(nextPositionId ?? 0n), 25) // limit to 25 for demo
  const ids = useMemo(() => Array.from({ length: count > 0 ? count : 0 }, (_, i) => BigInt(i + 1)), [count])
  const contracts = useMemo(
    () => ids.map((id) => ({ abi: CONTRACT_ABI as any, address: stakingAddress, functionName: 'getPosition', args: [id] as any })),
    [ids, stakingAddress],
  )
  const { data } = useReadContracts({ contracts, query: { enabled: ids.length > 0 } } as any)
  if (!ids.length) {
    return <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">No active positions found.</div>
  }
  return (
    <div className="grid gap-3">
      {Array.isArray(data) && data.map((res: any, idx: number) => {
        const id = ids[idx]
        const [owner_, amount_, start_, unlock_] = res?.result ?? []
        if (!owner_ || owner_ === zeroAddress) return null
        return (
          <div key={String(id)} className="rounded-lg border p-4 bg-white/70">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Position #{String(id)}</div>
            </div>
            <ul className="mt-2 text-sm text-gray-700">
              <li>Owner: {owner_}</li>
              <li>Amount: {Number(formatUnits(amount_ as any, decimals)).toLocaleString()}</li>
              <li>Unlock: {unlock_ ? new Date(Number(unlock_) * 1000).toLocaleString() : '—'}</li>
            </ul>
          </div>
        )
      })}
    </div>
  )
}
