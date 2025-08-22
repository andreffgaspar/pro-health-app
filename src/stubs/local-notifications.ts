export const LocalNotifications = {
  checkPermissions: async () => ({ display: 'denied' as const }),
  requestPermissions: async () => ({ display: 'denied' as const }),
  schedule: async (_options: any) => {},
  addListener: async (_event: string, _cb: any) => ({ remove: async () => {} }),
  cancel: async (_options: any) => {},
  getPending: async () => ({ notifications: [] as any[] })
};

export default { LocalNotifications };
