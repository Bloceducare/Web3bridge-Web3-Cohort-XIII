export const Errors = {
  InvalidAddress: "InvalidAddress",
  EventNotFound: (eventId: number) => `EventNotFound(${eventId})`,
  EventNotActive: (eventId: number) => `EventNotActive(${eventId})`,
  InsufficientPayment: (required: string, sent: string) => `InsufficientPayment(${required}, ${sent})`,
  NoTicketsAvailable: (eventId: number) => `NoTicketsAvailable(${eventId})`,
  NotEventCreator: (eventId: number) => `NotEventCreator(${eventId})`,
  InvalidTicketPrice: "InvalidTicketPrice",
  InvalidTicketCount: "InvalidTicketCount",
  NameCannotBeEmpty: "NameCannotBeEmpty",
};