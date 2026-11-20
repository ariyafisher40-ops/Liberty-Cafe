const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function validatePhone(phone: string): string | null {
  const cleaned = phone.trim();
  if (!cleaned) return 'Mobile phone number is required.';
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return 'Enter a valid phone number (10 to 15 digits).';
  }
  return null;
}

export function validateEmailOptional(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validateEmailRequired(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export function validateCouponCodeFormat(code: string): string | null {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return 'Enter a coupon code.';
  if (!/^[A-Z0-9_-]{3,24}$/.test(trimmed)) {
    return 'Coupon codes use 3 to 24 letters, numbers, hyphens, or underscores.';
  }
  return null;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    return 'Only JPEG, PNG, or WebP images are supported.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image file size must be 5 MB or less.';
  }
  return null;
}
