import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import App from './App';

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock alert
window.alert = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('renders login form when not authenticated', () => {
    render(<App />);
    
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  test('handles login form submission', async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: 'test-token', role: 'USER' }
    });
    axios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);
    
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password' }
    });
    
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/login',
        { username: 'testuser', password: 'password' }
      );
    });
  });

  test('shows product management for authenticated admin', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'admin-token';
      if (key === 'userRole') return 'ADMIN';
      return null;
    });

    const mockProducts = [
      { id: 1, name: 'Test Product', description: 'Test Desc', price: 100, quantity: 5 }
    ];
    
    axios.get.mockResolvedValueOnce({ data: mockProducts });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Product Management')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    // Check for Edit button
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('hides edit buttons for regular users', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'user-token';
      if (key === 'userRole') return 'USER';
      return null;
    });

    const mockProducts = [
      { id: 1, name: 'Test Product', description: 'Test Desc', price: 100, quantity: 5 }
    ];
    
    axios.get.mockResolvedValueOnce({ data: mockProducts });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    // Edit button should not exist for regular users
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });
});