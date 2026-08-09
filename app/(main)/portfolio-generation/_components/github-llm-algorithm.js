/**
 * Mock GitHub API response for a given user
 */
const mockGitHubData = {
    "johndoe123": [
        { name: "pathfinder-capstone-api", language: "Node.js", description: "Final project for backend module", stars: 2 },
        { name: "react-portfolio-v1", language: "JavaScript", description: "My first react app", stars: 0 },
        { name: "algorithm-practice", language: "Python", description: "Leetcode solutions", stars: 1 },
        { name: "ecommerce-microservices", language: "Go", description: "Advanced capstone: Event-driven ecommerce", stars: 5 }
    ],
    "janedoe456": [
        { name: "ml-predictive-model", language: "Jupyter Notebook", description: "Predicting housing prices", stars: 3 },
        { name: "hello-world", language: "HTML", description: "test", stars: 0 }
    ]
};

/**
 * Simulates an LLM ingesting a raw repository and generating a professional, 
 * employer-ready README summary highlighting the tech stack and business value.
 */
function generateLLMReadme(repo) {
    // Simulated LLM templates based on the repo name and language
    if (repo.language === "Node.js" || repo.language === "Go") {
        return `## ${repo.name}\n\n**Overview:** A scalable backend service architected to handle high-throughput requests. \n\n**Tech Stack:** ${repo.language}, REST APIs, Docker.\n\n**Business Impact:** Reduces latency by 40% using event-driven microservices. Demonstrates strong understanding of distributed systems.`;
    }
    
    if (repo.language === "JavaScript" || repo.language === "TypeScript") {
        return `## ${repo.name}\n\n**Overview:** A responsive, accessible frontend application with dynamic state management. \n\n**Tech Stack:** ${repo.language}, React, CSS Modules.\n\n**Business Impact:** Improves user retention through a seamless UX.`;
    }
    
    return `## ${repo.name}\n\n**Overview:** ${repo.description}\n\n**Tech Stack:** ${repo.language}\n\n**Key Learnings:** Implemented core logic and data structures relevant to modern development.`;
}

/**
 * Simulates fetching a user's GitHub repositories, filtering for "Portfolio Worthy" projects,
 * and mapping them through the LLM summarizer.
 */
export function generateAutomatedPortfolio(username) {
    if (!username || username.trim() === '') return { error: "Please provide a valid GitHub username." };
    
    const repos = mockGitHubData[username.toLowerCase()];
    if (!repos) {
        return { error: `No GitHub account found for '${username}'. (Try 'johndoe123' or 'janedoe456')` };
    }
    
    // 1. Heuristic Filtering: Only keep significant projects (ignore trivial 'hello-world' style repos)
    const portfolioWorthyRepos = repos.filter(repo => 
        repo.stars > 0 || 
        repo.name.includes('capstone') || 
        repo.name.includes('microservices') ||
        repo.description.length > 20
    );
    
    // 2. LLM Processing: Generate professional markdown summaries
    const generatedPortfolio = portfolioWorthyRepos.map(repo => {
        return {
            originalName: repo.name,
            originalDescription: repo.description,
            language: repo.language,
            llmGeneratedReadme: generateLLMReadme(repo)
        };
    });
    
    return {
        username,
        publicUrl: `https://pathfinder.ai/portfolios/${username}`,
        projects: generatedPortfolio
    };
}
