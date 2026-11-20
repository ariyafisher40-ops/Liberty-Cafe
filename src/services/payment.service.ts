import { env } from '../lib/env';
import { supabase } from '../lib/supabase';
import { validateImageFile } from '../lib/validators';
import { previewStore } from './previewStore';

export interface SubmitPaymentProofInput {
  orderId: string;
  transactionReference: string;
  file?: File | null;
  trackingToken?: string | null;
}

export async function submitManualPaymentProof(
  input: SubmitPaymentProofInput
): Promise<{ proof_object_path: string | null }> {
  const ref = input.transactionReference.trim();
  if (!ref) {
    throw new Error('Enter your transaction reference ID.');
  }

  if (input.file) {
    const fileError = validateImageFile(input.file);
    if (fileError) throw new Error(fileError);
  }

  if (!env.isSupabaseConfigured || !supabase) {
    const now = new Date().toISOString();
    const fakePath = input.file
      ? `payment-proofs/${input.orderId}/preview/${Date.now()}-${input.file.name}`
      : null;

    previewStore.updateState((s) => ({
      ...s,
      orders: s.orders.map((ord) => {
        if (ord.id !== input.orderId) return ord;
        const updatedPayments = ord.payments.map((pay, idx) =>
          idx === 0
            ? {
                ...pay,
                transaction_reference: ref,
                proof_object_path: fakePath ?? pay.proof_object_path,
                status: 'pending_verification' as const,
                updated_at: now,
              }
            : pay
        );
        return {
          ...ord,
          payment_status: 'pending_verification',
          payments: updatedPayments,
          updated_at: now,
        };
      }),
    }));

    return { proof_object_path: fakePath };
  }

  let proofObjectPath: string | null = null;
  if (input.file) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const scope = user ? user.id : input.trackingToken ? `guest-${input.trackingToken.slice(0, 12)}` : 'guest';
    const ext = input.file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const objectPath = `${input.orderId}/${scope}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(objectPath, input.file, {
        cacheControl: '3600',
        upsert: false,
        contentType: input.file.type,
      });

    if (uploadError) {
      throw new Error('Unable to upload payment proof. Please try again.');
    }
    proofObjectPath = objectPath;
  }

  const { error: rpcError } = await supabase.rpc('submit_payment_proof', {
    p_order_id: input.orderId,
    p_transaction_reference: ref,
    p_proof_object_path: proofObjectPath,
    p_tracking_token: input.trackingToken ?? null,
  });

  if (rpcError) {
    throw new Error(rpcError.message || 'Unable to record payment proof.');
  }

  return { proof_object_path: proofObjectPath };
}

export async function getPrivatePaymentProofUrl(proofPath: string): Promise<string | null> {
  if (!proofPath) return null;
  if (!env.isSupabaseConfigured || !supabase) {
    return null;
  }
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(proofPath, 300);

  if (error) return null;
  return data.signedUrl;
}
