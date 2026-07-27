import { useEffect, useState } from 'react';
import { UserList } from './components/UserList.js';
import { fetchUsers, type User } from './api.js';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [users, setUsers] = useState<ReadonlyArray<User>>([]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchUsers()
      .then((data) => {
        if (cancelled) return;
        setUsers(data);
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>react-app-demo</h1>
      {status === 'loading' && <p>Loading users…</p>}
      {status === 'error' && <p role="alert">Failed to load users.</p>}
      {status === 'success' && <UserList users={users} />}
    </main>
  );
}
