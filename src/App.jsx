import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { SocketProvider } from "./context/SocketContext";

import LoginScreen from "./LoginScreen";
import AdminLayout from "./AdminLayout";

import Dashboard from "./Pages/Dashboard";
import JDRequirement from "./Pages/JDRequirment";
import Employees from "./Pages/Employees";
import Attendance from "./Pages/Attendance";
import Payments from "./Pages/Payments";
import Settings from "./Pages/Settings";
import Accounts from "./Pages/Accounts";
import Approvals from "./Pages/Approvals";
import Tickets from "./Pages/Tickets";
import Assets from "./Pages/Assets";
import EmployeeRequests from "./Pages/EmployeeRequests";
import WFHRequests from "./Pages/WFHRequests";
import OfferLetters from "./Pages/OfferLetters";



import AddEmployee from "./Pages/AddEmployee";
import EditEmployee from "./Pages/EditEmployee";
import ManageEmployee from "./Pages/ManageEmployee";
import Profile from "./Pages/Profile";
import AdminProfile from "./Pages/AdminProfile";
import Companies from "./Pages/Companies";
import CompanyDetails from "./Pages/CompanyDetails";
import AddCompany from "./Pages/AddCompany";
import Departments from "./Pages/Departments";
import AddDepartment from "./Pages/AddDepartment";
import Notifications from "./Pages/Notifications";

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <ToastContainer />
        <Routes>

        {/* ================= LOGIN ================= */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* ================= DASHBOARD + SIDEBAR ================= */}
        <Route path="/dashboard" element={<AdminLayout />}>

          <Route index element={<Dashboard />} />
          <Route path="jd-requirement" element={<JDRequirement />} />
          <Route path="employees" element={<Employees />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="payments" element={<Payments />} />
          <Route path="settings" element={<Settings />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="assets" element={<Assets />} />
          <Route path="employee-requests" element={<EmployeeRequests />} />
          <Route path="wfh-requests" element={<WFHRequests />} />
          <Route path="offer-letters" element={<OfferLetters />} />
          <Route path="notifications" element={<Notifications />} />



          {/* ADMIN PROFILE */}
          <Route path="admin-profile" element={<AdminProfile />} />
          <Route path="profile/:employeeId" element={<Profile />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:companyId" element={<CompanyDetails />} />
          <Route path="departments" element={<Departments />} />

          {/* FORM PAGES MOVED INSIDE LAYOUT */}
          <Route path="add-employee" element={<AddEmployee />} />
          <Route path="edit-employee/:employeeId" element={<EditEmployee />} />
          <Route path="manage-employee/:employeeId" element={<ManageEmployee />} />
          <Route path="add-company" element={<AddCompany />} />
          <Route path="add-department" element={<AddDepartment />} />
        </Route>

      </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
