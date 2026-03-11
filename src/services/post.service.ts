import api from "../api/axios.ts";

export const postService = {
  // Global Stream
  createGlobalPost: (data: any, headers?: any) => api.post("/global-stream/post", data, { headers }),
  getGlobalPosts: () => api.get("/global-stream/posts"),
  
  // Class Stream
  createClassPost: (classId: string, data: any, headers?: any) => api.post(`/class/${classId}/post`, data, { headers }),
  getClassPosts: (classId: string) => api.get(`/class/${classId}/posts`),
  
  // Common
  reactToPost: (postId: number, type: string) => api.post(`/stream/${postId}/react`, { type }),
  commentOnPost: (postId: number, text: string) => api.post(`/stream/${postId}/comment`, { text }),
  deletePost: (postId: number) => api.delete(`/stream/${postId}`),
  getLinkPreview: (url: string) => api.get(`/stream/link-preview?url=${encodeURIComponent(url)}`),
};
