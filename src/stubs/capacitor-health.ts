export const Health = {
  isHealthAvailable: async () => ({ available: false }),
  requestHealthPermissions: async (_options: { permissions: string[] }) => ({}),
  queryAggregated: async (_options: any) => ({ aggregatedData: [] as any[] })
};

export default { Health };
