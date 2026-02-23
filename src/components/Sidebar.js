import React, { useState } from "react";
import SimpleBar from "simplebar-react";
import { useLocation, Link } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faComments,
  faBullhorn,
  faClipboardCheck,
  faUserCheck,
  faIdBadge,
  faMoneyCheckAlt,
  faTachometerAlt,
  faUserCog,
  faCalendarCheck,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { Button, Image, Nav, Navbar } from "@themesberg/react-bootstrap";

import { Routes } from "../routes";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const { pathname } = location;
  const { currentUser, hasPermission } = useAuth();
  const [show, setShow] = useState(false);

  const showClass = show ? "show" : "";

  const navItems = [
    { title: "Dashboard", path: Routes.HRDashboard.path, icon: faTachometerAlt, permission: "dashboard" },
    { title: "Company Post", path: Routes.CompanyPosts.path, icon: faBullhorn, permission: "company_posts" },
    { title: "Attendance", path: Routes.Attendance.path, icon: faClipboardCheck, permission: "attendance" },
    { title: "Regularize", path: Routes.Regularize.path, icon: faUserCheck, permission: "regularize" },
    { title: "Profile", path: Routes.Profile.path, icon: faIdBadge, permission: "profile" },
    { title: "Leave", path: Routes.Leave.path, icon: faCalendarCheck, permission: "leave" },
    { title: "Salary Slips", path: Routes.Salary.path, icon: faMoneyCheckAlt, permission: "salary" },
    { title: "Messages / Chat", path: Routes.Chat.path, icon: faComments, permission: "chat" },
    { title: "Notifications", path: Routes.Notifications.path, icon: faBell, permission: "notifications" },
    { title: "Access Control", path: Routes.AccessControl.path, icon: faUserCog, permission: "access" }
  ].filter((item) => hasPermission(item.permission));

  const onCollapse = () => setShow(!show);

  return (
    <>
      <Navbar expand={false} collapseOnSelect variant="dark" className="navbar-theme-primary px-4 d-md-none">
        <Navbar.Brand as={Link} to={Routes.HRDashboard.path}>
          Ingenoius Portal
        </Navbar.Brand>
        <Navbar.Toggle as={Button} aria-controls="main-navbar" onClick={onCollapse}>
          <FontAwesomeIcon icon={faBars} />
        </Navbar.Toggle>
      </Navbar>

      <CSSTransition timeout={300} in={show} classNames="sidebar-transition">
        <SimpleBar className={`collapse ${showClass} sidebar d-md-block bg-primary text-white`}>
          <div className="sidebar-inner px-4 pt-3">
            <div className="user-card d-flex d-md-none align-items-center justify-content-between pb-4">
              <div className="d-flex align-items-center">
                <div className="user-avatar lg-avatar me-3">
                  <Image src={currentUser.image} className="rounded-circle border-white" />
                </div>
                <div>
                  <h6 className="mb-0">{currentUser.name}</h6>
                  <small className="text-capitalize">{currentUser.role}</small>
                </div>
              </div>
              <Nav.Link className="collapse-close d-md-none" onClick={onCollapse}>
                <FontAwesomeIcon icon={faTimes} />
              </Nav.Link>
            </div>

            <Nav className="flex-column pt-3 pt-md-0">
              <div className="mb-4">
                <h5 className="text-white mb-1">Ingenious HR Portal</h5>
                <small>{currentUser.designation}</small>
              </div>

              {navItems.map((item) => (
                <Nav.Item key={item.path} className={pathname === item.path ? "active" : ""} onClick={() => setShow(false)}>
                  <Nav.Link as={Link} to={item.path}>
                    <span className="sidebar-icon">
                      <FontAwesomeIcon icon={item.icon} />
                    </span>
                    <span className="sidebar-text">{item.title}</span>
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </div>
        </SimpleBar>
      </CSSTransition>
    </>
  );
}
