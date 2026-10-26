import { useEffect, useState } from 'react';
import { fetchDishes } from './api/dishesApi';
import DishCard from './components/DishCard';
import './App.css';

const POLL_MS = 5000;

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [latest, setLatest] = useState({}); // newest server copy per dishId
  const [offline, setOffline] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | error | ready
  const [loadError, setLoadError] = useState('');

  const load = async () => {
    setStatus('loading');
    try {
      setDishes(await fetchDishes());
      setStatus('ready');
    } catch (err) {
      setLoadError(err.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Poll for external updates. Timer is cleared on unmount / status change.
  useEffect(() => {
    if (status !== 'ready') return;
    let cancelled = false;

    const poll = async () => {
      try {
        const fresh = await fetchDishes();
        if (cancelled) return;
        setLatest(Object.fromEntries(fresh.map((d) => [d.dishId, d])));
        // Add dishes that appeared on the server (never touches existing cards)
        setDishes((list) => {
          const ids = new Set(list.map((d) => d.dishId));
          const added = fresh.filter((d) => !ids.has(d.dishId));
          return added.length ? [...list, ...added] : list;
        });
        setOffline(false);
      } catch {
        if (!cancelled) setOffline(true); // temporary disconnect: keep UI, retry next tick
      }
    };

    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [status]);

  // Replace one dish with its newly saved version
  const handleUpdate = (updated) =>
    setDishes((list) => list.map((d) => (d.dishId === updated.dishId ? updated : d)));

  return (
    <main className="container">
      <h1>Dish Dashboard</h1>

      {offline && <p className="error">Connection lost. Retrying automatically...</p>}

      {status === 'loading' && <p>Loading dishes...</p>}

      {status === 'error' && (
        <div className="error">
          <p>{loadError}</p>
          <button onClick={load}>Retry</button>
        </div>
      )}

      {status === 'ready' && dishes.length === 0 && <p>No dishes found.</p>}

      {status === 'ready' && dishes.length > 0 && (
        <div className="grid">
          {dishes.map((d) => (
            <DishCard
              key={d.dishId}
              dish={d}
              latest={latest[d.dishId]}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </main>
  );
}