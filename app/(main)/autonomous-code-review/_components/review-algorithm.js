/**
 * Simulates a LangChain orchestration of autonomous AI agents
 * that perform code reviews based on distinct personas.
 */

export class AgentOrchestrator {
    constructor() {
        this.agents = [
            { id: "sec_bot", name: "Strict Security Auditor", expertise: "security", icon: "shield" },
            { id: "perf_bot", name: "Performance Optimizer", expertise: "performance", icon: "zap" },
            { id: "clean_bot", name: "Clean Code Advocate", expertise: "readability", icon: "code" }
        ];
    }

    async analyzePullRequest(prContent) {
        if (!prContent || !prContent.diff) {
            throw new Error("Pull Request content with a diff is required.");
        }

        return new Promise((resolve) => {
            // Simulate agent deliberation time
            setTimeout(() => {
                const comments = this._simulateAgentReviews(prContent.diff);
                resolve({
                    reviewId: `rev_${Date.now()}`,
                    status: comments.some(c => c.severity === "high") ? "changes_requested" : "approved",
                    comments,
                    agentsInvolved: this.agents.length
                });
            }, 1200);
        });
    }

    _simulateAgentReviews(diff) {
        const comments = [];
        const lowerDiff = diff.toLowerCase();

        // Simulate Security Agent
        if (lowerDiff.includes("password") || lowerDiff.includes("secret") || lowerDiff.includes("eval(")) {
            comments.push({
                agentId: "sec_bot",
                agentName: "Strict Security Auditor",
                severity: "high",
                line: this._findLineNumber(diff, ["password", "secret", "eval("]),
                message: "Critical Security Flaw: Hardcoded secrets or unsafe evaluation detected. Please use environment variables or safer parsing methods."
            });
        }

        // Simulate Performance Agent
        if (lowerDiff.includes("n^2") || (lowerDiff.match(/for.*for/s) && lowerDiff.includes("for"))) {
             comments.push({
                agentId: "perf_bot",
                agentName: "Performance Optimizer",
                severity: "medium",
                line: this._findLineNumber(diff, ["for"]),
                message: "Performance Degradation: Nested loops detected resulting in O(n^2) complexity. Consider using a Set or Map for O(1) lookups."
            });
        }

        // Simulate Clean Code Agent
        if (lowerDiff.includes("var ") || lowerDiff.includes("any") || lowerDiff.length > 500) {
            comments.push({
                agentId: "clean_bot",
                agentName: "Clean Code Advocate",
                severity: "low",
                line: this._findLineNumber(diff, ["var ", "any"]),
                message: "Code Smell: Avoid using 'var' or 'any'. Opt for strict typing and block-scoped variables to improve maintainability."
            });
        }
        
        if (comments.length === 0) {
             comments.push({
                agentId: "clean_bot",
                agentName: "Clean Code Advocate",
                severity: "info",
                line: 1,
                message: "LGTM! The code is clean and follows our standard conventions."
            });
        }

        return comments;
    }

    _findLineNumber(diff, keywords) {
        const lines = diff.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (keywords.some(kw => line.includes(kw))) {
                return i + 1; // 1-indexed lines
            }
        }
        return 1; // Default fallback
    }
}
