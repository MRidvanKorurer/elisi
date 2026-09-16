import API from './api';

export const reviewService = {
  getReviews: async (productId, { page = 1, limit = 8 } = {}) => {
    const response = await API.get(`/reviews/${encodeURIComponent(productId)}`, {
      params: { page, limit }
    });
    return response.data;
  },

  getEligibility: async (productId) => {
    const response = await API.get(`/reviews/${encodeURIComponent(productId)}/eligibility`);
    return response.data;
  },

  createReview: async (productId, { rating, comment, photos = [] }) => {
    const form = new FormData();
    form.append('rating', String(rating));
    form.append('comment', comment);
    photos.forEach((file) => form.append('photos', file));
    const response = await API.post(`/reviews/${encodeURIComponent(productId)}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await API.delete(`/reviews/item/${encodeURIComponent(reviewId)}`);
    return response.data;
  }
};

export default reviewService;
