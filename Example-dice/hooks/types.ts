export interface OnDicePlayResponse {
  betId: string;
  payout: number;
  result: number;
  direction: string;
  correlationId: string;
  casinoSessionId: string;
}
