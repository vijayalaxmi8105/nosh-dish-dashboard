const BASE = process.env.API_URL || 'http://localhost:4000';
const DISH_ID = '5';

async function patch(label, name, version) {
  const res = await fetch(`${BASE}/dishes/${DISH_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dishName: name,
      isPublished: true,
      expectedVersion: version,
    }),
  });
  return { label, status: res.status };
}

async function main() {
  const current = await (await fetch(`${BASE}/dishes`)).json();
  const dish = current.find((d) => d.dishId === DISH_ID);
  const v = dish.version;
  const original = dish.dishName;
  console.log(`Starting version: ${v}`);

  const results = await Promise.all([
    patch('A', 'Alfredo Pasta A', v),
    patch('B', 'Alfredo Pasta B', v),
  ]);
  results.forEach((r) => console.log(`${r.label}: ${r.status}`));

  const ok = results.filter((r) => r.status === 200).length;
  const conflict = results.filter((r) => r.status === 409).length;
  console.log(ok === 1 && conflict === 1 ? 'PASS: exactly one succeeded' : 'FAIL');

  // restore the original name
  const after = await (await fetch(`${BASE}/dishes`)).json();
  const nv = after.find((d) => d.dishId === DISH_ID).version;
  await patch('restore', original, nv);
}

main();