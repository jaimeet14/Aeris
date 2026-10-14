import { Contact, ContactField, type ContactsPermissionResponse, getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts';
import type { RawContact } from '../domain/contacts';

/**
 * The only file that touches the address book. It reads names and numbers,
 * never writes, and nothing it returns leaves the phone.
 */
export type ContactsAccess = 'granted' | 'ask' | 'blocked';

const toAccess = (r: ContactsPermissionResponse): ContactsAccess =>
  r.granted ? 'granted' : r.canAskAgain ? 'ask' : 'blocked';

export async function contactsAccess(): Promise<ContactsAccess> {
  return toAccess(await getPermissionsAsync());
}

export async function requestContactsAccess(): Promise<ContactsAccess> {
  return toAccess(await requestPermissionsAsync());
}

export async function readDeviceContacts(): Promise<RawContact[]> {
  const rows = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES] as const);
  return rows.map((row) => ({
    id: row.id,
    name: row.fullName ?? null,
    phones: (row.phones ?? []).map((p) => p.number ?? '').filter(Boolean),
  }));
}
