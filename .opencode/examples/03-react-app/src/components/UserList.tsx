import type { User } from '../api.js';

interface UserListProps {
  users: ReadonlyArray<User>;
}

export function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return <p>No users yet.</p>;
  }

  return (
    <ul aria-label="users">
      {users.map((user) => (
        <li key={user.id}>
          <strong>{user.name}</strong>
          <span> — {user.email}</span>
        </li>
      ))}
    </ul>
  );
}
