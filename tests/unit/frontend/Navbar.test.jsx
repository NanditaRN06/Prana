import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../../frontend/src/layout/Navbar';

describe('Navbar Component Tests', () => {
    let user;

    beforeEach(() => {
        user = userEvent.setup({ delay: null });
        vi.clearAllMocks();
    });

    it('FE-UT-153: Navbar - Renders on non-hidden routes', () => {
        render(
            <MemoryRouter initialEntries={['/account']}>
                <Navbar username="Dr. Smith" handleLogout={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByText('Prana')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('FE-UT-154: Navbar - Hidden on /', () => {
        const { container } = render(
            <MemoryRouter initialEntries={['/']}>
                <Navbar username="Dr. Smith" handleLogout={vi.fn()} />
            </MemoryRouter>
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('FE-UT-155: Navbar - Hidden on /login', () => {
        const { container } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Navbar username="Dr. Smith" handleLogout={vi.fn()} />
            </MemoryRouter>
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('FE-UT-156: Navbar - Hidden on /home', () => {
        const { container } = render(
            <MemoryRouter initialEntries={['/home']}>
                <Navbar username="Dr. Smith" handleLogout={vi.fn()} />
            </MemoryRouter>
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('FE-UT-157: Navbar - Username prop displayed', () => {
        render(
            <MemoryRouter initialEntries={['/patient/Alice']}>
                <Navbar username="doc1" handleLogout={vi.fn()} />
            </MemoryRouter>
        );

        expect(screen.getByText('doc1')).toBeInTheDocument();
    });

    it('FE-UT-158: Navbar - Logout button triggers handleLogout', async () => {
        const mockLogout = vi.fn();
        render(
            <MemoryRouter initialEntries={['/patient/Alice']}>
                <Navbar username="doc1" handleLogout={mockLogout} />
            </MemoryRouter>
        );

        const logoutBtn = screen.getByText('Logout').closest('button');
        await user.click(logoutBtn);

        expect(mockLogout).toHaveBeenCalled();
    });
});
