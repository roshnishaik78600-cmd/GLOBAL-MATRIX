export const QUERY_DEADLINE_MS = 3000;

export function withQueryDeadline<T>(run: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("This data did not load within 3 seconds. Please retry.")), QUERY_DEADLINE_MS);
    Promise.resolve().then(run).then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}