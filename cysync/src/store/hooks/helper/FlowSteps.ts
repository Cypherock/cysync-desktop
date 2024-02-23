export enum ReceiveFlowSteps {
  EnterPin,
  TapCard,
  VerifyReceiveAddress,
  Completed
}

export enum SendFlowSteps {
  Waiting,
  VerifySendAddress,
  EnterPin,
  TapCard,
  SignTransaction,
  Completed
}
