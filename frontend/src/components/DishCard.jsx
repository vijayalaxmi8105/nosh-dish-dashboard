import { useState } from 'react';
import { saveDish } from '../api/dishesApi';

export default function DishCard({ dish, onUpdate }) {
  // dish = last saved values from the server. draft = local edits only.
  const [draft, setDraft] = useState({
    dishName: dish.dishName,
    isPublished: dish.isPublished,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);

  const dirty =
    draft.dishName !== dish.dishName || draft.isPublished !== dish.isPublished;

  const resetTo = (d) => setDraft({ dishName: d.dishName, isPublished: d.isPublished });

  const handleDiscard = () => {
    resetTo(dish);
    setError(null);
    setConflict(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setConflict(null);
    try {
      // Send the version we originally loaded, never a newer one.
      const saved = await saveDish(dish.dishId, {
        ...draft,
        expectedVersion: dish.version,
      });
      onUpdate(saved);
      resetTo(saved);
    } catch (err) {
      if (err.status === 409) {
        setConflict(err.body?.current || null);
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReload = () => {
    if (!window.confirm('This will discard your unsaved draft. Continue?')) return;
    onUpdate(conflict);
    resetTo(conflict);
    setConflict(null);
  };

  return (
    <div className={`card ${dirty ? 'card-dirty' : ''}`}>
      {imgFailed ? (
        <div className="img-fallback">Image unavailable</div>
      ) : (
        <img src={dish.imageUrl} alt={dish.dishName} onError={() => setImgFailed(true)} />
      )}

      <p className="meta">ID: {dish.dishId} · Version: {dish.version}</p>
      <p className="meta">
        Saved: <strong>{dish.dishName}</strong> ·{' '}
        {dish.isPublished ? 'Published' : 'Unpublished'}
      </p>

      <label>
        Name
        <input
          value={draft.dishName}
          onChange={(e) => setDraft({ ...draft, dishName: e.target.value })}
        />
      </label>

      <label className="row">
        <input
          type="checkbox"
          checked={draft.isPublished}
          onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })}
        />
        Published
      </label>

      {dirty && <span className="badge">Unsaved changes</span>}
      {error && <p className="error">{error}</p>}

      {conflict && (
        <div className="error">
          <p>Another update was saved (now version {conflict.version}). Your draft is kept.</p>
          <button onClick={handleReload}>Reload latest (discards my draft)</button>
        </div>
      )}

      <div className="row">
        <button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={handleDiscard} disabled={!dirty || saving}>
          Discard
        </button>
      </div>
    </div>
  );
}