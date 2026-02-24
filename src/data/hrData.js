import Profile1 from "../assets/img/team/profile-picture-1.jpg";
import Profile2 from "../assets/img/team/profile-picture-2.jpg";
import Profile3 from "../assets/img/team/profile-picture-3.jpg";
import Profile4 from "../assets/img/team/profile-picture-4.jpg";
import Profile5 from "../assets/img/team/profile-picture-5.jpg";

const toDateStr = (date) => date.toISOString().slice(0, 10);

const todayDate = new Date();
const tomorrowDate = new Date(todayDate);
tomorrowDate.setDate(todayDate.getDate() + 1);

const nextWeekDate = new Date(todayDate);
nextWeekDate.setDate(todayDate.getDate() + 5);

const today = toDateStr(todayDate);
const tomorrow = toDateStr(tomorrowDate);
const nextWeek = toDateStr(nextWeekDate);
const currentYear = todayDate.getFullYear();
const todayMonthDay = today.slice(5);
const tomorrowMonthDay = tomorrow.slice(5);

export const ROLE_PERMISSIONS = {
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

export const HR_USERS = [
  {
    id: "u1",
    name: "Ananya Mehta",
    email: "admin@hrportal.com",
    password: "admin123",
    role: "admin",
    permissions: ROLE_PERMISSIONS.admin,
    designation: "HR Admin",
    department: "Human Resources",
    dob: "1990-09-18",
    location: "New York, USA",
    education: "MBA in Human Resource Management",
    phone: "+1-202-555-0101",
    image: Profile1,
    managerId: null,
    personalDetails: {
      employeeCode: "HR-U1",
      dob: "1990-09-18",
      gender: "Female",
      maritalStatus: "Married",
      bloodGroup: "A+",
      nationality: "Indian",
      joiningDate: "2020-01-10",
      address: "101 Park Avenue",
      city: "New York",
      state: "New York",
      postalCode: "10017",
      emergencyContactName: "Rakesh Mehta",
      emergencyContactPhone: "+1-202-555-0181"
    }
  },
  {
    id: "u2",
    name: "Rohan Kumar",
    email: "employee@hrportal.com",
    password: "emp123",
    role: "employee",
    permissions: ROLE_PERMISSIONS.employee,
    designation: "Software Engineer",
    department: "IT",
    dob: `${currentYear - 31}-${todayMonthDay}`,
    location: "Austin, USA",
    education: "B.Tech in Computer Science",
    phone: "+1-202-555-0102",
    image: Profile2,
    managerId: "u6",
    personalDetails: {
      employeeCode: "IT-U2",
      dob: `${currentYear - 31}-${todayMonthDay}`,
      gender: "Male",
      maritalStatus: "Single",
      bloodGroup: "B+",
      nationality: "Indian",
      joiningDate: "2023-06-01",
      address: "742 Evergreen Terrace",
      city: "Austin",
      state: "Texas",
      postalCode: "73301",
      emergencyContactName: "Amit Kumar",
      emergencyContactPhone: "+1-202-555-0191"
    },
    educationDetails: [
      {
        id: "edu-u2-1",
        degree: "B.Tech in Computer Science",
        institution: "NIT Trichy",
        year: "2018",
        score: "8.4 CGPA"
      },
      {
        id: "edu-u2-2",
        degree: "Higher Secondary",
        institution: "Delhi Public School",
        year: "2014",
        score: "91%"
      }
    ],
    verificationDocs: {
      aadharNumber: "1234-5678-9012",
      panNumber: "ABCDE1234F",
      nameOnAadhar: "Rohan Kumar",
      nameOnPan: "Rohan Kumar",
      aadharImage: "",
      panImage: ""
    }
  },
  {
    id: "u3",
    name: "Sara Wilson",
    email: "sara@hrportal.com",
    password: "sara123",
    role: "employee",
    permissions: ROLE_PERMISSIONS.employee,
    designation: "Product Designer",
    department: "Design",
    dob: "1995-12-04",
    location: "Seattle, USA",
    education: "B.Des in Visual Communication",
    phone: "+1-202-555-0103",
    image: Profile3,
    managerId: "u1"
  },
  {
    id: "u4",
    name: "Daniel Brown",
    email: "daniel@hrportal.com",
    password: "daniel123",
    role: "employee",
    permissions: ROLE_PERMISSIONS.employee,
    designation: "Finance Analyst",
    department: "Finance",
    dob: "1992-11-29",
    location: "Chicago, USA",
    education: "M.Com in Finance",
    phone: "+1-202-555-0104",
    image: Profile4,
    managerId: "u1"
  },
  {
    id: "u5",
    name: "Priya Nair",
    email: "priya@hrportal.com",
    password: "priya123",
    role: "employee",
    permissions: ROLE_PERMISSIONS.employee,
    designation: "IT Support Engineer",
    department: "IT",
    dob: `${currentYear - 28}-${tomorrowMonthDay}`,
    location: "Dallas, USA",
    education: "B.Sc IT",
    phone: "+1-202-555-0105",
    image: Profile5,
    managerId: "u6"
  },
  {
    id: "u6",
    name: "Vikram Singh",
    email: "manager.it@hrportal.com",
    password: "manager123",
    role: "employee",
    permissions: ROLE_PERMISSIONS.employee,
    designation: "Senior IT Manager",
    department: "IT",
    dob: "1988-04-10",
    location: "Austin, USA",
    education: "M.Tech Information Systems",
    phone: "+1-202-555-0106",
    image: Profile1,
    managerId: "u1",
    personalDetails: {
      employeeCode: "IT-U6",
      dob: "1988-04-10",
      gender: "Male",
      maritalStatus: "Married",
      bloodGroup: "O+",
      nationality: "Indian",
      joiningDate: "2019-03-15",
      address: "50 Congress Ave",
      city: "Austin",
      state: "Texas",
      postalCode: "73301",
      emergencyContactName: "Neha Singh",
      emergencyContactPhone: "+1-202-555-0172"
    }
  }
];

export const INITIAL_ATTENDANCE = [
  { id: "a1", date: today, userId: "u2", status: "Present" },
  { id: "a2", date: today, userId: "u3", status: "WFH" },
  { id: "a3", date: today, userId: "u4", status: "Absent" },
  { id: "a4", date: today, userId: "u5", status: "Present" },
  { id: "a5", date: today, userId: "u1", status: "Present" },
  { id: "a6", date: today, userId: "u6", status: "Present" }
];

export const INITIAL_LEAVES = [
  {
    id: "l1",
    userId: "u2",
    type: "Casual Leave",
    fromDate: nextWeek,
    toDate: nextWeek,
    reason: "Family function",
    status: "Pending",
    adminComment: "",
    dayType: "Full Day",
    leaveDays: 1,
    approvalFlow: [
      { approverId: "u6", approverRole: "Manager", status: "Pending", comment: "", actedAt: null },
      { approverId: "u1", approverRole: "HR", status: "Awaiting", comment: "", actedAt: null }
    ],
    currentApprovalIndex: 0,
    currentApproverId: "u6"
  },
  {
    id: "l2",
    userId: "u3",
    type: "Sick Leave",
    fromDate: today,
    toDate: tomorrow,
    reason: "Medical rest",
    status: "Approved",
    adminComment: "Approved. Get well soon.",
    dayType: "Full Day",
    leaveDays: 2,
    approvalFlow: [
      { approverId: "u1", approverRole: "HR", status: "Approved", comment: "Approved. Get well soon.", actedAt: `${today}T10:00:00.000Z` }
    ],
    currentApprovalIndex: -1,
    currentApproverId: null
  }
];

export const INITIAL_ORGANIZATION_POSTS = [
  {
    id: "p1",
    title: "Quarterly HR Policy Update",
    author: "Ananya Mehta",
    createdAt: "2026-02-20T10:00:00.000Z",
    summary: "Updated leave policy and hybrid work guidelines are now active."
  },
  {
    id: "p2",
    title: "Payroll Processing Notice",
    author: "Finance Team",
    createdAt: "2026-02-22T09:00:00.000Z",
    summary: "Salary slips are auto-generated on the 2nd day of each month for the previous month."
  },
  {
    id: "p3",
    title: "Employee Wellness Camp",
    author: "HR Operations",
    createdAt: "2026-02-23T08:30:00.000Z",
    summary: "Health check-up camp scheduled next week for all departments."
  }
];

export const INITIAL_SALARY_SLIPS = [
  { id: "s1", userId: "u2", month: "January 2026", basic: 5200, allowances: 900, deductions: 400, net: 5700 },
  { id: "s2", userId: "u2", month: "February 2026", basic: 5200, allowances: 900, deductions: 380, net: 5720 },
  { id: "s3", userId: "u3", month: "January 2026", basic: 4800, allowances: 700, deductions: 300, net: 5200 },
  { id: "s4", userId: "u4", month: "January 2026", basic: 5000, allowances: 850, deductions: 350, net: 5500 },
  { id: "s5", userId: "u5", month: "January 2026", basic: 4700, allowances: 800, deductions: 320, net: 5180 }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: "n1",
    userId: "u2",
    title: "Leave request received",
    message: "Your leave request is pending HR approval.",
    channel: "email",
    status: "sent",
    createdAt: "2026-02-23T08:30:00.000Z",
    read: false
  },
  {
    id: "n2",
    userId: "u3",
    title: "Leave approved",
    message: "Your sick leave has been approved by HR.",
    channel: "email",
    status: "sent",
    createdAt: "2026-02-22T14:00:00.000Z",
    read: false
  },
  {
    id: "n3",
    userId: "u1",
    title: "Monthly payroll ready",
    message: "Salary slips are available for all departments.",
    channel: "app",
    status: "sent",
    createdAt: "2026-02-21T12:30:00.000Z",
    read: true
  }
];

export const INITIAL_CHATS = [
  {
    id: "c1",
    participants: ["u1", "u2"],
    messages: [
      {
        id: "m1",
        from: "u2",
        text: "Hi HR, I have submitted my leave request.",
        createdAt: "2026-02-23T08:32:00.000Z"
      },
      {
        id: "m2",
        from: "u1",
        text: "Received. I will review it today.",
        createdAt: "2026-02-23T09:10:00.000Z"
      }
    ]
  }
];

export const INITIAL_ACTIVITY_LOGS = [];

export const INITIAL_ATTENDANCE_SESSIONS = [];

export const INITIAL_HOLIDAYS = [
  {
    id: "h1",
    date: `${today.slice(0, 8)}10`,
    name: "Founders Day",
    type: "official"
  },
  {
    id: "h2",
    date: `${today.slice(0, 8)}25`,
    name: "Festival Holiday",
    type: "official"
  }
];

export const INITIAL_REGULARIZATION_REQUESTS = [];
