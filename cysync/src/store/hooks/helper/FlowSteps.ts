export enum ReceiveFlowSteps {
  EnterPinAndTapCard,
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
