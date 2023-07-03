import { Base64 } from 'js-base64';

// Function to generate a random string of a specific length
function generateRandomString(length: number): string {
  let array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

// Function to hash a string using SHA-256
async function sha256(input: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  return new Uint8Array(await window.crypto.subtle.digest('SHA-256', data));
}

// Function to encode a Uint8Array in URL-safe Base64
function base64URLEncode(input: Uint8Array): string {
  return Base64.fromUint8Array(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export { generateRandomString, sha256, base64URLEncode };