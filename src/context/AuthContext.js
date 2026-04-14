import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { hrApi } from "../utils/hrApi";

const SESSION_USER_KEY = "hr_portal_current_user_id";
const THEME_KEY = "hr_portal_ui_theme";
const DEFAULT_ROLE_PERMISSIONS = {
  admin: [
    "dashboard",
    "attendance",
    "regularize",
    "profile",
    "leave",
    "salary",
    "payroll_admin",
    "chat",
    "notifications",
    "access",
    "company_posts"
  ],
  employee: ["dashboard", "attendance", "profile", "leave", "salary", "chat", "notifications"]
};

const AVAILABLE_THEMES = [
  { key: "ocean", label: "Ocean Blue" },
  { key: "emerald", label: "Emerald Green" },
  { key: "sunset", label: "Sunset Orange" },
  { key: "berry", label: "Berry Pink" }
];

const baseState = {
  currentUserId: localStorage.getItem(SESSION_USER_KEY),
  users: [],
  attendance: [],
  attendanceSessions: [],
  holidays: [],
  regularizationRequests: [],
  leaves: [],
  organizationPosts: [],
  salarySlips: [],
  notifications: [],
  chats: [],
  activityLogs: [],
  inviteLinks: [],
  meta: {
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    permissionOptions: DEFAULT_ROLE_PERMISSIONS.admin,
    leaveTypes: [],
    dayTypes: [],
    attendanceStatuses: [],
    workDayTypes: [],
    roleOptions: ["employee", "admin"],
    currencyOptions: [],
    departments: [],
    designations: []
  },
  uiTheme: localStorage.getItem(THEME_KEY) || "ocean"
};

const AuthContext = createContext(null);

const hasValue = (value) => {
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
};

const ensurePostShape = (post) => ({
  ...post,
  attachments: Array.isArray(post.attachments) ? post.attachments : [],
  likes: Array.isArray(post.likes) ? post.likes : [],
  comments: Array.isArray(post.comments) ? post.comments : []
});

const ensureUserProfileShape = (user = {}) => {
  const resolvedName = user.name || "";
  const nameParts = resolvedName.trim().split(/\s+/).filter(Boolean);
  const defaultFirst = nameParts[0] || "";
  const defaultLast = nameParts.slice(1).join(" ");
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS;
  const permissions =
    user.role === "admin"
      ? Array.from(new Set([...(user.permissions || []), ...rolePermissions.admin]))
      : Array.from(new Set([...(user.permissions || []), ...rolePermissions.employee]));

  const personalDetails = {
    dob: user.personalDetails?.dob || user.dob || "",
    gender: user.personalDetails?.gender || "",
    maritalStatus: user.personalDetails?.maritalStatus || "",
    bloodGroup: user.personalDetails?.bloodGroup || "",
    nationality: user.personalDetails?.nationality || "Indian",
    address: user.personalDetails?.address || "",
    city: user.personalDetails?.city || "",
    state: user.personalDetails?.state || "",
    postalCode: user.personalDetails?.postalCode || "",
    emergencyContactName: user.personalDetails?.emergencyContactName || "",
    emergencyContactPhone: user.personalDetails?.emergencyContactPhone || "",
    joiningDate: user.personalDetails?.joiningDate || "",
    employeeCode:
      user.personalDetails?.employeeCode ||
      `${(user.department || "EMP").slice(0, 3).toUpperCase()}-${(user.id || "NEW").toUpperCase()}`
  };

  return {
    ...user,
    passwordChangeRequired: Boolean(user.passwordChangeRequired),
    permissions,
    dob: user.dob || personalDetails.dob,
    phone: user.phone || "",
    location: user.location || "",
    managerId: user.managerId || null,
    personalDetails,
    educationDetails: Array.isArray(user.educationDetails) ? user.educationDetails : [],
    verificationDocs: {
      aadharNumber: user.verificationDocs?.aadharNumber || "",
      panNumber: user.verificationDocs?.panNumber || "",
      nameOnAadhar: user.verificationDocs?.nameOnAadhar || user.name || "",
      nameOnPan: user.verificationDocs?.nameOnPan || user.name || "",
      aadharImage: user.verificationDocs?.aadharImage || "",
      panImage: user.verificationDocs?.panImage || ""
    },
    payrollDetails: {
      firstName: user.payrollDetails?.firstName || defaultFirst,
      lastName: user.payrollDetails?.lastName || defaultLast,
      employeeCode: user.payrollDetails?.employeeCode || personalDetails.employeeCode || "",
      pfNumber: user.payrollDetails?.pfNumber || "",
      esiNumber: user.payrollDetails?.esiNumber || "",
      accountNumber: user.payrollDetails?.accountNumber || "",
      ifscCode: user.payrollDetails?.ifscCode || "",
      bankName: user.payrollDetails?.bankName || "",
      ctcAnnual: Number(user.payrollDetails?.ctcAnnual || 0),
      currency: user.payrollDetails?.currency || "USD",
      basicPct: Number(user.payrollDetails?.basicPct || 40),
      hraPct: Number(user.payrollDetails?.hraPct || 20),
      conveyanceFixed: Number(user.payrollDetails?.conveyanceFixed || 0),
      medicalFixed: Number(user.payrollDetails?.medicalFixed || 0),
      specialAllowanceFixed: Number(user.payrollDetails?.specialAllowanceFixed || 0),
      otherAllowanceFixed: Number(user.payrollDetails?.otherAllowanceFixed || 0),
      pfRate: Number(user.payrollDetails?.pfRate || 12),
      esiRate: Number(user.payrollDetails?.esiRate || 0.75),
      professionalTax: Number(user.payrollDetails?.professionalTax || 200),
      tds: Number(user.payrollDetails?.tds || 0),
      loanDeduction: Number(user.payrollDetails?.loanDeduction || 0)
    }
  };
};

const normalizeServerState = (payload = {}) => ({
  currentUserId: payload.currentUserId || null,
  users: (payload.users || []).map((user) => ensureUserProfileShape(user)),
  attendance: payload.attendance || [],
  attendanceSessions: payload.attendanceSessions || [],
  holidays: payload.holidays || [],
  regularizationRequests: payload.regularizationRequests || [],
  leaves: payload.leaves || [],
  organizationPosts: (payload.organizationPosts || []).map(ensurePostShape),
  salarySlips: payload.salarySlips || [],
  notifications: payload.notifications || [],
  chats: payload.chats || [],
  activityLogs: payload.activityLogs || [],
  inviteLinks: payload.inviteLinks || [],
  meta: {
    ...baseState.meta,
    ...(payload.meta || {}),
    rolePermissions: payload.meta?.rolePermissions || baseState.meta.rolePermissions,
    permissionOptions: payload.meta?.permissionOptions || baseState.meta.permissionOptions,
    leaveTypes: payload.meta?.leaveTypes || baseState.meta.leaveTypes,
    dayTypes: payload.meta?.dayTypes || baseState.meta.dayTypes,
    attendanceStatuses: payload.meta?.attendanceStatuses || baseState.meta.attendanceStatuses,
    workDayTypes: payload.meta?.workDayTypes || baseState.meta.workDayTypes,
    roleOptions: payload.meta?.roleOptions || baseState.meta.roleOptions,
    currencyOptions: payload.meta?.currencyOptions || baseState.meta.currencyOptions,
    departments: payload.meta?.departments || baseState.meta.departments,
    designations: payload.meta?.designations || baseState.meta.designations
  }
});

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(baseState);
  const [isReady, setIsReady] = useState(false);
  const initialCurrentUserIdRef = useRef(baseState.currentUserId);

  const applyServerState = (payload, fallbackCurrentUserId = null) => {
    const normalized = normalizeServerState({
      ...payload,
      currentUserId: payload?.currentUserId ?? fallbackCurrentUserId
    });

    setState((prev) => ({
      ...prev,
      ...normalized
    }));

    if (normalized.currentUserId) {
      localStorage.setItem(SESSION_USER_KEY, normalized.currentUserId);
    } else {
      localStorage.removeItem(SESSION_USER_KEY);
    }

    return normalized;
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const initialCurrentUserId = initialCurrentUserIdRef.current || "";
        const bootstrap = await hrApi.getBootstrap(initialCurrentUserId);
        if (!mounted) return;
        applyServerState(bootstrap, initialCurrentUserId || null);
      } catch (error) {
        if (!mounted) return;
        localStorage.removeItem(SESSION_USER_KEY);
        setState((prev) => ({ ...prev, currentUserId: null }));
      } finally {
        if (mounted) setIsReady(true);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const nextTheme = state.uiTheme || "ocean";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  }, [state.uiTheme]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.currentUserId) || null,
    [state.currentUserId, state.users]
  );
  const requiresPasswordChange = Boolean(currentUser?.passwordChangeRequired);

  const withHandledRequest = async (callback, fallbackMessage) => {
    try {
      return await callback();
    } catch (error) {
      return { success: false, message: error.message || fallbackMessage };
    }
  };

  const login = async (email, password) =>
    withHandledRequest(async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await hrApi.login({ email, password, timezone });
      applyServerState(response.state, response.user?.id || null);
      return { success: true };
    }, "Unable to login.");

  const loginWithInvite = async (token) =>
    withHandledRequest(async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await hrApi.loginWithInvite({ token, timezone });
      applyServerState(response.state, response.user?.id || null);
      return { success: true };
    }, "Unable to process invite link.");

  const logout = async () => {
    if (!currentUser) return;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      await hrApi.logout({ userId: currentUser.id, timezone });
    } finally {
      localStorage.removeItem(SESSION_USER_KEY);
      setState((prev) => ({ ...prev, currentUserId: null }));
    }
  };

  const changePassword = async (currentPassword, newPassword) =>
    withHandledRequest(async () => {
      const response = await hrApi.changePassword({
        userId: currentUser.id,
        currentPassword,
        newPassword
      });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to update password.");

  const hasPermission = (permissionKey) => {
    if (!currentUser) return false;
    return (currentUser.permissions || []).includes(permissionKey);
  };

  const setTheme = (themeKey) => {
    if (!AVAILABLE_THEMES.some((theme) => theme.key === themeKey)) return;
    setState((prev) => ({ ...prev, uiTheme: themeKey }));
  };

  const attendanceClockIn = async () =>
    withHandledRequest(async () => {
      const response = await hrApi.clockIn({ userId: currentUser.id });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to update attendance.");

  const attendanceClockOut = async () =>
    withHandledRequest(async () => {
      const response = await hrApi.clockOut({ userId: currentUser.id });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to update attendance.");

  const updateUserAccess = async (userId, role, permissions) =>
    withHandledRequest(async () => {
      const response = await hrApi.updateAccess(userId, {
        currentUserId: currentUser?.id || null,
        role,
        permissions
      });
      applyServerState(response.state, currentUser?.id || null);
      return { success: true };
    }, "Unable to update access.");

  const getPaidLeaveSummary = (userId, asOfDate = new Date()) => {
    const user = state.users.find((item) => item.id === userId);
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
      .filter((leave) => leave.userId === userId && leave.status === "Approved" && leave.type === "Paid Leave")
      .reduce((sum, leave) => sum + Number(leave.leaveDays || 0), 0);

    return {
      accrued,
      used: Number(used.toFixed(1)),
      remaining: Number(Math.max(accrued - used, 0).toFixed(1))
    };
  };

  const applyLeave = async (leaveInput) =>
    withHandledRequest(async () => {
      const response = await hrApi.applyLeave({
        currentUserId: currentUser.id,
        ...leaveInput
      });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to submit leave request.");

  const takeLeaveAction = async (leaveId, action, comment = "") =>
    withHandledRequest(async () => {
      const response = await hrApi.takeLeaveAction(leaveId, {
        currentUserId: currentUser.id,
        action,
        comment
      });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to process leave request.");

  const sendChatMessage = async (toUserId, text) =>
    withHandledRequest(async () => {
      const response = await hrApi.sendChatMessage({
        currentUserId: currentUser.id,
        toUserId,
        text
      });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to send message.");

  const markNotificationRead = async (notificationId) =>
    withHandledRequest(async () => {
      const response = await hrApi.markNotificationRead(notificationId, {
        currentUserId: currentUser?.id || null
      });
      applyServerState(response.state, currentUser?.id || null);
      return { success: true };
    }, "Unable to update notification.");

  const createCompanyPost = async ({ title, message, attachments = [] }) =>
    withHandledRequest(async () => {
      const response = await hrApi.createCompanyPost({
        currentUserId: currentUser.id,
        title,
        message,
        attachments
      });
      applyServerState(response.state, currentUser.id);
      return { success: true, post: response.post };
    }, "Unable to create post.");

  const togglePostLike = async (postId) =>
    withHandledRequest(async () => {
      const response = await hrApi.togglePostLike(postId, {
        currentUserId: currentUser.id
      });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to update post like.");

  const addPostComment = async (postId, text) =>
    withHandledRequest(async () => {
      const response = await hrApi.addPostComment(postId, {
        currentUserId: currentUser.id,
        text
      });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to add comment.");

  const submitRegularizationRequest = async ({ date, reason, recipientUserId = null }) =>
    withHandledRequest(async () => {
      const response = await hrApi.submitRegularizationRequest({
        currentUserId: currentUser.id,
        date,
        reason,
        recipientUserId
      });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to submit regularization request.");

  const regularizeAttendance = async ({ userId, date, requestId = null, comment = "" }) =>
    withHandledRequest(async () => {
      const response = await hrApi.regularizeAttendance({
        currentUserId: currentUser.id,
        userId,
        date,
        requestId,
        comment
      });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to regularize attendance.");

  const adminUpdateAttendance = async (attendanceInput) =>
    withHandledRequest(async () => {
      const response = await hrApi.adminUpdateAttendance({
        currentUserId: currentUser.id,
        ...attendanceInput
      });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to update attendance.");

  const createEmployeeInvite = async (inviteInput) =>
    withHandledRequest(async () => {
      const response = await hrApi.createInvite({
        currentUserId: currentUser.id,
        appBaseUrl: `${window.location.origin}${process.env.PUBLIC_URL || "/ingeniousportal"}`,
        ...inviteInput
      });
      applyServerState(response.state, currentUser.id);
      return {
        success: true,
        portalLink: response.portalLink,
        tempPassword: response.tempPassword,
        emailDelivered: response.emailDelivered,
        emailMessage: response.emailMessage,
        mailerConfigured: response.mailerConfigured
      };
    }, "Unable to create employee access.");

  const updateCurrentUserProfile = async (nextProfile) =>
    withHandledRequest(async () => {
      const response = await hrApi.updateProfile(currentUser.id, {
        currentUserId: currentUser.id,
        ...nextProfile
      });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to update profile.");

  const updateEmployeePayroll = async (userId, payrollInput) =>
    withHandledRequest(async () => {
      const response = await hrApi.updatePayroll(userId, {
        currentUserId: currentUser.id,
        payroll: payrollInput
      });
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to update payroll details.");

  const deleteEducationEntry = async (educationId) =>
    withHandledRequest(async () => {
      const response = await hrApi.deleteEducation(currentUser.id, educationId);
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to delete education entry.");

  const deleteVerificationDocument = async (type) =>
    withHandledRequest(async () => {
      const response = await hrApi.deleteDocument(currentUser.id, type);
      applyServerState(response.state, currentUser.id);
      return { success: true };
    }, "Unable to delete document.");

  const value = {
    ...state,
    currentUser,
    isReady,
    requiresPasswordChange,
    availableThemes: AVAILABLE_THEMES,
    hasValue,
    login,
    loginWithInvite,
    changePassword,
    logout,
    hasPermission,
    setTheme,
    attendanceClockIn,
    attendanceClockOut,
    updateUserAccess,
    getPaidLeaveSummary,
    applyLeave,
    takeLeaveAction,
    sendChatMessage,
    markNotificationRead,
    createCompanyPost,
    togglePostLike,
    addPostComment,
    submitRegularizationRequest,
    regularizeAttendance,
    adminUpdateAttendance,
    createEmployeeInvite,
    updateCurrentUserProfile,
    updateEmployeePayroll,
    deleteEducationEntry,
    deleteVerificationDocument
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
