import { create } from "zustand";

const CACHE_TTL_MS = 5 * 60 * 1000;

const makeKey = (orgId, token) => `${orgId || ""}:${token || ""}`;

const useImportsStore = create((set, get) => ({
  cache: {},

  getEntry: (orgId, token) => get().cache[makeKey(orgId, token)] || null,

  setImports: (orgId, token, imports) => {
    const key = makeKey(orgId, token);
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          imports: Array.isArray(imports) ? imports : [],
          loading: false,
          error: "",
          fetchedAt: Date.now(),
          promise: null,
        },
      },
    }));
  },

  prependImport: (orgId, token, createdImport) => {
    const key = makeKey(orgId, token);
    set((state) => {
      const entry = state.cache[key] || { imports: [] };
      return {
        cache: {
          ...state.cache,
          [key]: {
            ...entry,
            imports: [createdImport, ...(entry.imports || [])],
            loading: false,
            error: "",
            fetchedAt: Date.now(),
            promise: null,
          },
        },
      };
    });
  },

  fetchImports: async ({ apiBase, orgId, token, force = false }) => {
    if (!orgId) return [];

    const key = makeKey(orgId, token);
    const existing = get().cache[key];
    const isFresh =
      existing?.fetchedAt && Date.now() - existing.fetchedAt < CACHE_TTL_MS;

    if (!force && existing?.imports && isFresh) {
      return existing.imports;
    }

    if (!force && existing?.promise) {
      return existing.promise;
    }

    const promise = fetch(`${apiBase}/past-imports/${orgId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch imports");
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      })
      .then((imports) => {
        get().setImports(orgId, token, imports);
        return imports;
      })
      .catch((error) => {
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: {
              imports: existing?.imports || [],
              loading: false,
              error: error.message || "Could not load past imports.",
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
          imports: existing?.imports || [],
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

export default useImportsStore;
