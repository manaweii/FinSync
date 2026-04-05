import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_LAYOUT = [
  'kpis',
  'trend',
  'expensePie',
  'categoryBar',
  'dataPreview',
  'alertsSection',
  'quickActions',
  'supportCard',
];

const normalizeLayout = (layout) => {
  const incoming = Array.isArray(layout) ? layout.filter((item) => DEFAULT_LAYOUT.includes(item)) : [];
  const seen = new Set();
  const deduped = incoming.filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
  const missing = DEFAULT_LAYOUT.filter((item) => !seen.has(item));
  return [...deduped, ...missing];
};

// Simple dashboard settings store. Persisted so user preferences survive reloads.
const useDashboardSettings = create(
  persist(
    (set, get) => ({
      showKPIs: true,
      showTrend: true,
      showExpensePie: true,
      showCategoryBar: true,
      showDataPreview: true,
      // layout is an ordered list of widget keys
      layout: DEFAULT_LAYOUT,

      setLayout: (layout) => set(() => ({ layout: normalizeLayout(layout) })),
      moveWidget: (fromIndex, toIndex) =>
        set((state) => {
          const l = Array.from(state.layout);
          const [moved] = l.splice(fromIndex, 1);
          l.splice(toIndex, 0, moved);
          return { layout: normalizeLayout(l) };
        }),

      // Save current settings + layout to server
      saveToServer: async (apiBase, token, currentUser) => {
        try {
          const body = {
            userId: currentUser?.id || currentUser?._id || null,
            orgId: currentUser?.orgId || null,
            settings: {
              showKPIs: get().showKPIs,
              showTrend: get().showTrend,
              showExpensePie: get().showExpensePie,
              showCategoryBar: get().showCategoryBar,
              showDataPreview: get().showDataPreview,
            },
            layout: get().layout,
          };
          const res = await fetch(`${apiBase}/dashboard-settings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error('Failed to save dashboard settings');
          return await res.json();
        } catch (err) {
          console.error('saveToServer error', err);
          throw err;
        }
      },

      // Load settings from server and apply to local store
      loadFromServer: async (apiBase, token, currentUser) => {
        try {
          const id = currentUser?.orgId || currentUser?.id || '';
          if (!id) return null;
          const res = await fetch(`${apiBase}/dashboard-settings/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) return null;
          const data = await res.json();
          // apply
          if (data?.settings) {
            set({
              showKPIs: data.settings.showKPIs ?? get().showKPIs,
              showTrend: data.settings.showTrend ?? get().showTrend,
              showExpensePie: data.settings.showExpensePie ?? get().showExpensePie,
              showCategoryBar: data.settings.showCategoryBar ?? get().showCategoryBar,
              showDataPreview: data.settings.showDataPreview ?? get().showDataPreview,
            });
          }
          if (data?.layout && Array.isArray(data.layout)) {
            set({ layout: normalizeLayout(data.layout) });
          } else {
            set({ layout: normalizeLayout(get().layout) });
          }
          return data;
        } catch (err) {
          console.error('loadFromServer error', err);
          set({ layout: normalizeLayout(get().layout) });
          return null;
        }
      },

      setSetting: (key, value) => set(() => ({ [key]: value })),
      toggle: (key) => set((s) => ({ [key]: !s[key] })),
      reset: () =>
        set({
          showKPIs: true,
          showTrend: true,
          showExpensePie: true,
          showCategoryBar: true,
          showDataPreview: true,
          layout: DEFAULT_LAYOUT,
        }),
    }),
    {
      name: 'dashboard-settings',
    },
  ),
);

export default useDashboardSettings;
