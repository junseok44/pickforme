export const cacheKey = {
  coupang: {
    bestCategories: (categoryId: string) => `bestcategories:${categoryId}`,
    goldbox: 'goldbox',
  },
  analytics: {
    userStatistics: (startDate: string, endDate: string) =>
      `analytics:user:${startDate}:${endDate}`,
    homeStatistics: (startDate: string, endDate: string) =>
      `analytics:home:${startDate}:${endDate}`,
    searchStatistics: (startDate: string, endDate: string) =>
      `analytics:search:${startDate}:${endDate}`,
    linkSearchStatistics: (startDate: string, endDate: string) =>
      `analytics:linkSearch:${startDate}:${endDate}`,
    productDetailStatistics: (startDate: string, endDate: string) =>
      `analytics:productDetail:${startDate}:${endDate}`,
    membershipStatistics: (startDate: string, endDate: string) =>
      `analytics:membership:${startDate}:${endDate}`,
    managerQAStatistics: (startDate: string, endDate: string) =>
      `analytics:managerQA:${startDate}:${endDate}`,
  },
};
