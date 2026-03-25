const crypto = require('crypto').webcrypto;

async function run() {
    const encoder = new TextEncoder();
    const ENCRYPTION_KEY = 'streamflow-secret-key-1234567890'.padEnd(32, '0').slice(0, 32);

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(ENCRYPTION_KEY).buffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );

    const url = "http://example.com/video.mp4";
    const data = encoder.encode(url);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        keyMaterial,
        data
    );

    const encryptedBytes = new Uint8Array(iv.length + ciphertext.byteLength);
    encryptedBytes.set(iv, 0);
    encryptedBytes.set(new Uint8Array(ciphertext), iv.length);

    const token = btoa(String.fromCharCode(...encryptedBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    console.log("Token:", token);

    // Decrypt
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const binaryStr = atob(base64);
    const encBytes2 = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        encBytes2[i] = binaryStr.charCodeAt(i);
    }

    const iv2 = encBytes2.slice(0, 12);
    const ciphertext2 = encBytes2.slice(12);

    const decryptedBuf = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv2 },
        keyMaterial,
        ciphertext2
    );

    const decoder = new TextDecoder();
    console.log("Decrypted:", decoder.decode(decryptedBuf));
}

run().catch(console.error);
