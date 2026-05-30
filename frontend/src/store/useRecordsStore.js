import { create } from "zustand";

const CACHE_TTL_MS = 5 * 60 * 1000;

const makeKey = (orgName, token) => `${orgName || ""}:${token || ""}`;

const getHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

const useRecordsStore = create((set, get) => ({
  cache: {},

  getEntry: (orgName, token) => get().cache[makeKey(orgName, token)] || null,

  setRecords: (orgName, token, records) => {
    const key = makeKey(orgName, token);
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          records: Array.isArray(records) ? records : [],
          loading: false,
          error: "",
          fetchedAt: Date.now(),
          promise: null,
        },
      },
    }));
  },

  removeRecord: (orgName, token, recordId) => {
    const key = makeKey(orgName, token);
    set((state) => {
      const entry = state.cache[key];
      if (!entry) return state;

      return {
        cache: {
          ...state.cache,
          [key]: {
            ...entry,
            records: entry.records.filter(
              (record) => String(record?._id) !== String(recordId),
            ),
            fetchedAt: Date.now(),
          },
        },
      };
    });
  },

  invalidate: (orgName, token) => {
    const key = makeKey(orgName, token);
    set((state) => {
      const { [key]: _removed, ...cache } = state.cache;
      return { cache };
    });
  },

  fetchRecords: async ({ apiBase, orgName, token, force = false }) => {
    if (!orgName) {
      return [];
    }

    const key = makeKey(orgName, token);
    const existing = get().cache[key];
    const isFresh =
      existing?.fetchedAt && Date.now() - existing.fetchedAt < CACHE_TTL_MS;

    if (!force && existing?.records && isFresh) {
      return existing.records;
    }

    if (!force && existing?.promise) {
      return existing.promise;
    }

    const promise = fetch(
      `${apiBase}/records?orgName=${encodeURIComponent(orgName)}`,
      {
        headers: getHeaders(token),
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(text || "Failed to load records");
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      })
      .then((records) => {
        get().setRecords(orgName, token, records);
        return records;
      })
      .catch((error) => {
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: {
              records: existing?.records || [],
              loading: false,
              error: error.message || "Failed to load records",
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
          records: existing?.records || [],
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

export default useRecordsStore;
