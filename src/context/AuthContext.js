import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  HR_USERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_ATTENDANCE,
  INITIAL_ATTENDANCE_SESSIONS,
  INITIAL_CHATS,
  INITIAL_HOLIDAYS,
  INITIAL_LEAVES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORGANIZATION_POSTS,
  INITIAL_REGULARIZATION_REQUESTS,
  INITIAL_SALARY_SLIPS,
  ROLE_PERMISSIONS
} from "../data/hrData";

const STORAGE_KEY = "hr_portal_state_v1";
const AVAILABLE_THEMES = [
  { key: "ocean", label: "Ocean Blue" },
  { key: "emerald", label: "Emerald Green" },
  { key: "sunset", label: "Sunset Orange" },
  { key: "berry", label: "Berry Pink" }
];

const baseState = {
  currentUserId: null,
  users: HR_USERS,
  attendance: INITIAL_ATTENDANCE,
  attendanceSessions: INITIAL_ATTENDANCE_SESSIONS,
  holidays: INITIAL_HOLIDAYS,
  regularizationRequests: INITIAL_REGULARIZATION_REQUESTS,
  leaves: INITIAL_LEAVES,
  organizationPosts: INITIAL_ORGANIZATION_POSTS,
  salarySlips: INITIAL_SALARY_SLIPS,
  notifications: INITIAL_NOTIFICATIONS,
  chats: INITIAL_CHATS,
  activityLogs: INITIAL_ACTIVITY_LOGS,
  inviteLinks: [],
  uiTheme: "ocean"
};

const AuthContext = createContext(null);

const inferLocationFromTimezone = (timezone) => {
  if (!timezone) return "Unknown location";
  const parts = timezone.split("/");
  if (parts.length < 2) return timezone;
  return `${parts[1].replace(/_/g, " ")}, ${parts[0]}`;
};

const createLogEntry = (action, user, timezone, location) => ({
  id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  action,
  userId: user.id,
  userName: user.name,
  timezone,
  location,
  timestamp: new Date().toISOString()
});

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateLeaveDays = (fromDate, toDate, dayType = "Full Day") => {
  if (!fromDate || !toDate) return 0;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

  const millis = end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  const dayCount = Math.floor(millis / (1000 * 60 * 60 * 24)) + 1;

  if (dayType === "Half Day") return 0.5;
  return dayCount;
};

const getApprovalRoleLabel = (user) => {
  if (!user) return "Approver";
  if (user.role === "admin") return "HR";
  if (/manager/i.test(user.designation || "")) return "Manager";
  if (/senior/i.test(user.designation || "")) return "Senior";
  return "Approver";
};

const createInviteToken = () => `inv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const ensurePostShape = (post) => ({
  ...post,
  attachments: Array.isArray(post.attachments) ? post.attachments : [],
  likes: Array.isArray(post.likes) ? post.likes : [],
  comments: Array.isArray(post.comments) ? post.comments : []
});

const ensureUserProfileShape = (user, fallback = {}) => {
  const merged = { ...fallback, ...user };
  const permissions =
    merged.role === "admin"
      ? Array.from(new Set([...(merged.permissions || []), ...ROLE_PERMISSIONS.admin]))
      : Array.from(new Set([...(merged.permissions || []), ...ROLE_PERMISSIONS.employee]));
  const defaultEducation = merged.education
    ? [
        {
          id: `edu-default-${merged.id}`,
          degree: merged.education,
          institution: "",
          year: "",
          score: ""
        }
      ]
    : [];

  const personalDetails = {
    dob: merged.personalDetails?.dob || merged.dob || "",
    gender: merged.personalDetails?.gender || "",
    maritalStatus: merged.personalDetails?.maritalStatus || "",
    bloodGroup: merged.personalDetails?.bloodGroup || "",
    nationality: merged.personalDetails?.nationality || "Indian",
    address: merged.personalDetails?.address || "",
    city: merged.personalDetails?.city || "",
    state: merged.personalDetails?.state || "",
    postalCode: merged.personalDetails?.postalCode || "",
    emergencyContactName: merged.personalDetails?.emergencyContactName || "",
    emergencyContactPhone: merged.personalDetails?.emergencyContactPhone || "",
    joiningDate: merged.personalDetails?.joiningDate || "",
    employeeCode: merged.personalDetails?.employeeCode || `${(merged.department || "EMP").slice(0, 3).toUpperCase()}-${merged.id?.toUpperCase()}`
  };

  return {
    ...merged,
    permissions,
    dob: merged.dob || personalDetails.dob,
    phone: merged.phone || "",
    location: merged.location || "",
    managerId: merged.managerId || null,
    personalDetails,
    educationDetails:
      Array.isArray(merged.educationDetails) && merged.educationDetails.length > 0
        ? merged.educationDetails
        : defaultEducation,
    verificationDocs: {
      aadharNumber: merged.verificationDocs?.aadharNumber || "",
      panNumber: merged.verificationDocs?.panNumber || "",
      nameOnAadhar: merged.verificationDocs?.nameOnAadhar || merged.name || "",
      nameOnPan: merged.verificationDocs?.nameOnPan || merged.name || "",
      aadharImage: merged.verificationDocs?.aadharImage || "",
      panImage: merged.verificationDocs?.panImage || ""
    }
  };
};

const getInitialState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return baseState;
  try {
    const parsed = JSON.parse(saved);
    const fallbackUsersById = HR_USERS.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const mergedUsers = (parsed.users || HR_USERS).map((user) => {
      const fallback = fallbackUsersById[user.id] || {};
      const migratedDepartment = user.department === "Engineering" ? "IT" : user.department;

      return ensureUserProfileShape(
        {
          ...fallback,
          ...user,
          department: migratedDepartment || fallback.department
        },
        fallback
      );
    });

    return {
      ...baseState,
      ...parsed,
      users: mergedUsers,
      organizationPosts: (parsed.organizationPosts || baseState.organizationPosts).map(ensurePostShape)
    };
  } catch (error) {
    return baseState;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    const initial = getInitialState();
    return {
      ...initial,
      users: initial.users.map((user) => ensureUserProfileShape(user)),
      organizationPosts: initial.organizationPosts.map(ensurePostShape)
    };
  });

  const persist = (nextState) => {
    setState(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  useEffect(() => {
    const nextTheme = state.uiTheme || "ocean";
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, [state.uiTheme]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) || null,
    [state.currentUserId, state.users]
  );

  const startAttendanceSession = (nextState, userId, nowIso) => {
    const now = new Date(nowIso);
    const today = toDateString(now);
    const openSession = nextState.attendanceSessions.find(
      (session) => session.userId === userId && session.date === today && !session.clockOut
    );
    if (openSession) return nextState.attendanceSessions;

    return [
      ...nextState.attendanceSessions,
      {
        id: `as-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        date: today,
        clockIn: nowIso,
        clockOut: null,
        workedMinutes: 0
      }
    ];
  };

  const closeAttendanceSession = (nextState, userId, nowIso) => {
    const now = new Date(nowIso);
    const sessions = [...nextState.attendanceSessions];
    const openIndexes = sessions
      .map((session, index) => ({ session, index }))
      .filter(({ session }) => session.userId === userId && !session.clockOut);

    if (openIndexes.length === 0) return nextState.attendanceSessions;

    const { index } = openIndexes[openIndexes.length - 1];
    const active = sessions[index];
    const inTime = new Date(active.clockIn);
    const workedMinutes = Math.max(Math.round((now - inTime) / 60000), 0);

    sessions[index] = {
      ...active,
      clockOut: nowIso,
      workedMinutes
    };

    return sessions;
  };

  const login = (email, password) => {
    const user = state.users.find((u) => u.email === email && u.password === password);
    if (!user) {
      return { success: false, message: "Invalid email or password" };
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const location = inferLocationFromTimezone(timezone);

    const nextState = {
      ...state,
      currentUserId: user.id,
      activityLogs: [createLogEntry("LOGIN", user, timezone, location), ...state.activityLogs]
    };

    persist(nextState);
    return { success: true };
  };

  const loginWithInvite = (token) => {
    const invite = state.inviteLinks.find((item) => item.token === token);
    if (!invite) return { success: false, message: "Invalid invite link." };
    if (invite.used) return { success: false, message: "Invite link already used." };
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return { success: false, message: "Invite link expired." };
    }

    const user = state.users.find((u) => u.id === invite.userId);
    if (!user) return { success: false, message: "User not found for this invite." };

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const location = inferLocationFromTimezone(timezone);

    const nextInviteLinks = state.inviteLinks.map((item) =>
      item.token === token ? { ...item, used: true, usedAt: new Date().toISOString() } : item
    );

    const nextState = {
      ...state,
      currentUserId: user.id,
      inviteLinks: nextInviteLinks,
      activityLogs: [createLogEntry("LOGIN", user, timezone, location), ...state.activityLogs]
    };

    persist(nextState);
    return { success: true };
  };

  const logout = () => {
    if (!currentUser) return;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const location = inferLocationFromTimezone(timezone);

    const nextState = {
      ...state,
      currentUserId: null,
      activityLogs: [createLogEntry("LOGOUT", currentUser, timezone, location), ...state.activityLogs]
    };

    persist(nextState);
  };

  const hasPermission = (permissionKey) => {
    if (!currentUser) return false;
    return currentUser.permissions.includes(permissionKey);
  };

  const attendanceClockIn = () => {
    if (!currentUser) return { success: false, message: "User not logged in." };
    const nowIso = new Date().toISOString();
    const nextSessions = startAttendanceSession(state, currentUser.id, nowIso);
    const wasStarted = nextSessions.length > state.attendanceSessions.length;
    if (!wasStarted) {
      return { success: false, message: "Attendance already started for today." };
    }
    persist({ ...state, attendanceSessions: nextSessions });
    return { success: true };
  };

  const attendanceClockOut = () => {
    if (!currentUser) return { success: false, message: "User not logged in." };
    const nowIso = new Date().toISOString();
    const nextSessions = closeAttendanceSession(state, currentUser.id, nowIso);
    const wasClosed = nextSessions.some(
      (session, index) => state.attendanceSessions[index] && !state.attendanceSessions[index].clockOut && session.clockOut
    );
    if (!wasClosed) {
      return { success: false, message: "No active attendance session to end." };
    }
    persist({ ...state, attendanceSessions: nextSessions });
    return { success: true };
  };

  const setTheme = (themeKey) => {
    if (!AVAILABLE_THEMES.some((theme) => theme.key === themeKey)) return;
    persist({ ...state, uiTheme: themeKey });
  };

  const updateUserAccess = (userId, role, permissions) => {
    const nextUsers = state.users.map((u) => {
      if (u.id !== userId) return u;
      return {
        ...u,
        role,
        permissions: role === "admin" ? ROLE_PERMISSIONS.admin : permissions
      };
    });

    persist({ ...state, users: nextUsers });
  };

  const getEligibleApprovers = (employee) => {
    const manager = employee.managerId ? state.users.find((u) => u.id === employee.managerId) : null;
    const hrAndSenior = state.users.filter(
      (u) =>
        u.id !== employee.id &&
        (u.role === "admin" || (/senior/i.test(u.designation || "") && u.department === employee.department))
    );

    return [manager, ...hrAndSenior].filter(Boolean);
  };

  const buildApproverQueue = (employee, selectedApproverIds = []) => {
    const eligibleApprovers = getEligibleApprovers(employee);
    const approverMap = eligibleApprovers.reduce((acc, approver) => {
      acc[approver.id] = approver;
      return acc;
    }, {});

    const selectedApprovers = selectedApproverIds
      .map((id) => approverMap[id])
      .filter(Boolean);

    const fallbackApprovers = eligibleApprovers.filter(
      (approver) => !selectedApproverIds.includes(approver.id)
    );

    const allApprovers = [...selectedApprovers, ...fallbackApprovers];
    const unique = [];
    const seen = new Set();
    allApprovers.forEach((approver) => {
      if (seen.has(approver.id)) return;
      seen.add(approver.id);
      unique.push(approver);
    });

    return unique.map((approver, idx) => ({
      approverId: approver.id,
      approverRole: getApprovalRoleLabel(approver),
      status: idx === 0 ? "Pending" : "Awaiting",
      comment: "",
      actedAt: null
    }));
  };

  const getPaidLeaveSummary = (userId, asOfDate = new Date()) => {
    const user = state.users.find((u) => u.id === userId);
    if (!user) return { accrued: 0, used: 0, remaining: 0 };

    const joiningDateStr = user.personalDetails?.joiningDate;
    const joiningDate = joiningDateStr ? new Date(joiningDateStr) : new Date(asOfDate.getFullYear(), 0, 1);

    const startYear = joiningDate.getFullYear();
    const startMonth = joiningDate.getMonth();
    const endYear = asOfDate.getFullYear();
    const endMonth = asOfDate.getMonth();

    let months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    if (months < 0) months = 0;

    const accrued = Number((months * 1.5).toFixed(1));
    const used = state.leaves
      .filter((leave) => {
        if (leave.userId !== userId) return false;
        if (leave.status !== "Approved") return false;
        return leave.type === "Paid Leave";
      })
      .reduce((sum, leave) => sum + (leave.leaveDays || calculateLeaveDays(leave.fromDate, leave.toDate, leave.dayType)), 0);

    return {
      accrued,
      used: Number(used.toFixed(1)),
      remaining: Number(Math.max(accrued - used, 0).toFixed(1))
    };
  };

  const applyLeave = (leaveInput) => {
    if (!currentUser) return;
    const selectedApproverIds = Array.isArray(leaveInput.selectedApproverIds)
      ? leaveInput.selectedApproverIds
      : [];
    const dayType = leaveInput.dayType || "Full Day";
    const leaveDays = calculateLeaveDays(leaveInput.fromDate, leaveInput.toDate, dayType);
    const approvalFlow = buildApproverQueue(currentUser, selectedApproverIds);
    const currentApproverId = approvalFlow[0]?.approverId || null;
    const firstRole = approvalFlow[0]?.approverRole;

    const leave = {
      id: `l-${Date.now()}`,
      userId: currentUser.id,
      ...leaveInput,
      selectedApproverIds,
      dayType,
      leaveDays,
      status: currentApproverId ? `Pending with ${firstRole}` : "Pending",
      adminComment: "",
      approvalFlow,
      currentApprovalIndex: approvalFlow.length > 0 ? 0 : -1,
      currentApproverId
    };

    const approvers = approvalFlow
      .map((step) => state.users.find((u) => u.id === step.approverId))
      .filter(Boolean);

    const approverNotifications = approvers.map((approver) => ({
      id: `n-${Date.now()}-${approver.id}`,
      userId: approver.id,
      title: "New leave request",
      message: `${currentUser.name} submitted ${leaveInput.type} (${leaveDays} day(s)).`,
      channel: "email",
      status: "sent",
      createdAt: new Date().toISOString(),
      read: false
    }));

    persist({
      ...state,
      leaves: [leave, ...state.leaves],
      notifications: [...approverNotifications, ...state.notifications]
    });
  };

  const takeLeaveAction = (leaveId, action, comment = "") => {
    if (!currentUser) return;

    const targetLeave = state.leaves.find((leave) => leave.id === leaveId);
    if (!targetLeave) return;
    if (!Array.isArray(targetLeave.approvalFlow) || targetLeave.approvalFlow.length === 0) return;

    const pendingIndex = targetLeave.approvalFlow.findIndex(
      (step) => step.approverId === currentUser.id && step.status === "Pending"
    );

    if (pendingIndex === -1) return;

    const updatedFlow = targetLeave.approvalFlow.map((step, idx) => {
      if (idx !== pendingIndex) return step;
      return {
        ...step,
        status: action === "Approved" ? "Approved" : "Denied",
        comment,
        actedAt: new Date().toISOString()
      };
    });

    const applicant = state.users.find((u) => u.id === targetLeave.userId);
    let nextStatus = targetLeave.status;
    let currentApproverId = null;
    let currentApprovalIndex = -1;

    const nextNotifications = [];

    if (action === "Denied") {
      nextStatus = "Denied";
      nextNotifications.push({
        id: `n-${Date.now()}-leave-denied`,
        userId: targetLeave.userId,
        title: "Leave denied",
        message: `Your ${targetLeave.type} request was denied by ${currentUser.name}.`,
        channel: "email",
        status: "sent",
        createdAt: new Date().toISOString(),
        read: false
      });
    } else {
      const nextIndex = pendingIndex + 1;
      if (nextIndex < updatedFlow.length) {
        updatedFlow[nextIndex] = { ...updatedFlow[nextIndex], status: "Pending" };
        currentApproverId = updatedFlow[nextIndex].approverId;
        currentApprovalIndex = nextIndex;
        nextStatus = `Pending with ${updatedFlow[nextIndex].approverRole}`;

        nextNotifications.push({
          id: `n-${Date.now()}-leave-next`,
          userId: currentApproverId,
          title: "Leave approval pending",
          message: `${applicant?.name || "Employee"} leave request awaits your review.`,
          channel: "email",
          status: "sent",
          createdAt: new Date().toISOString(),
          read: false
        });
      } else {
        nextStatus = "Approved";
        nextNotifications.push({
          id: `n-${Date.now()}-leave-approved`,
          userId: targetLeave.userId,
          title: "Leave approved",
          message: `Your ${targetLeave.type} request is fully approved.`,
          channel: "email",
          status: "sent",
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    }

    const updatedLeaves = state.leaves.map((leave) => {
      if (leave.id !== leaveId) return leave;
      return {
        ...leave,
        status: nextStatus,
        adminComment: comment || leave.adminComment,
        approvalFlow: updatedFlow,
        currentApproverId,
        currentApprovalIndex
      };
    });

    persist({
      ...state,
      leaves: updatedLeaves,
      notifications: [...nextNotifications, ...state.notifications]
    });
  };

  const sendChatMessage = (toUserId, text) => {
    if (!currentUser || !text.trim()) return;

    const participantSet = [currentUser.id, toUserId].sort().join(":");
    const chatIndex = state.chats.findIndex(
      (chat) => chat.participants.slice().sort().join(":") === participantSet
    );

    const newMessage = {
      id: `m-${Date.now()}`,
      from: currentUser.id,
      text,
      createdAt: new Date().toISOString()
    };

    let nextChats = [...state.chats];

    if (chatIndex >= 0) {
      nextChats[chatIndex] = {
        ...nextChats[chatIndex],
        messages: [...nextChats[chatIndex].messages, newMessage]
      };
    } else {
      nextChats = [
        ...nextChats,
        {
          id: `c-${Date.now()}`,
          participants: [currentUser.id, toUserId],
          messages: [newMessage]
        }
      ];
    }

    const receiver = state.users.find((u) => u.id === toUserId);
    const chatNotification = {
      id: `n-${Date.now()}-chat`,
      userId: toUserId,
      title: "New chat message",
      message: `${currentUser.name} sent: ${text.slice(0, 45)}${text.length > 45 ? "..." : ""}`,
      channel: "app",
      status: "sent",
      createdAt: new Date().toISOString(),
      read: false
    };

    const emailNotification = {
      id: `n-${Date.now()}-mail`,
      userId: toUserId,
      title: "Email notification",
      message: `Email queued to ${receiver?.email || "user"} for new chat message.`,
      channel: "email",
      status: "sent",
      createdAt: new Date().toISOString(),
      read: false
    };

    persist({
      ...state,
      chats: nextChats,
      notifications: [chatNotification, emailNotification, ...state.notifications]
    });
  };

  const markNotificationRead = (notificationId) => {
    const notifications = state.notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    persist({ ...state, notifications });
  };

  const createCompanyPost = ({ title, message, attachments = [] }) => {
    if (!currentUser) return { success: false, message: "Unauthorized request." };
    if (!(currentUser.role === "admin" || hasPermission("access"))) {
      return { success: false, message: "You do not have rights to publish company posts." };
    }
    if (!title?.trim() || !message?.trim()) {
      return { success: false, message: "Title and message are required." };
    }

    const post = ensurePostShape({
      id: `p-${Date.now()}`,
      title: title.trim(),
      summary: message.trim().slice(0, 160),
      message: message.trim(),
      author: currentUser.name,
      authorId: currentUser.id,
      createdAt: new Date().toISOString(),
      attachments,
      likes: [],
      comments: []
    });

    const notifications = state.users
      .filter((user) => user.id !== currentUser.id)
      .map((user) => ({
        id: `n-${Date.now()}-post-${user.id}`,
        userId: user.id,
        title: `Company Post: ${post.title}`,
        message: `${currentUser.name} posted a new announcement.`,
        channel: "app",
        status: "sent",
        createdAt: new Date().toISOString(),
        read: false
      }));

    persist({
      ...state,
      organizationPosts: [post, ...state.organizationPosts],
      notifications: [...notifications, ...state.notifications]
    });

    return { success: true, post };
  };

  const togglePostLike = (postId) => {
    if (!currentUser) return;

    const post = state.organizationPosts.find((item) => item.id === postId);
    if (!post) return;

    const alreadyLiked = (post.likes || []).includes(currentUser.id);

    const organizationPosts = state.organizationPosts.map((item) => {
      if (item.id !== postId) return item;
      return ensurePostShape({
        ...item,
        likes: alreadyLiked
          ? item.likes.filter((userId) => userId !== currentUser.id)
          : [...(item.likes || []), currentUser.id]
      });
    });

    persist({
      ...state,
      organizationPosts
    });
  };

  const addPostComment = (postId, text) => {
    if (!currentUser || !text?.trim()) return;

    const comment = {
      id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      message: text.trim(),
      createdAt: new Date().toISOString()
    };

    const organizationPosts = state.organizationPosts.map((item) => {
      if (item.id !== postId) return item;
      return ensurePostShape({
        ...item,
        comments: [...(item.comments || []), comment]
      });
    });

    persist({
      ...state,
      organizationPosts
    });
  };

  const createEmployeeInvite = ({
    name,
    email,
    department,
    designation,
    permissions = ["dashboard", "attendance", "profile", "leave", "salary", "chat", "notifications"]
  }) => {
    if (!currentUser) return { success: false, message: "Unauthorized request." };
    if (state.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: "Email already exists." };
    }

    const userId = `u-${Date.now()}`;
    const password = `temp-${Math.random().toString(36).slice(2, 8)}`;

    const newUser = ensureUserProfileShape({
      id: userId,
      name,
      email,
      password,
      role: "employee",
      permissions,
      designation: designation || `${department} Associate`,
      department,
      location: "",
      phone: "",
      image: HR_USERS[1]?.image || "",
      managerId: currentUser.id,
      personalDetails: {
        employeeCode: `${department.slice(0, 3).toUpperCase()}-${userId.slice(-4).toUpperCase()}`,
        joiningDate: new Date().toISOString().slice(0, 10)
      }
    });

    const token = createInviteToken();
    const invite = {
      token,
      userId,
      email,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      used: false
    };

    const portalLink = `${window.location.origin}/ingeniousportal/invite/${token}`;

    const notificationToEmployee = {
      id: `n-${Date.now()}-invite-user`,
      userId,
      title: "Ingenious Portal Access Link",
      message: `Use this portal link to sign in directly: ${portalLink}`,
      channel: "email",
      status: "sent",
      createdAt: new Date().toISOString(),
      read: false
    };

    const notificationToCreator = {
      id: `n-${Date.now()}-invite-admin`,
      userId: currentUser.id,
      title: "Employee Portal Link Generated",
      message: `Portal link for ${email}: ${portalLink}`,
      channel: "app",
      status: "sent",
      createdAt: new Date().toISOString(),
      read: false
    };

    persist({
      ...state,
      users: [...state.users, newUser],
      inviteLinks: [invite, ...state.inviteLinks],
      notifications: [notificationToCreator, notificationToEmployee, ...state.notifications]
    });

    return { success: true, portalLink, user: newUser };
  };

  const updateCurrentUserProfile = (nextProfile) => {
    if (!currentUser) return;

    const users = state.users.map((user) => {
      if (user.id !== currentUser.id) return user;

      const personalDetails = {
        ...user.personalDetails,
        ...(nextProfile.personalDetails || {})
      };

      const verificationDocs = {
        ...user.verificationDocs,
        ...(nextProfile.verificationDocs || {})
      };

      const educationDetails = Array.isArray(nextProfile.educationDetails)
        ? nextProfile.educationDetails
        : user.educationDetails;

      return ensureUserProfileShape({
        ...user,
        ...nextProfile,
        dob: personalDetails.dob || user.dob,
        phone: nextProfile.phone || user.phone,
        location: nextProfile.location || user.location,
        education: educationDetails[0]?.degree || user.education,
        personalDetails,
        verificationDocs,
        educationDetails
      });
    });

    persist({ ...state, users });
  };

  const submitRegularizationRequest = ({ date, reason, recipientUserId = null }) => {
    if (!currentUser) return { success: false, message: "User not logged in." };
    if (!date || !reason?.trim()) return { success: false, message: "Date and reason are required." };

    const exists = state.regularizationRequests.find(
      (request) =>
        request.userId === currentUser.id &&
        request.date === date &&
        request.status === "Pending"
    );
    if (exists) return { success: false, message: "Pending request already exists for this date." };

    const recipient =
      recipientUserId
        ? state.users.find((user) => user.id === recipientUserId)
        : state.users.find((user) => user.role === "admin");

    const request = {
      id: `rr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: currentUser.id,
      date,
      reason: reason.trim(),
      recipientUserId: recipient?.id || null,
      recipientEmail: recipient?.email || "",
      status: "Pending",
      createdAt: new Date().toISOString(),
      reviewedBy: null,
      reviewComment: ""
    };

    const notifications = recipient
      ? [
          {
            id: `n-${Date.now()}-reg-${recipient.id}`,
            userId: recipient.id,
            title: "Attendance regularization request",
            message: `${currentUser.name} requested attendance regularization for ${date}.`,
            channel: "email",
            status: "sent",
            createdAt: new Date().toISOString(),
            read: false
          }
        ]
      : [];

    persist({
      ...state,
      regularizationRequests: [request, ...state.regularizationRequests],
      notifications: [...notifications, ...state.notifications]
    });

    return { success: true };
  };

  const regularizeAttendance = ({ userId, date, requestId = null, comment = "" }) => {
    if (!currentUser) return { success: false, message: "User not logged in." };
    if (!(currentUser.role === "admin" || hasPermission("access"))) {
      return { success: false, message: "You are not allowed to regularize attendance." };
    }
    if (!userId || !date) return { success: false, message: "Employee and date are required." };

    const clockIn = `${date}T09:00:00.000Z`;
    const clockOut = `${date}T18:00:00.000Z`;

    let updatedSessions = [...state.attendanceSessions];
    const existingIndex = updatedSessions.findIndex(
      (session) => session.userId === userId && session.date === date
    );

    if (existingIndex >= 0) {
      updatedSessions[existingIndex] = {
        ...updatedSessions[existingIndex],
        clockIn: updatedSessions[existingIndex].clockIn || clockIn,
        clockOut,
        workedMinutes: Math.max(updatedSessions[existingIndex].workedMinutes || 0, 540)
      };
    } else {
      updatedSessions = [
        ...updatedSessions,
        {
          id: `as-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId,
          date,
          clockIn,
          clockOut,
          workedMinutes: 540
        }
      ];
    }

    const requests = state.regularizationRequests.map((request) => {
      if (request.id !== requestId) return request;
      return {
        ...request,
        status: "Approved",
        reviewedBy: currentUser.id,
        reviewComment: comment || "Regularized as full day by HR/Admin.",
        reviewedAt: new Date().toISOString()
      };
    });

    const notification = {
      id: `n-${Date.now()}-reg-approved`,
      userId,
      title: "Attendance regularized",
      message: `Your attendance for ${date} was regularized as full day.`,
      channel: "email",
      status: "sent",
      createdAt: new Date().toISOString(),
      read: false
    };

    persist({
      ...state,
      attendanceSessions: updatedSessions,
      regularizationRequests: requests,
      notifications: [notification, ...state.notifications]
    });

    return { success: true };
  };

  const adminUpdateAttendance = ({
    userId,
    date,
    attendanceStatus,
    workDayType = "No Work Session",
    comment = ""
  }) => {
    if (!currentUser) return { success: false, message: "User not logged in." };
    if (!(currentUser.role === "admin" || hasPermission("access"))) {
      return { success: false, message: "You are not allowed to edit attendance." };
    }
    if (!userId || !date || !attendanceStatus) {
      return { success: false, message: "Employee, date and attendance status are required." };
    }

    const validStatuses = ["Present", "Absent", "WFH"];
    if (!validStatuses.includes(attendanceStatus)) {
      return { success: false, message: "Invalid attendance status." };
    }

    const nextAttendance = [...state.attendance];
    const existingAttendanceIndex = nextAttendance.findIndex(
      (record) => record.userId === userId && record.date === date
    );

    if (existingAttendanceIndex >= 0) {
      nextAttendance[existingAttendanceIndex] = {
        ...nextAttendance[existingAttendanceIndex],
        status: attendanceStatus
      };
    } else {
      nextAttendance.push({
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        date,
        status: attendanceStatus
      });
    }

    const sessionsWithoutDate = state.attendanceSessions.filter(
      (session) => !(session.userId === userId && session.date === date)
    );

    let nextSessions = sessionsWithoutDate;
    if (attendanceStatus !== "Absent") {
      if (workDayType === "Full Day") {
        nextSessions = [
          ...sessionsWithoutDate,
          {
            id: `as-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId,
            date,
            clockIn: `${date}T09:00:00.000Z`,
            clockOut: `${date}T18:00:00.000Z`,
            workedMinutes: 540
          }
        ];
      } else if (workDayType === "Half Day") {
        nextSessions = [
          ...sessionsWithoutDate,
          {
            id: `as-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId,
            date,
            clockIn: `${date}T09:00:00.000Z`,
            clockOut: `${date}T14:00:00.000Z`,
            workedMinutes: 300
          }
        ];
      }
    }

    const notification = {
      id: `n-${Date.now()}-attendance-admin-update`,
      userId,
      title: "Attendance updated by HR/Admin",
      message: `Attendance on ${date} updated to ${attendanceStatus}${comment ? ` (${comment})` : ""}.`,
      channel: "email",
      status: "sent",
      createdAt: new Date().toISOString(),
      read: false
    };

    persist({
      ...state,
      attendance: nextAttendance,
      attendanceSessions: nextSessions,
      notifications: [notification, ...state.notifications]
    });

    return { success: true };
  };

  const deleteEducationEntry = (educationId) => {
    if (!currentUser) return;

    const users = state.users.map((user) => {
      if (user.id !== currentUser.id) return user;
      const educationDetails = (user.educationDetails || []).filter((edu) => edu.id !== educationId);
      return ensureUserProfileShape({
        ...user,
        educationDetails,
        education: educationDetails[0]?.degree || ""
      });
    });

    persist({ ...state, users });
  };

  const deleteVerificationDocument = (type) => {
    if (!currentUser) return;

    const users = state.users.map((user) => {
      if (user.id !== currentUser.id) return user;
      const verificationDocs = { ...user.verificationDocs };

      if (type === "aadhar") {
        verificationDocs.aadharImage = "";
        verificationDocs.aadharNumber = "";
      }
      if (type === "pan") {
        verificationDocs.panImage = "";
        verificationDocs.panNumber = "";
      }

      return ensureUserProfileShape({
        ...user,
        verificationDocs
      });
    });

    persist({ ...state, users });
  };

  const value = {
    ...state,
    currentUser,
    uiTheme: state.uiTheme,
    availableThemes: AVAILABLE_THEMES,
    login,
    logout,
    attendanceClockIn,
    attendanceClockOut,
    setTheme,
    hasPermission,
    updateUserAccess,
    applyLeave,
    takeLeaveAction,
    getPaidLeaveSummary,
    sendChatMessage,
    markNotificationRead,
    createCompanyPost,
    togglePostLike,
    addPostComment,
    submitRegularizationRequest,
    regularizeAttendance,
    adminUpdateAttendance,
    updateCurrentUserProfile,
    deleteEducationEntry,
    deleteVerificationDocument,
    createEmployeeInvite,
    loginWithInvite
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
