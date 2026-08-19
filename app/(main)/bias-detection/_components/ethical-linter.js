/**
 * Simulates an NLP-driven Ethical AI Linter.
 * Scans user code for algorithmic logic that may result in disparate impact,
 * demographic bias, or gender bias.
 */

export class EthicalAILinter {
    constructor() {
        // Mock dataset of known biased variable associations
        this.biasPatterns = [
            {
                pattern: /(age|gender|race|ethnicity|zipcode|zip_code|pregnancy|marital_status)\s*(===|==|>|<|>=|<=|!=|!==)/i,
                type: 'Direct Demographic Filtering',
                severity: 'Critical',
                description: 'Directly utilizing protected demographic classes in conditional logic can lead to disparate impact and violates equal opportunity principles.'
            },
            {
                pattern: /credit_score\s*<\s*\d+/i,
                type: 'Socioeconomic Proxy Bias',
                severity: 'Warning',
                description: 'Strict cutoffs on credit scores often act as proxies for race or neighborhood. Consider using a holistic scoring model rather than hard thresholds.'
            },
            {
                pattern: /if\s*\(\s*gap_in_resume\s*>\s*\d+\s*\)/i,
                type: 'Gender/Maternal Bias',
                severity: 'Warning',
                description: 'Penalizing resume gaps disproportionately impacts women who take maternity leave. This filtering metric is ethically questionable.'
            }
        ];
    }

    async scanCode(codeString) {
        if (!codeString || typeof codeString !== 'string') {
            throw new Error("Invalid code string provided for linting.");
        }

        // Simulate NLP/AST parsing delay
        return new Promise((resolve) => {
            setTimeout(() => {
                const results = this._analyze(codeString);
                resolve(results);
            }, 1200);
        });
    }

    _analyze(code) {
        const violations = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            this.biasPatterns.forEach(rule => {
                if (rule.pattern.test(line)) {
                    violations.push({
                        line: index + 1,
                        codeSnippet: line.trim(),
                        type: rule.type,
                        severity: rule.severity,
                        description: rule.description
                    });
                }
            });
        });

        return {
            passed: violations.length === 0,
            violations: violations,
            requiresIntervention: violations.some(v => v.severity === 'Critical')
        };
    }
}
