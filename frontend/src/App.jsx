import { useEffect, useState } from 'react';
import { fetchDishes } from './api/dishesApi';
import DishCard from './components/DishCard';
import './App.css';

export default function App() {
  const [dishes, setDishes] = useState([]);
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

  // Replace one dish with its newly saved version
  const handleUpdate = (updated) =>
    setDishes((list) => list.map((d) => (d.dishId === updated.dishId ? updated : d)));

  return (
    <main className="container">
      <h1>Dish Dashboard</h1>

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
            <DishCard key={d.dishId} dish={d} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </main>
  );
}