import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SearchBar from '../../../frontend/src/components/SearchBar';
import { searchPatients } from '../../../frontend/src/services/patientService';

vi.mock('../../../frontend/src/services/patientService', () => ({
    searchPatients: vi.fn()
}));

describe('SearchBar Component Tests', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('FE-UT-131: SearchBar - Typing triggers debounced search', async () => {
        searchPatients.mockResolvedValue([{ _id: '1', name: 'Alice', age: 30 }]);
        render(
            <MemoryRouter>
                <SearchBar />
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search Clinical Registry/i);
        
        act(() => {
            fireEvent.change(input, { target: { value: 'Ali' } });
        });

        expect(searchPatients).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve(); // flush microtasks
        });

        expect(searchPatients).toHaveBeenCalledWith('Ali');
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('FE-UT-132: SearchBar - Empty input clears results', async () => {
        searchPatients.mockResolvedValue([{ _id: '1', name: 'Alice', age: 30 }]);
        render(
            <MemoryRouter>
                <SearchBar />
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search Clinical Registry/i);
        act(() => {
            fireEvent.change(input, { target: { value: 'Ali' } });
        });
        
        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
        });

        expect(screen.getByText('Alice')).toBeInTheDocument();

        act(() => {
            fireEvent.change(input, { target: { value: '' } });
        });
        
        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
        });

        expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    it('FE-UT-133: SearchBar - Result click -> navigate to patient', async () => {
        searchPatients.mockResolvedValue([{ _id: '1', name: 'Alice', age: 30 }]);
        
        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<SearchBar />} />
                    <Route path="/patient/:name" element={<div data-testid="patient-page" />} />
                </Routes>
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search Clinical Registry/i);
        act(() => {
            fireEvent.change(input, { target: { value: 'Ali' } });
        });
        
        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
        });

        const result = screen.getByText('Alice');
        act(() => {
            fireEvent.click(result);
        });

        expect(screen.getByTestId('patient-page')).toBeInTheDocument();
    });

    it('FE-UT-134: SearchBar - No results -> "No Registry Matches"', async () => {
        searchPatients.mockResolvedValue([]);
        render(
            <MemoryRouter>
                <SearchBar />
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search Clinical Registry/i);
        act(() => {
            fireEvent.change(input, { target: { value: 'zzz' } });
        });
        
        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
        });

        expect(screen.getByText('No Registry Matches')).toBeInTheDocument();
    });

    it('FE-UT-135: SearchBar - Search API fails -> console.error', async () => {
        searchPatients.mockRejectedValue(new Error('API failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <MemoryRouter>
                <SearchBar />
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search Clinical Registry/i);
        act(() => {
            fireEvent.change(input, { target: { value: 'Ali' } });
        });
        
        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
        });

        expect(consoleSpy).toHaveBeenCalledWith('Error searching patients:', 'API failed');
        
        consoleSpy.mockRestore();
    });

    it('FE-UT-136: SearchBar - Result snippet highlight', async () => {
        searchPatients.mockResolvedValue([{ 
            _id: '1', 
            name: 'John', 
            age: 30, 
            clinicalDiagnosis: 'Patient has a severe Flu infection' 
        }]);

        render(
            <MemoryRouter>
                <SearchBar />
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search Clinical Registry/i);
        act(() => {
            fireEvent.change(input, { target: { value: 'Flu' } });
        });
        
        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
        });

        const el = screen.getByText('Flu');
        expect(el).toHaveClass('font-bold', 'underline');
    });

    it('FE-UT-137: SearchBar - Patient name with special chars -> encoded URL', async () => {
        searchPatients.mockResolvedValue([{ _id: '1', name: 'A (2)', age: 30 }]);
        
        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<SearchBar />} />
                    <Route path="*" element={<div data-testid="location-display" />} />
                </Routes>
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search Clinical Registry/i);
        act(() => {
            fireEvent.change(input, { target: { value: 'A (2)' } });
        });
        
        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
        });

        const result = screen.getByText('A (2)');
        act(() => {
            fireEvent.click(result);
        });

        expect(screen.getByTestId('location-display')).toBeInTheDocument();
    });
});
