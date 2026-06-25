import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MockAdapter from 'axios-mock-adapter';
import apiClient from '@frontend/services/apiClient';

// Helper to render component with required providers (Router, Toaster)
export const renderWithProviders = (ui, { route = '/' } = {}) => {
    window.history.pushState({}, 'Test page', route);
    
    return {
        ...render(
            <MemoryRouter initialEntries={[route]}>
                <Toaster />
                {ui}
            </MemoryRouter>
        )
    };
};

// Create a singleton mock adapter for all tests
export const mockApi = new MockAdapter(apiClient, { delayResponse: 0 });

// Reset mock between tests
export const resetMockApi = () => {
    mockApi.reset();
};
