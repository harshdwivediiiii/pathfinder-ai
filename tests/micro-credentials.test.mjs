import { describe, it, expect } from 'vitest';
import { executeSmartContract } from '../app/(main)/micro-credentials/_components/smart-contract-algorithm.js';

describe('Dynamic Micro-Credentialing via Smart Contracts', () => {
  it('successfully validates React hooks code and mints an NFT', () => {
    const validCode = `
      import { useState, useEffect } from 'react';
      useEffect(() => {
         const [val, setVal] = useState(false);
      });
    `;
    const result = executeSmartContract(validCode, 'ReactHooks');
    
    expect(result.success).toBe(true);
    expect(result.credential).toBeDefined();
    expect(result.credential.tokenId.startsWith('0x')).toBe(true);
    expect(result.credential.skillId).toBe('ReactHooks');
  });
  
  it('fails validation if required hooks are missing', () => {
    const invalidCode = `
      import { useState } from 'react';
      // Missing useEffect
    `;
    const result = executeSmartContract(invalidCode, 'ReactHooks');
    
    expect(result.success).toBe(false);
    expect(result.credential).toBeUndefined();
    expect(result.message).toContain('failed');
  });
  
  it('successfully validates Python loop logic', () => {
    const pythonCode = `
      for x in range(10):
        print(x)
    `;
    const result = executeSmartContract(pythonCode, 'PythonLoops');
    
    expect(result.success).toBe(true);
    expect(result.credential).toBeDefined();
    expect(result.credential.skillId).toBe('PythonLoops');
  });
  
  it('handles unknown skills or empty inputs safely', () => {
    expect(executeSmartContract("some code", "UnknownSkill").success).toBe(false);
    expect(executeSmartContract("", "ReactHooks").success).toBe(false);
  });
});
