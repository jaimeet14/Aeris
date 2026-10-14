export type RootStackParamList = {
  Home: undefined;
  Ledger: { ledgerId: string; name: string };
  /** The contact picker returns `name`, `phoneE164` and `pickedAt` so picking twice still applies. */
  AddEntry: { ledgerId?: string; name?: string; phoneE164?: string | null; pickedAt?: number };
  SettleUp: { ledgerId: string; name: string };
  Currency: { firstRun?: boolean };
  ContactsPriming: undefined;
  ContactPicker: undefined;
  Activity: undefined;
};
