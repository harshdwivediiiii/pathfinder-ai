import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './dashboard';

test('renders loading initially and displays sections after loading', async () => {
    render(<Dashboard />);

    // Verify that the loading text is displayed initially
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    // Wait for the sections to be rendered
    await waitFor(() => expect(screen.getByText(/Section 1/i)).toBeInTheDocument());
    expect(screen.getByText(/Section 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Section 3/i)).toBeInTheDocument();
});
