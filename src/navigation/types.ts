export type RootStackParamList = {
  Home: undefined;
  Ledger: { ledgerId: string; name: string };
  AddEntry: { ledgerId?: string; name?: string };
  SettleUp: { ledgerId: string; name: string };
  Currency: { firstRun?: boolean };
};
