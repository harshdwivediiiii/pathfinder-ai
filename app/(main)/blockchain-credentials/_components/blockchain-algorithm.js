import crypto from 'crypto';

// In-memory mock ledger to simulate a blockchain network (e.g. Polygon)
const mockLedger = new Map();

/**
 * Simulates minting a Soulbound Token (SBT) representing a completed learning pathway.
 * SBTs are non-transferable NFTs, perfectly suited for immutable academic credentials.
 */
export function mintCertificateSBT(userId, pathwayName, completionDate) {
    if (!userId || !pathwayName) {
        return { error: "Missing required data to mint SBT." };
    }
    
    // Create a deterministic but unique hash representing the payload
    const payload = `${userId}-${pathwayName}-${completionDate}`;
    const txHash = '0x' + crypto.createHash('sha256').update(payload).digest('hex');
    
    const blockNumber = Math.floor(Math.random() * 100000) + 15000000;
    const contractAddress = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'; // Mock Pathfinder Contract
    
    const certificateData = {
        txHash,
        blockNumber,
        contractAddress,
        userId,
        pathwayName,
        completionDate,
        isSoulbound: true
    };
    
    // "Mine" it into the ledger
    mockLedger.set(txHash, certificateData);
    
    return certificateData;
}

/**
 * Simulates an employer verifying the authenticity of a certificate by checking the blockchain ledger.
 */
export function verifyCertificateOnChain(txHash) {
    if (!txHash) return { isValid: false, message: "Invalid Transaction Hash provided." };
    
    const record = mockLedger.get(txHash);
    
    if (record) {
        return {
            isValid: true,
            message: "Certificate is mathematically verified and immutable.",
            record
        };
    }
    
    return {
        isValid: false,
        message: "Hash not found on chain. Certificate may be forged."
    };
}
