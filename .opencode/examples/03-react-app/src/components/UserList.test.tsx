import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserList } from './UserList.js';
import type { User } from '../api.js';

const MOCK_USERS: ReadonlyArray<User> = [
  { id: 'u_1', name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 'u_2', name: 'Alan Turing', email: 'alan@example.com' },
];

describe('UserList', () => {
  it('renders a list of users with name and email', () => {
    render(<UserList users={MOCK_USERS} />);
    expect(screen.getByRole('list', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });

  it('shows an empty-state message when users array is empty', () => {
    render(<UserList users={[]} />);
    expect(screen.getByText(/no users yet/i)).toBeInTheDocument();
  });

  it('uses the user id as the React key (renders all items)', () => {
    render(<UserList users={MOCK_USERS} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
