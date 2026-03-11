import api from "../api/axios.ts";

export const classService = {
  getClasses: () => api.get("/classes"),
  getClass: (id: string) => api.get(`/classes/${id}`),
  createClass: (data: any) => api.post("/classes", data),
  joinClass: (code: string) => api.post("/classes/join", { code }),
  deleteClass: (id: string) => api.delete(`/classes/${id}`),
};

export const assignmentService = {
  getAssignments: (classId: string) => api.get(`/assignments/${classId}`),
  getAllAssignments: () => api.get("/assignments/all"),
  getUpcomingAssignments: () => api.get("/assignments/upcoming"),
  getPendingAssignments: (classId: string) => api.get(`/assignments/pending/${classId}`),
  createAssignment: (data: any) => api.post("/assignments", data),
  submitAssignment: (data: any) => api.post("/assignments/submit", data),
  getSubmissionHistory: (assignmentId: string) => api.get(`/assignments/history/${assignmentId}`),
  getSubmissions: (assignmentId: string) => api.get(`/assignments/submissions/${assignmentId}`),
  gradeSubmission: (id: string, data: any) => api.patch(`/assignments/grade/${id}`, data),
};

export const materialService = {
  getMaterials: (classId: string) => api.get(`/materials/${classId}`),
  addMaterial: (data: any) => api.post("/materials", data),
  deleteMaterial: (id: string) => api.delete(`/materials/${id}`),
};

export const commentService = {
  createComment: (data: any) => api.post("/comments", data),
};

export const attendanceService = {
  getAttendance: (classId: string) => api.get(`/attendance/${classId}`),
  markAttendance: (data: any) => api.post("/attendance", data),
};

export const discussionService = {
  getDiscussions: (classId: string) => api.get(`/discussions/class/${classId}`),
  createDiscussion: (classId: string, data: any) => api.post(`/discussions/class/${classId}`, data),
  getDiscussionReplies: (discussionId: string) => api.get(`/discussions/${discussionId}/replies`),
  createDiscussionReply: (discussionId: string, data: any) => api.post(`/discussions/${discussionId}/replies`, data),
};
