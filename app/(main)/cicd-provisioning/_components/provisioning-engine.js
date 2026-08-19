/**
 * Simulates an Automated CI/CD Pipeline Provisioning Engine.
 * Generates Terraform configurations and GitHub Actions YAML 
 * based on the user's project stack and selected cloud provider.
 */

export class CICDProvisioner {
    constructor() {
        this.supportedStacks = ['react', 'node', 'python'];
        this.supportedProviders = ['vercel', 'render'];
    }

    provisionPipeline(stack, provider, repoUrl) {
        if (!stack || !provider || !repoUrl) {
            throw new Error("Stack, provider, and repo URL are required to provision a pipeline.");
        }

        const lowerStack = stack.toLowerCase();
        const lowerProvider = provider.toLowerCase();

        if (!this.supportedStacks.includes(lowerStack)) {
            throw new Error(`Unsupported stack: ${stack}. Supported stacks: ${this.supportedStacks.join(', ')}`);
        }
        if (!this.supportedProviders.includes(lowerProvider)) {
            throw new Error(`Unsupported provider: ${provider}. Supported providers: ${this.supportedProviders.join(', ')}`);
        }

        return new Promise((resolve) => {
            // Simulate provisioning delay (API calls to GitHub/Cloud Provider)
            setTimeout(() => {
                const githubActionsYaml = this._generateGithubActions(lowerStack);
                const terraformConfig = this._generateTerraform(lowerProvider, repoUrl);
                
                resolve({
                    status: "provisioned",
                    pipelineId: `pipe_${Date.now()}`,
                    artifacts: {
                        githubActions: githubActionsYaml,
                        terraform: terraformConfig
                    },
                    mockDeploymentUrl: `https://${repoUrl.split('/').pop()}.${lowerProvider}.app`
                });
            }, 1500);
        });
    }

    _generateGithubActions(stack) {
        const buildStep = stack === 'python' ? 'pip install -r requirements.txt && pytest' : 'npm ci && npm run build && npm test';
        return `
name: Pathfinder Auto CI/CD
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Environment
      uses: ${stack === 'python' ? 'actions/setup-python@v4' : 'actions/setup-node@v3'}
      with:
        ${stack === 'python' ? 'python-version: "3.10"' : 'node-version: "18"'}
    - name: Install dependencies and Run Tests
      run: |
        ${buildStep}
        `.trim();
    }

    _generateTerraform(provider, repoUrl) {
        const repoName = repoUrl.split('/').pop() || 'pathfinder-project';
        if (provider === 'vercel') {
            return `
terraform {
  required_providers {
    vercel = {
      source = "vercel/vercel"
      version = "~> 0.11.4"
    }
  }
}

resource "vercel_project" "capstone" {
  name      = "${repoName}"
  framework = "nextjs"
  git_repository = {
    type = "github"
    repo = "${repoUrl.replace('https://github.com/', '')}"
  }
}
            `.trim();
        } else {
            return `
terraform {
  required_providers {
    render = {
      source = "render-oss/render"
      version = "~> 1.0.0"
    }
  }
}

resource "render_web_service" "capstone" {
  name = "${repoName}"
  repo = "${repoUrl}"
  plan = "free"
  env  = "node"
}
            `.trim();
        }
    }
}
