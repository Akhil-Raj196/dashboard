import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";

import { Routes } from "../routes";
import { useAuth } from "../context/AuthContext";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import Login from "./hr/Login";
import InviteSignin from "./hr/InviteSignin";
import Dashboard from "./hr/Dashboard";
import CompanyPosts from "./hr/CompanyPosts";
import Attendance from "./hr/Attendance";
import Regularize from "./hr/Regularize";
import Profile from "./hr/Profile";
import Leave from "./hr/Leave";
import Salary from "./hr/Salary";
import Chat from "./hr/Chat";
import Notifications from "./hr/Notifications";
import AccessControl from "./hr/AccessControl";

const GuardedRoute = ({ component: Component, permission, ...rest }) => {
  const { currentUser, hasPermission } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!currentUser) return <Redirect to={Routes.Login.path} />;
        if (permission && !hasPermission(permission)) return <Redirect to={Routes.HRDashboard.path} />;

        return (
          <>
            <Sidebar />
            <main className="content">
              <Navbar />
              <Component {...props} />
              <Footer />
            </main>
          </>
        );
      }}
    />
  );
};

const LoginRoute = () => {
  const { currentUser } = useAuth();
  if (currentUser) return <Redirect to={Routes.HRDashboard.path} />;
  return <Login />;
};

export default function HomePage() {
  return (
    <Switch>
      <Route exact path={Routes.Login.path} component={LoginRoute} />
      <Route exact path={Routes.InviteSignin.path} component={InviteSignin} />

      <GuardedRoute exact path={Routes.HRDashboard.path} component={Dashboard} permission="dashboard" />
      <GuardedRoute exact path={Routes.CompanyPosts.path} component={CompanyPosts} permission="company_posts" />
      <GuardedRoute exact path={Routes.Attendance.path} component={Attendance} permission="attendance" />
      <GuardedRoute exact path={Routes.Regularize.path} component={Regularize} permission="regularize" />
      <GuardedRoute exact path={Routes.Profile.path} component={Profile} permission="profile" />
      <GuardedRoute exact path={Routes.Leave.path} component={Leave} permission="leave" />
      <GuardedRoute exact path={Routes.Salary.path} component={Salary} permission="salary" />
      <GuardedRoute exact path={Routes.Chat.path} component={Chat} permission="chat" />
      <GuardedRoute exact path={Routes.Notifications.path} component={Notifications} permission="notifications" />
      <GuardedRoute exact path={Routes.AccessControl.path} component={AccessControl} permission="access" />

      <Redirect to={Routes.Login.path} />
    </Switch>
  );
}
