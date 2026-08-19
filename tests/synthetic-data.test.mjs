import { describe, it, expect, beforeEach } from 'vitest';
import { TabularGAN } from '../app/(main)/synthetic-data/_components/gan-algorithm.js';

describe('Synthetic Data Generation (Tabular GAN)', () => {
    let gan;

    beforeEach(() => {
        gan = new TabularGAN();
    });

    it('should throw error if generating before initialization', () => {
        expect(() => gan.generateDataset(10)).toThrow("GAN must be initialized");
    });

    it('should parse prompt and initialize correct transaction schema', () => {
        const schema = gan.parsePromptAndInitialize("Generate 100 rows of fraud transactions");
        
        expect(gan.isTrained).toBe(true);
        expect(schema.name).toBe("e_commerce_transactions");
        expect(schema.columns).toContain("is_fraud");
    });

    it('should parse prompt and initialize generic schema if no keywords match', () => {
        const schema = gan.parsePromptAndInitialize("Generate data for housing prices");
        
        expect(gan.isTrained).toBe(true);
        expect(schema.name).toBe("generic_tabular");
    });

    it('should generate dataset of exact row count requested', async () => {
        gan.parsePromptAndInitialize("health records");
        const result = await gan.generateDataset(50, 0); // 0% anomaly
        
        expect(result.data).toHaveLength(50);
        expect(result.metadata.rowCount).toBe(50);
        expect(result.metadata.schema).toBe("patient_vitals");
    });

    it('should inject anomalies based on rate', async () => {
        gan.parsePromptAndInitialize("transactions");
        const result = await gan.generateDataset(100, 1.0); // 100% anomaly
        
        // Every row should have is_fraud = 1
        expect(result.data.every(r => r.is_fraud === 1)).toBe(true);
    });
});
