export const Errors = {
  InvalidAddress: "InvalidAddress",
  UserNotFound: (id: number) => `UserNotFound(${id})`,
  InvalidSalaryAmount: "InvalidSalaryAmount",
  UserNotEmployed: (id: number) => `UserNotEmployed(${id})`,
  InsufficientBalance: (required: string, available: string) => `InsufficientBalance(${required}, ${available})`,
  NameCannotBeEmpty: "NameCannotBeEmpty",
  SalaryExceedsAgreedAmount: (requested: string, agreed: string) => `SalaryExceedsAgreedAmount(${requested}, ${agreed})`,
  UserAlreadyRegistered: (user: string) => `UserAlreadyRegistered(${user})`
}