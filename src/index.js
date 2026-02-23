import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import "./scss/volt.scss";
import "./styles/theme-overrides.css";
import "react-datetime/css/react-datetime.css";

import HomePage from "./pages/HomePage";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.render(
  <BrowserRouter basename="/ingeniousportal">
    <AuthProvider>
      <ScrollToTop />
      <HomePage />
    </AuthProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
