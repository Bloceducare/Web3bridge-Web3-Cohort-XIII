export class SimulationError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'SimulationError';
  }
}

export class InsufficientFundsError extends SimulationError {
  constructor(required: string, available: string) {
    super(`Insufficient funds. Required: ${required}, Available: ${available}`, 'INSUFFICIENT_FUNDS');
    this.name = 'InsufficientFundsError';
  }
}

export class ContractDeploymentError extends SimulationError {
  constructor(message: string, public contractName?: string) {
    super(message, 'CONTRACT_DEPLOYMENT_ERROR');
    this.name = 'ContractDeploymentError';
  }
}

export class TransactionError extends SimulationError {
  constructor(message: string, public txHash?: string) {
    super(message, 'TRANSACTION_ERROR');
    this.name = 'TransactionError';
  }
}

export class SignerError extends SimulationError {
  constructor(message: string, public requiredCount?: number, public availableCount?: number) {
    super(message, 'SIGNER_ERROR');
    this.name = 'SignerError';
  }
}

export class NetworkError extends SimulationError {
  constructor(message: string, public network?: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
} 