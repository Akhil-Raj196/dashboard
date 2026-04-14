const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && payload.message) ||
      (typeof payload === "string" ? payload : "Request failed");
    throw new Error(message);
  }

  return payload;
};

const request = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  return parseResponse(response);
};

export const hrApi = {
  getBootstrap: (currentUserId) =>
    request(`/hr/bootstrap${currentUserId ? `?currentUserId=${encodeURIComponent(currentUserId)}` : ""}`),
  login: (payload) =>
    request("/hr/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  loginWithInvite: (payload) =>
    request("/hr/invite-login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  changePassword: (payload) =>
    request("/hr/change-password", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  logout: (payload) =>
    request("/hr/logout", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  clockIn: (payload) =>
    request("/hr/attendance/clock-in", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  clockOut: (payload) =>
    request("/hr/attendance/clock-out", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateAccess: (userId, payload) =>
    request(`/hr/access/${encodeURIComponent(userId)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  createInvite: (payload) =>
    request("/hr/invites", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateProfile: (userId, payload) =>
    request(`/hr/users/${encodeURIComponent(userId)}/profile`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteEducation: (userId, educationId) =>
    request(`/hr/users/${encodeURIComponent(userId)}/education/${encodeURIComponent(educationId)}`, {
      method: "DELETE"
    }),
  deleteDocument: (userId, type) =>
    request(`/hr/users/${encodeURIComponent(userId)}/documents/${encodeURIComponent(type)}`, {
      method: "DELETE"
    }),
  updatePayroll: (userId, payload) =>
    request(`/hr/users/${encodeURIComponent(userId)}/payroll`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  applyLeave: (payload) =>
    request("/hr/leaves", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  takeLeaveAction: (leaveId, payload) =>
    request(`/hr/leaves/${encodeURIComponent(leaveId)}/action`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  sendChatMessage: (payload) =>
    request("/hr/chats/messages", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  markNotificationRead: (notificationId, payload) =>
    request(`/hr/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  createCompanyPost: (payload) =>
    request("/hr/posts", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  togglePostLike: (postId, payload) =>
    request(`/hr/posts/${encodeURIComponent(postId)}/like`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  addPostComment: (postId, payload) =>
    request(`/hr/posts/${encodeURIComponent(postId)}/comments`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  submitRegularizationRequest: (payload) =>
    request("/hr/regularizations", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  regularizeAttendance: (payload) =>
    request("/hr/regularizations/approve", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  adminUpdateAttendance: (payload) =>
    request("/hr/attendance/admin", {
      method: "PUT",
      body: JSON.stringify(payload)
    })
};
