import { create } from "zustand";

const CACHE_TTL_MS = 5 * 60 * 1000;

const makeKey = (orgId, months, token) => `${orgId || ""}:${months}:${token || ""}`;

const usePredictionsStore = create((set, get) => ({
  cache: {},

  getEntry: (orgId, months, token) => get().cache[makeKey(orgId, months, token)] || null,

  setPrediction: (orgId, months, token, data) => {
    const key = makeKey(orgId, months, token);
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          data,
          loading: false,
          error: "",
          fetchedAt: Date.now(),
          promise: null,
        },
      },
    }));
  },

  invalidateOrg: (orgId) => {
    set((state) => ({
      cache: Object.fromEntries(
        Object.entries(state.cache).filter(([key]) => !key.startsWith(`${orgId}:`)),
      ),
    }));
  },

  fetchPrediction: async ({ apiBase, orgId, months, token, force = false }) => {
    if (!orgId) return null;

    const key = makeKey(orgId, months, token);
    const existing = get().cache[key];
    const isFresh =
      existing?.fetchedAt && Date.now() - existing.fetchedAt < CACHE_TTL_MS;

    if (!force && existing?.data && isFresh) {
      return existing.data;
    }

    if (!force && existing?.promise) {
      return existing.promise;
    }

    const promise = fetch(`${apiBase}/predictions/${orgId}?months=${months}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(text || "Failed to load predictions");
        }
        return response.json();
      })
      .then((data) => {
        get().setPrediction(orgId, months, token, data);
        return data;
      })
      .catch((error) => {
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: {
              data: existing?.data || null,
              loading: false,
              error: error.message || "Failed to load predictions",
              fetchedAt: existing?.fetchedAt || 0,
              promise: null,
            },
          },
        }));
        throw error;
      });

    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          data: existing?.data || null,
          loading: true,
          error: "",
          fetchedAt: existing?.fetchedAt || 0,
          promise,
        },
      },
    }));

    return promise;
  },
}));

export default usePredictionsStore;
