import { env } from '../lib/env';
import { supabase } from '../lib/supabase';
import type { AddressRow, ProfileRow, UserRole } from '../types/database';
import { previewStore } from './previewStore';

export interface AuthSessionState {
  userId: string | null;
  email: string | null;
  profile: ProfileRow | null;
  isPreviewSession: boolean;
}

export interface SignUpInput {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AddressInput {
  id?: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  area: string;
  city: string;
  delivery_notes?: string;
  is_default: boolean;
}

export async function getAuthSessionState(): Promise<AuthSessionState> {
  if (!env.isSupabaseConfigured || !supabase) {
    const previewUser = previewStore.getState().preview_user;
    if (!previewUser) {
      return { userId: null, email: null, profile: null, isPreviewSession: true };
    }
    return {
      userId: previewUser.id,
      email:
        previewUser.role === 'admin'
          ? 'preview-admin@libertycafe.local'
          : 'preview-customer@libertycafe.local',
      profile: previewUser,
      isPreviewSession: true,
    };
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return { userId: null, email: null, profile: null, isPreviewSession: false };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role, created_at, updated_at')
    .eq('id', session.user.id)
    .maybeSingle();

  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    profile: (profile as ProfileRow | null) ?? null,
    isPreviewSession: false,
  };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthSessionState> {
  if (!env.isSupabaseConfigured || !supabase) {
    throw new Error(
      'Live authentication requires Supabase configuration. Use Preview Sign-In below for UI testing.'
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(error.message || 'Invalid email or password.');
  }
  if (!data.user) {
    throw new Error('Unable to establish user session.');
  }

  return getAuthSessionState();
}

export async function signUpCustomer(input: SignUpInput): Promise<{ requiresEmailConfirmation: boolean }> {
  if (!env.isSupabaseConfigured || !supabase) {
    throw new Error(
      'Account registration requires Supabase Auth setup. You can test customer flows using Preview Sign-In.'
    );
  }

  // Security rule: never send or allow client-supplied role during signup
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: `${env.siteUrl}/login`,
      data: {
        full_name: input.full_name.trim(),
        phone: input.phone?.trim() || null,
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Unable to create account.');
  }

  return {
    requiresEmailConfirmation: !data.session,
  };
}

export async function signOutUser(): Promise<void> {
  if (!env.isSupabaseConfigured || !supabase) {
    previewStore.updateState((s) => ({ ...s, preview_user: null }));
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error('Unable to sign out right now.');
  }
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  if (!env.isSupabaseConfigured || !supabase) {
    throw new Error('Password reset emails require live Supabase Auth configuration.');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${env.siteUrl}/login`,
  });

  if (error) {
    throw new Error(error.message || 'Unable to send reset link.');
  }
}

export async function updateOwnProfile(input: {
  full_name: string;
  phone: string;
}): Promise<ProfileRow> {
  if (!env.isSupabaseConfigured || !supabase) {
    const current = previewStore.getState().preview_user;
    if (!current) throw new Error('You must be signed in to update your profile.');
    const updated: ProfileRow = {
      ...current,
      full_name: input.full_name.trim(),
      phone: input.phone.trim() || null,
      updated_at: new Date().toISOString(),
    };
    previewStore.updateState((s) => ({ ...s, preview_user: updated }));
    return updated;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to update your profile.');

  // Security rule: never include role in client update payload
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.full_name.trim(),
      phone: input.phone.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('id, full_name, phone, role, created_at, updated_at')
    .single();

  if (error) throw new Error('Unable to update profile.');
  return data as ProfileRow;
}

export async function listOwnAddresses(): Promise<AddressRow[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    const user = previewStore.getState().preview_user;
    if (!user) return [];
    return previewStore
      .getState()
      .addresses.filter((a) => a.user_id === user.id)
      .sort((a, b) => Number(b.is_default) - Number(a.is_default));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('addresses')
    .select('id, user_id, label, recipient_name, phone, address_line, area, city, delivery_notes, is_default, created_at, updated_at')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error('Unable to load saved addresses.');
  return (data ?? []) as AddressRow[];
}

export async function saveAddress(input: AddressInput): Promise<AddressRow> {
  if (!env.isSupabaseConfigured || !supabase) {
    const user = previewStore.getState().preview_user;
    if (!user) throw new Error('Sign in to save delivery addresses.');
    const now = new Date().toISOString();
    const id = input.id ?? `addr-${Date.now()}`;
    const nextRow: AddressRow = {
      id,
      user_id: user.id,
      label: input.label.trim() || 'Home',
      recipient_name: input.recipient_name.trim(),
      phone: input.phone.trim(),
      address_line: input.address_line.trim(),
      area: input.area.trim(),
      city: input.city.trim(),
      delivery_notes: input.delivery_notes?.trim() || null,
      is_default: input.is_default,
      created_at: now,
      updated_at: now,
    };

    previewStore.updateState((s) => {
      const others = s.addresses
        .filter((a) => a.id !== id)
        .map((a) => (input.is_default && a.user_id === user.id ? { ...a, is_default: false } : a));
      return {
        ...s,
        addresses: [nextRow, ...others],
      };
    });
    return nextRow;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to save addresses.');

  if (input.is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
  }

  const payload = {
    user_id: user.id,
    label: input.label.trim() || null,
    recipient_name: input.recipient_name.trim(),
    phone: input.phone.trim(),
    address_line: input.address_line.trim(),
    area: input.area.trim(),
    city: input.city.trim(),
    delivery_notes: input.delivery_notes?.trim() || null,
    is_default: input.is_default,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('addresses')
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', user.id)
      .select('id, user_id, label, recipient_name, phone, address_line, area, city, delivery_notes, is_default, created_at, updated_at')
      .single();
    if (error) throw new Error('Unable to update address.');
    return data as AddressRow;
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert(payload)
    .select('id, user_id, label, recipient_name, phone, address_line, area, city, delivery_notes, is_default, created_at, updated_at')
    .single();

  if (error) throw new Error('Unable to save address.');
  return data as AddressRow;
}

export async function deleteAddress(addressId: string): Promise<void> {
  if (!env.isSupabaseConfigured || !supabase) {
    const user = previewStore.getState().preview_user;
    if (!user) return;
    previewStore.updateState((s) => ({
      ...s,
      addresses: s.addresses.filter((a) => !(a.id === addressId && a.user_id === user.id)),
    }));
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required.');

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id);

  if (error) throw new Error('Unable to delete address.');
}

export function enterPreviewRoleSession(role: UserRole): AuthSessionState {
  if (env.isSupabaseConfigured) {
    throw new Error('Preview sessions are disabled when live Supabase is connected.');
  }
  const now = new Date().toISOString();
  const profile: ProfileRow = {
    id: role === 'admin' ? 'preview-admin-user' : 'preview-customer-user',
    full_name: role === 'admin' ? 'Preview Staff Admin' : 'Preview Customer',
    phone: null,
    role,
    created_at: now,
    updated_at: now,
  };
  previewStore.updateState((s) => ({
    ...s,
    preview_user: profile,
  }));
  return {
    userId: profile.id,
    email:
      role === 'admin'
        ? 'preview-admin@libertycafe.local'
        : 'preview-customer@libertycafe.local',
    profile,
    isPreviewSession: true,
  };
}
