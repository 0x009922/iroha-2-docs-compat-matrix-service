export function useFreshData<T>(
  fn: () => Promise<T>,
): { get: () => Promise<T> } {
  let state: { data: null | { some: T }; promise: null | Promise<T> } = {
    data: null,
    promise: null,
  };

  function createPromise(): Promise<T> {
    const promise = fn().then((data) => {
      if (state.promise === promise) {
        state.data = { some: data };
        state.promise = null;
      }
      return data;
    }).catch((err) => {
      if (state.promise === promise) {
        state.promise = null;
      }
      throw err;
    });
    return promise;
  }

  async function get(): Promise<T> {
    if (state.data && state.promise) {
      return (state.data.some);
    }
    if (state.data) {
      const promise = createPromise();
      promise.catch((err) => {
        console.error(err);
      });
      state.promise = promise;
      return (state.data.some);
    }
    if (state.promise) {
      const data = await state.promise;
      state = { data: { some: data }, promise: null };
      return data;
    }
    const promise = createPromise();
    state = { data: null, promise };
    try {
      const data = await promise;
      state = { data: { some: data }, promise: null };
      return data;
    } catch (err) {
      state.promise = null;
      throw err;
    }
  }

  get().catch((err) => {
    console.error(err);
  });

  return { get };
}
