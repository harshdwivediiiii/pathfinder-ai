import { describe, it, expect } from 'vitest';
import { mintCertificateSBT, verifyCertificateOnChain } from '../app/(main)/blockchain-credentials/_components/blockchain-algorithm.js';

describe('Blockchain-Backed Credential Verification System', () => {
  it('mints a Soulbound Token and correctly returns the transaction hash and block', () => {
    const result = mintCertificateSBT('test_user', 'React Pathway', '2026-08-04');
    
    expect(result.txHash).toBeDefined();
    expect(result.txHash.startsWith('0x')).toBe(true);
    expect(result.blockNumber).toBeGreaterThan(1000000);
    expect(result.isSoulbound).toBe(true);
  });
  
  it('successfully verifies a minted certificate using its hash', () => {
    // 1. Mint
    const minted = mintCertificateSBT('alice_dev', 'Node.js Pathway', '2026-09-01');
    const hash = minted.txHash;
    
    // 2. Verify
    const verification = verifyCertificateOnChain(hash);
    
    expect(verification.isValid).toBe(true);
    expect(verification.record.userId).toBe('alice_dev');
    expect(verification.record.pathwayName).toBe('Node.js Pathway');
  });
  
  it('rejects an invalid or forged transaction hash', () => {
    const forgedHash = '0xfake123abc456';
    const verification = verifyCertificateOnChain(forgedHash);
    
    expect(verification.isValid).toBe(false);
    expect(verification.message).toContain('forged');
  });
  
  it('handles missing data gracefully', () => {
    const result = mintCertificateSBT('', '', '');
    expect(result.error).toBeDefined();
  });
});
