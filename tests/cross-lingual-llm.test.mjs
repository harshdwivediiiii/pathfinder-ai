import { describe, it, expect } from 'vitest';
import { translatePathwayWithLLM } from '../app/(main)/cross-lingual-llm/_components/translation-algorithm.js';

describe('Cross-Lingual Pathway Translation using LLMs', () => {
  const mockPathway = {
    title: "Advanced React Patterns",
    modules: [
      {
        id: "m1",
        title: "Advanced React Patterns",
        description: "Learn how to build reusable components.",
        codeSnippet: "const MemoizedComponent = React.memo(MyComponent);"
      }
    ]
  };

  it('translates human-readable strings to Spanish while preserving the structure', () => {
    const result = translatePathwayWithLLM(mockPathway, 'es');
    
    expect(result.success).toBe(true);
    expect(result.translatedData.modules[0].title).toBe('Patrones Avanzados de React');
    expect(result.translatedData.modules[0].description).toBe('Aprende a construir componentes reutilizables.');
  });
  
  it('translates human-readable strings to Japanese', () => {
    const result = translatePathwayWithLLM(mockPathway, 'ja');
    
    expect(result.success).toBe(true);
    expect(result.translatedData.modules[0].title).toBe('高度なReactパターン');
  });
  
  it('strictly preserves the code snippet without altering it', () => {
    const result = translatePathwayWithLLM(mockPathway, 'fr');
    
    expect(result.success).toBe(true);
    // Title is translated
    expect(result.translatedData.modules[0].title).toBe('Modèles React Avancés');
    // But code is exactly the same
    expect(result.translatedData.modules[0].codeSnippet).toBe("const MemoizedComponent = React.memo(MyComponent);");
    expect(result.translatedData.modules[0].codeSnippetPreserved).toBe(true);
  });
  
  it('returns an error for unsupported languages', () => {
    const result = translatePathwayWithLLM(mockPathway, 'ru'); // Russian not in mock dict
    expect(result.error).toBeDefined();
    expect(result.success).toBeUndefined();
  });
  
  it('does not mutate the original data object', () => {
    const originalTitle = mockPathway.modules[0].title;
    translatePathwayWithLLM(mockPathway, 'es');
    
    expect(mockPathway.modules[0].title).toBe(originalTitle); // Still English
  });
});
