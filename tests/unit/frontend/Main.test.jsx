import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Main from '@frontend/pages/dashboard/Main';
import { MemoryRouter } from 'react-router-dom';

describe('Main Component', () => {
    const renderMain = () => {
        return render(
            <MemoryRouter>
                <Main />
            </MemoryRouter>
        );
    };

    it('FE-UT-188: Main Comp - Happy Path: Render content', () => {
        renderMain();
        expect(screen.getByRole('heading', { name: /Clinical Information Systems/i })).toBeInTheDocument();
        expect(screen.getByText(/Efficient and secure patient record management for modern clinical practices./i)).toBeInTheDocument();
    });

    it('FE-UT-189: Main Comp - Happy Path: Login button link', () => {
        renderMain();
        const loginLink = screen.getByRole('link', { name: /Login/i });
        expect(loginLink).toBeInTheDocument();
        expect(loginLink.getAttribute('href')).toBe('/login');
    });

    it('FE-UT-190: Main Comp - Happy Path: Signup button link', () => {
        renderMain();
        const signupLink = screen.getByRole('link', { name: /Sign Up/i });
        expect(signupLink).toBeInTheDocument();
        expect(signupLink.getAttribute('href')).toBe('/signup');
    });

    it('FE-UT-191: Main Comp - Happy Path: Verify brand text', () => {
        renderMain();
        const brandText = screen.getByRole('heading', { name: /Prana/i });
        expect(brandText).toBeInTheDocument();
        expect(brandText.textContent).toContain('Prana.');
    });
});
