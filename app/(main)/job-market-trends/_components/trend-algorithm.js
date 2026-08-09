/**
 * Base pathways with initial static scores and associated keyword vocabularies
 */
export function getBasePathways() {
  return [
      { id: 'frontend', title: 'Frontend Developer', baseScore: 65, keywords: ['react', 'vue', 'tailwind', 'typescript', 'nextjs', 'css'] },
      { id: 'backend', title: 'Backend Developer', baseScore: 70, keywords: ['node', 'python', 'go', 'java', 'sql', 'microservices'] },
      { id: 'data', title: 'Data Scientist', baseScore: 75, keywords: ['python', 'sql', 'pandas', 'tensorflow', 'pytorch', 'statistics'] },
      { id: 'ai', title: 'AI Engineer', baseScore: 60, keywords: ['llm', 'langchain', 'openai', 'transformers', 'rag', 'vector'] },
      { id: 'devops', title: 'DevOps Engineer', baseScore: 68, keywords: ['kubernetes', 'docker', 'aws', 'ci/cd', 'terraform', 'linux'] }
  ];
}

/**
 * Simulates scraping a batch of job postings to generate term frequencies (TF)
 */
export function simulateMarketScrape(trendBias) {
  const allKeywords = [
      'react', 'vue', 'tailwind', 'typescript', 'nextjs', 'css',
      'node', 'python', 'go', 'java', 'sql', 'microservices',
      'pandas', 'tensorflow', 'pytorch', 'statistics',
      'llm', 'langchain', 'openai', 'transformers', 'rag', 'vector',
      'kubernetes', 'docker', 'aws', 'ci/cd', 'terraform', 'linux'
  ];
  
  const tf = {};
  allKeywords.forEach(kw => tf[kw] = 1); // baseline 1 mention
  
  // Apply bias to simulate market trends
  if (trendBias === 'ai_boom') {
      tf['llm'] += 40;
      tf['openai'] += 35;
      tf['rag'] += 25;
      tf['python'] += 20;
      tf['langchain'] += 30;
  } else if (trendBias === 'cloud_migration') {
      tf['aws'] += 40;
      tf['kubernetes'] += 35;
      tf['terraform'] += 25;
      tf['docker'] += 20;
  } else if (trendBias === 'web3_winter') {
      // Just baseline for everything, maybe boost fullstack slightly
      tf['typescript'] += 15;
      tf['react'] += 10;
      tf['node'] += 10;
  }
  
  return tf;
}

/**
 * Calculates dynamic pathway scores using a simplified TF-IDF weighting approach.
 */
export function calculateDynamicScores(pathways, termFrequencies) {
  // 1. Calculate Document Frequency (DF) - how many pathways contain the term
  // In a real scenario, this would be across all job postings, but here we treat pathways as "documents"
  // to penalize generic terms (like 'python' or 'sql' that appear in multiple paths)
  
  const df = {};
  pathways.forEach(p => {
      p.keywords.forEach(kw => {
          df[kw] = (df[kw] || 0) + 1;
      });
  });
  
  const totalDocuments = pathways.length;
  
  // 2. Calculate dynamic score for each pathway
  const updatedPathways = pathways.map(pathway => {
      let dynamicScoreBoost = 0;
      
      pathway.keywords.forEach(kw => {
          const tf = termFrequencies[kw] || 0;
          // IDF = log(N / DF) + 1 (smoothing)
          const idf = Math.log(totalDocuments / (df[kw] || 1)) + 1;
          
          // Contribution of this keyword to the pathway's trending status
          const tfidf = tf * idf;
          dynamicScoreBoost += tfidf;
      });
      
      // Normalize the boost (arbitrary scaling for UI visualization)
      const normalizedBoost = Math.round(dynamicScoreBoost * 0.4); 
      
      return {
          ...pathway,
          dynamicScore: pathway.baseScore + normalizedBoost,
          boost: normalizedBoost
      };
  });
  
  // Sort descending by new dynamic score
  updatedPathways.sort((a, b) => b.dynamicScore - a.dynamicScore);
  
  return updatedPathways;
}
