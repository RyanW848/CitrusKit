import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useNotificationStore = create(
    persist(
        (set, get) => ({
            notifications: [],
            toasts: [],

            addNotifications: (incoming) => {
                const old_notifcation = new Set(get().notification.map(n => n.id));
                const new_notifcation = incoming.filter(n => !old_notifcation.has(n.id));

                if (!new_notifcation.length) return;

                set(state => ({
                    notifications: [...new_notifcation, ...state.notifications].slice(0, 50),
                    toasts: [...state.toasts, ...new_notifcation],
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
            manualPoll: () => {
                const fn = get()._manualPoll;
                if (fn) fn();
            },
        }),
        {
            name: 'citruskit-notifications',
            partialize: state => ({ notifications: state.notifications}),
        }
    )
);

export default useNotificationStore;