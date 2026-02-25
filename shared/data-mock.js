// Temporary mock data utilities used until backend endpoints are wired.

export function mockChats() {
  return [
    {
      chat_id: crypto.randomUUID(),
      title: 'White lace set for Cyprus',
      snippet: 'Assistant: Here are five curated lingerie stores that deliver to Limassol...',
      updated_at: Date.now() - 1000 * 60 * 60 * 4,
      groups: ['grp-fashion']
    },
    {
      chat_id: crypto.randomUUID(),
      title: 'Laptop for photo editing',
      snippet: 'You: Need a 14" machine under $1800 with Lightroom performance.',
      updated_at: Date.now() - 1000 * 60 * 60 * 24,
      groups: ['grp-tech']
    },
    {
      chat_id: crypto.randomUUID(),
      title: 'Gifts for partners',
      snippet: 'Assistant: Curated a wishlist split by categories and budgets.',
      updated_at: Date.now() - 1000 * 60 * 15,
      groups: ['grp-gifts', 'grp-fashion']
    }
  ];
}

export function mockGroups() {
  return [
    { id: 'grp-fashion', name: 'Fashion' },
    { id: 'grp-tech', name: 'Tech' },
    { id: 'grp-gifts', name: 'Gifts' }
  ];
}
