export const PushNotifications = {
  checkPermissions: async () => ({ receive: 'denied' as const }),
  requestPermissions: async () => ({ receive: 'denied' as const }),
  register: async () => {},
  addListener: async (_event: string, _cb: any) => ({ remove: async () => {} })
};

export default { PushNotifications };
