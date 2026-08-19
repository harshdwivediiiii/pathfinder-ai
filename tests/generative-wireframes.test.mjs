import { describe, it, expect } from 'vitest';
import { synthesizeWireframe } from '../app/(main)/generative-wireframes/_components/wireframe-algorithm.js';

describe('Generative UI/UX Wireframe Synthesis', () => {
    it('should successfully synthesize react code with matching UI components for all API endpoints', () => {
        const schema = {
            title: "Test App",
            endpoints: [
                { path: "/api/users", method: "GET", name: "Get Users" },
                { path: "/api/users", method: "POST", name: "Create User", payloadSchema: { name: "string", age: "number" } },
                { path: "/api/users/1", method: "DELETE", name: "Delete User" }
            ]
        };

        const result = synthesizeWireframe(schema);

        expect(result.success).toBe(true);
        expect(result.componentCount).toBe(3);
        
        // Assert React structure
        expect(result.generatedCode).toContain("import React");
        expect(result.generatedCode).toContain("export default function GeneratedWireframe");
        expect(result.generatedCode).toContain("Test App");

        // Assert GET endpoint state and UI
        expect(result.generatedCode).toContain("const [GetUsersData, setGetUsersData] = useState(null)");
        expect(result.generatedCode).toContain("Get Users");
        expect(result.generatedCode).toContain("animate-pulse"); // The placeholder UI for GET

        // Assert POST endpoint UI
        expect(result.generatedCode).toContain("Create User");
        expect(result.generatedCode).toContain("onSubmit={(e) => e.preventDefault()}");
        expect(result.generatedCode).toContain("type=\"text\"");
        expect(result.generatedCode).toContain("type=\"number\"");
        expect(result.generatedCode).toContain("Enter name");
        expect(result.generatedCode).toContain("Enter age");

        // Assert DELETE endpoint UI
        expect(result.generatedCode).toContain("Delete User");
        expect(result.generatedCode).toContain("Delete Resource");
    });

    it('should throw an error for invalid schemas', () => {
        expect(() => synthesizeWireframe({})).toThrow("Invalid API schema");
        expect(() => synthesizeWireframe({ endpoints: null })).toThrow("Invalid API schema");
    });
});
