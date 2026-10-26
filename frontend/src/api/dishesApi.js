const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and retry.', { status: 0 });
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    // response had no JSON body
  }

  if (!res.ok) {
    const message = body?.errors?.join('. ') || body?.error || `Request failed (${res.status})`;
    throw new ApiError(message, { status: res.status, body });
  }
  return body;
}

export const fetchDishes = () => request('/dishes');

export const saveDish = (dishId, { dishName, isPublished, expectedVersion }) =>
  request(`/dishes/${encodeURIComponent(dishId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dishName, isPublished, expectedVersion }),
  });