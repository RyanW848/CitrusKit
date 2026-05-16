import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useNotificationStore = create(
    persist(
        (set, get) => ({
            notifications: [],
            toasts: [],

            addNotifications: (incoming) => {
                const oldNotifications = new Set(
                    get().notifications.map(n => n.id)
                );

                const newNotifications = incoming.filter(
                    n => !oldNotifications.has(n.id)
                );

                if (!newNotifications.length) return;

                set(state => ({
                    notifications: [
                        ...newNotifications,
                        ...state.notifications,
                    ].slice(0, 50),

                    toasts: [
                        ...state.toasts,
                        ...newNotifications,
                    ],
                }));
            },

            dismissToast: (id) => {
                set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
            },

            markAllSeen: () => {
                set(state => ({
                    notifications: state.notifications.map(n => ({ ...n, seen: true })),
                }));
            },

            clearAll: () => set({ notifications: [], toasts: [] }),

            unseenCount: () => get().notifications.filter(n => !n.seen).length,

            _manualPoll: null,
            
            registerManualPoll: (fn) => set({ _manualPoll: fn }),

            manualPoll: async () => {
                const fn = get()._manualPoll;

                if (fn) {
                    return await fn();
                }
            },
        }),
        {
            name: 'citruskit-notifications',
            partialize: state => ({ notifications: state.notifications }),
        }
    )
);

export default useNotificationStore;