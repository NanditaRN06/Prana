import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFound from '@frontend/pages/NotFound';
import { MemoryRouter } from 'react-router-dom';

describe('NotFound Component', () => {
    const renderNotFound = () => {
        return render(
            <MemoryRouter>
                <NotFound />
            </MemoryRouter>
        );
    };

    it('FE-UT-192: NotFound Comp - Happy Path: Render content', () => {
        renderNotFound();
        expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument();
        expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
        expect(screen.getByText(/The page you are looking for doesn't exist or has been moved./i)).toBeInTheDocument();
    });

    it('FE-UT-193: NotFound Comp - Happy Path: Render "Return to Home" button link', () => {
        renderNotFound();
        const homeLink = screen.getByRole('link', { name: /Return to Home/i });
        expect(homeLink).toBeInTheDocument();
    });

    it('FE-UT-194: NotFound Comp - Happy Path: Verify button link has href="/"', () => {
        renderNotFound();
        const homeLink = screen.getByRole('link', { name: /Return to Home/i });
        expect(homeLink.getAttribute('href')).toBe('/');
    });

    it('FE-UT-195: NotFound Comp - State update: Not applicable, strictly rendering check', () => {
        // Since there is no state update in NotFound component, we just check if it renders properly without crashing
        renderNotFound();
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });
});
