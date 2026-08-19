import { describe, it, expect, beforeEach } from 'vitest';
import { CICDProvisioner } from '../app/(main)/cicd-provisioning/_components/provisioning-engine.js';

describe('Automated CI/CD Pipeline Provisioning Engine', () => {
    let provisioner;

    beforeEach(() => {
        provisioner = new CICDProvisioner();
    });

    it('should throw error if missing required parameters', () => {
        expect(() => provisioner.provisionPipeline(null, 'vercel', 'url')).toThrow("Stack, provider, and repo URL are required");
    });

    it('should throw error for unsupported stack', () => {
        expect(() => provisioner.provisionPipeline('ruby', 'vercel', 'url')).toThrow("Unsupported stack");
    });

    it('should throw error for unsupported provider', () => {
        expect(() => provisioner.provisionPipeline('react', 'aws', 'url')).toThrow("Unsupported provider");
    });

    it('should generate valid GitHub Actions YAML for node stacks', async () => {
        const result = await provisioner.provisionPipeline('react', 'vercel', 'https://github.com/test/repo');
        
        expect(result.artifacts.githubActions).toContain("actions/setup-node@v3");
        expect(result.artifacts.githubActions).toContain("npm ci && npm run build && npm test");
    });

    it('should generate valid GitHub Actions YAML for python stacks', async () => {
        const result = await provisioner.provisionPipeline('python', 'render', 'https://github.com/test/repo');
        
        expect(result.artifacts.githubActions).toContain("actions/setup-python@v4");
        expect(result.artifacts.githubActions).toContain("pip install -r requirements.txt && pytest");
    });

    it('should generate valid Vercel Terraform configuration', async () => {
        const result = await provisioner.provisionPipeline('react', 'vercel', 'https://github.com/test/my-app');
        
        expect(result.artifacts.terraform).toContain("vercel/vercel");
        expect(result.artifacts.terraform).toContain('name      = "my-app"');
        expect(result.artifacts.terraform).toContain('repo = "test/my-app"');
    });

    it('should generate valid Render Terraform configuration', async () => {
        const result = await provisioner.provisionPipeline('node', 'render', 'https://github.com/test/my-api');
        
        expect(result.artifacts.terraform).toContain("render-oss/render");
        expect(result.artifacts.terraform).toContain('name = "my-api"');
        expect(result.artifacts.terraform).toContain('repo = "https://github.com/test/my-api"');
    });
});
