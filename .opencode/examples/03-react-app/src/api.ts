// Mock API client. Real apps would call fetch() to a backend.
// For the demo, this module returns hard-coded data with a small artificial delay.

export interface User {
  id: string;
  name: string;
  email: string;
}

const MOCK_USERS: ReadonlyArray<User> = [
  { id: 'u_1', name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 'u_2', name: 'Alan Turing', email: 'alan@example.com' },
];

export async function fetchUsers(): Promise<ReadonlyArray<User>> {
  // Simulate network latency for realistic loading states.
  await new Promise((resolve) => setTimeout(resolve, 50));
  return MOCK_USERS;
}
