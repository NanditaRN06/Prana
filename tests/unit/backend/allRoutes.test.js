import allRoutes from '@backend/routes/allRoutes.js';

describe('allRoutes Unit Tests', () => {
    it('BE-UT-117: Route Registration', () => {
        expect(allRoutes).toBeDefined();
        // Since it's an express router, it should have a stack of registered routes
        expect(Array.isArray(allRoutes.stack)).toBe(true);
        expect(allRoutes.stack.length).toBeGreaterThan(0);
    });

    it('BE-UT-119: Specific named routes registered', () => {
        const paths = allRoutes.stack.map(layer => {
            if (layer.route) return layer.route.path;
            if (layer.name === 'router') {
                // For nested routers, path might be on regex
                return layer.regexp.toString();
            }
            return null;
        });
        
        // Ensure some known mount paths are present (api)
        const hasApi = paths.some(p => p && p.includes('api'));
        
        expect(hasApi).toBeTruthy();
    });
});
