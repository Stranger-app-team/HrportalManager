import React, { useState } from 'react';
import { X, Camera, Upload, CheckCircle2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";

export default function AddEmployeeForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contactNumber: '+91',
    gender: '',
    employeeId: '',
    department: '',
    designation: '',
    reportingManager: '',
    employmentType: '',
    dateOfJoining: '',
    workLocation: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    officeEmail: '',
    temporaryPassword: '',
    roleLevel: '',
    basicSalary: '',
    bankAccountNumber: '',
    bankName: '',
    ifscCode: ''
  });
    
  const navigate = useNavigate();

  const [uploadedFiles, setUploadedFiles] = useState({
    aadhaar: null,
    pan: null,
    offerLetter: null,
    resume: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (type, e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [type]: file.name }));
    }
  };

  const handleSubmit = () => {
    console.log("Form Submitted", formData, uploadedFiles);
    alert("Employee data submitted (check console).");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="max-w-[1380px] mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-end gap-3 mb-6">
           <button onClick={() => navigate("/dashboard/employees")} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
             <X size={16} /> 
           </button>
        </div>

        {/* ========== TOP ROW: PROFILE PHOTO + PERSONAL INFO ========== */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">

          {/* PROFILE PHOTO (LEFT) */}
          <div className="w-full lg:w-[320px] h-auto lg:h-[140px] flex-shrink-0">
            <div className="border border-white rounded-3xl lg:rounded-[500px] px-8 py-4 h-full"
                 style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-white font-semibold text-base mb-2">Profile Photo</p>

              <div className="flex items-center gap-6">
                <div className="w-20 h-20 border-2 border-dashed border-white rounded-full flex items-center justify-center shrink-0">
                  <Camera size={30} strokeWidth={1.2} className="text-[#5a8fd6]" />
                </div>

                <div>
                  <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap">
                    Add photo
                  </button>
                  <p className="text-white text-[10px] mt-2 opacity-70 tracking-wide">JPG, PNG up to 5MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* PERSONAL INFORMATION (RIGHT) */}
          <div className="flex-1">
            <h2 className="text-white text-[13px] font-semibold mb-3 uppercase tracking-wider opacity-90">Personal Information</h2>

            {/* ROW 1: First, Middle, Last */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative w-full">
                <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">First Name *</span>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px] placeholder:text-[#C3CADF]"
                />
              </div>

              <div className="relative w-full">
                <span className="absolute top-[6px] left-3 text-[13px] text-[#D0D9E8]">Middle Name *</span>
                <input
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  placeholder="Enter middle name"
                  className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px] placeholder:text-[#C3CADF]"
                />
              </div>

              <div className="relative w-full">
                <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">Last Name *</span>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[14px] placeholder:text-[#C3CADF]"
                />
              </div>
            </div>

            {/* ROW 2: Email, Contact, Gender */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative w-full">
                <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">Email Address *</span>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email"
                  placeholder="Enter email address"
                  className="w-full h-[48px] text-[14px] bg-transparent focus:bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white placeholder:text-[#C3CADF]"
                />
              </div>

              <div className="relative w-full">
                <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">Contact Number *</span>
                <div className="flex items-center w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5">
                  <span className="text-white text-[14px] mr-1">+91</span>
                  <input
                    name="contactNumber"
                    value={formData.contactNumber.replace("+91", "")}
                    onChange={(e) => setFormData(p => ({...p, contactNumber: "+91" + e.target.value.replace(/\D/g,"").slice(0,10)}))}
                    type="text"
                    placeholder="XXXXXXXXXX"
                    className="w-full bg-transparent border-none outline-none text-white text-[14px] placeholder:text-[#C3CADF]/50"
                  />
                </div>
              </div>

              <div className="relative w-full">
                <span className="absolute top-[10px] left-3 text-[11px] text-[#D0D9E8]">Gender</span>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full h-[48px] text-[14px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white appearance-none"
                >
                  <option value="" disabled hidden></option>
                  <option value="Male" className="text-black">Male</option>
                  <option value="Female" className="text-black">Female</option>
                  <option value="Other" className="text-black">Other</option>
                  <option value="Prefer not to say" className="text-black">Prefer not to say</option>
                </select>
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <span style={{width: "0", height: "0", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid white",display: "inline-block",}}></span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========== JOB DETAILS — EXACT SAME FORMAT AS SCREENSHOT ========== */}
        <div className="w-full mb-6">
          <h2 className="text-white text-[13px] font-semibold mb-3 uppercase tracking-wider opacity-90">Job Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">

            {/* Employee ID */}
            <div className="relative">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">
                Employee ID *
              </span>
              <input
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                placeholder="Enter ID"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px] placeholder:text-[#C3CADF]"/>
            </div>

            {/* Department */}
            <div className="relative">
              <span className="absolute top-[10px] left-3 text-[11px] text-[#D0D9E8]">
                Department
              </span>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white appearance-none pr-10"
              >
                <option value="" disabled hidden></option>
                <option className="text-black">Engineering</option>
                <option className="text-black">Marketing</option>
                <option className="text-black">Finance</option>
                <option className="text-black">Sales</option>
                <option className="text-black">HR</option>
                <option className="text-black">IT</option>
              </select>
               <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <span style={{width: "0", height: "0", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid white",display: "inline-block",}}></span>
               </span>
            </div>

            {/* Designation */}
            <div className="relative">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">
                Designation *
              </span>
              <input
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                placeholder="Enter Designation"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px] placeholder:text-[#C3CADF]"/>
            </div>

            {/* Reporting Manager */}
            <div className="relative">
              <span className="absolute top-[10px] left-4 text-[11px] text-[#D0D9E8]">
                Reporting Manager
              </span>
              <select
                name="reportingManager"
                value={formData.reportingManager}
                onChange={handleInputChange}
                className="w-full h-[48px] bg-transparent border border-[#6A94D4]
                rounded-md px-3 pt-5 text-white appearance-none"
              >
                <option value="" disabled hidden></option>
                <option className="text-black">John Doe</option>
                <option className="text-black">Jane Smith</option>
                <option className="text-black">Rahul Patil</option>
                <option className="text-black">Sneha Shah</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <span style={{width: "0", height: "0", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid white",display: "inline-block",}}></span>
               </span>
            </div>

            {/* Employment Type */}
            <div className="relative">
              <span className="absolute top-[10px] left-3 text-[11px] text-[#D0D9E8]">
                Employment Type
              </span>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleInputChange}
                className="w-full h-[48px] bg-transparent border border-[#6A94D4]
                rounded-md px-3 pt-5 text-white appearance-none"
              >
                <option value="" disabled hidden></option>
                <option className="text-black">Full Time</option>
                <option className="text-black">Part Time</option>
                <option className="text-black">Contract</option>
                <option className="text-black">Internship</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <span style={{width: "0", height: "0", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid white",display: "inline-block",}}></span>
               </span>
            </div>

            {/* Date of Joining */}
            <div className="relative">
              <span className="absolute top-[10px] left-3 text-[11px] text-[#D0D9E8]">
                Date of Joining
              </span>
              <input
                type="date"
                name="dateOfJoining"
                value={formData.dateOfJoining}
                onChange={handleInputChange}
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white placeholder-transparent [&::-webkit-datetime-edit]:text-transparent [&:focus::-webkit-datetime-edit]:text-white"
              />
            </div>

          </div>

          {/* ===== ROW 2 → ONLY WORK LOCATION ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <span className="absolute top-[10px] left-3 text-[11px] text-[#D0D9E8]">
                Work Location
              </span>
              <select
                name="workLocation"
                value={formData.workLocation}
                onChange={handleInputChange}
                className="w-full h-[48px] bg-transparent border border-[#6A94D4]
                rounded-md px-3 pt-5 text-white appearance-none"
              >
                <option value="" disabled hidden></option>
                <option className="text-black">Office</option>
                <option className="text-black">Remote</option>
                <option className="text-black">Hybrid</option>
                <option className="text-black">Client Site</option>
              </select>
               <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <span style={{width: "0", height: "0", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid white",display: "inline-block",}}></span>
               </span>
            </div>
          </div>
        </div>        {/* ========== PRIMARY ADDRESS ========== */}
        <div className="mb-6">
          <h2 className="text-white text-[13px] font-semibold mb-3 uppercase tracking-wider opacity-90">Primary Address</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">

            {/* Address Line */}
            <div className="relative lg:col-span-2">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">
                Address Line
              </span>
              <input
                name="addressLine"
                value={formData.addressLine}
                onChange={handleInputChange}
                placeholder="Enter address"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px]"
              />
            </div>

            {/* City */}
            <div className="relative">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">City</span>
              <input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Enter city"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px]"
              />
            </div>

            {/* State */}
            <div className="relative">
              <span className="absolute top-[10px] left-3 text-[11px] text-[#D0D9E8]">State</span>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white appearance-none"
              >
                <option value="" disabled hidden></option>
                <option className="text-black">Andhra Pradesh</option>
                <option className="text-black">Arunachal Pradesh</option>
                <option className="text-black">Assam</option>
                <option className="text-black">Bihar</option>
                <option className="text-black">Chhattisgarh</option>
                <option className="text-black">Goa</option>
                <option className="text-black">Gujarat</option>
                <option className="text-black">Haryana</option>
                <option className="text-black">Himachal Pradesh</option>
                <option className="text-black">Jharkhand</option>
                <option className="text-black">Karnataka</option>
                <option className="text-black">Kerala</option>
                <option className="text-black">Madhya Pradesh</option>
                <option className="text-black">Maharashtra</option>
                <option className="text-black">Manipur</option>
                <option className="text-black">Meghalaya</option>
                <option className="text-black">Mizoram</option>
                <option className="text-black">Nagaland</option>
                <option className="text-black">Odisha</option>
                <option className="text-black">Punjab</option>
                <option className="text-black">Rajasthan</option>
                <option className="text-black">Sikkim</option>
                <option className="text-black">Tamil Nadu</option>
                <option className="text-black">Telangana</option>
                <option className="text-black">Tripura</option>
                <option className="text-black">Uttar Pradesh</option>
                <option className="text-black">Uttarakhand</option>
                <option className="text-black">West Bengal</option>
                <option className="text-black">Andaman and Nicobar Islands</option>
                <option className="text-black">Chandigarh</option>
                <option className="text-black">Dadra and Nagar Haveli and Daman and Diu</option>
                <option className="text-black">Delhi</option>
                <option className="text-black">Jammu and Kashmir</option>
                <option className="text-black">Ladakh</option>
                <option className="text-black">Lakshadweep</option>
                <option className="text-black">Puducherry</option>
              </select>
               <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <span style={{width: "0", height: "0", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid white",display: "inline-block",}}></span>
               </span>
            </div>

            {/* Pincode */}
            <div className="relative">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">Pincode</span>
              <input
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="Enter pincode"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px]"
              />
            </div>

            {/* Country */}
            <div className="relative">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">Country</span>
              <input
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Enter country"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px]"
              />
            </div>

          </div>
        </div>

        {/* ========== PORTAL ACCESS SETUP ========== */}
        <div className="mb-6">
          <h2 className="text-white text-[13px] font-semibold mb-3 uppercase tracking-wider opacity-90">Portal Access Setup</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">Office Email Address *</span>
              <input
                name="officeEmail"
                value={formData.officeEmail}
                onChange={handleInputChange}
                type="email"
                placeholder="Enter office email"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px]"
              />
            </div>

            <div className="relative">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">Temporary Password</span>
              <input
                name="temporaryPassword"
                value={formData.temporaryPassword}
                onChange={handleInputChange}
                type="password"
                placeholder="Enter Password"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px]"
              />
            </div>

            <div className="relative">
              <span className="absolute top-[15px] left-3 text-[11px] text-[#D0D9E8]">Role Level</span>
              <select
                name="roleLevel"
                value={formData.roleLevel}
                onChange={handleInputChange}
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white"
              >
                <option value="" disabled hidden></option>
                <option value="Admin" className="text-black">Admin</option>
                <option value="Manager" className="text-black">Manager</option>
                <option value="Team Lead" className="text-black">Team Lead</option>
                <option value="Employee" className="text-black">Employee</option>
                <option value="HR" className="text-black">HR</option>
                <option value="Finance" className="text-black">Finance</option>
                <option value="IT" className="text-black">IT</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========== BANKING ========== */}
        <div className="mb-8">
          <h2 className="text-white text-[13px] font-semibold mb-3 uppercase tracking-wider opacity-90">Banking</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">Basic Salary *</span>
              <input
                name="basicSalary"
                value={formData.basicSalary}
                onChange={handleInputChange}
                placeholder="Enter Salary"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px]"
              />
            </div>

            <div className="relative">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">Account Number *</span>
              <input
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleInputChange}
                placeholder="Enter Account Number"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px]"
              />
            </div>

            <div className="relative">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">Bank Name *</span>
              <input
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="Enter Bank Name"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px]"
              />
            </div>

            <div className="relative">
              <span className="absolute top-[6px] left-3 text-[11px] text-[#D0D9E8]">IFSC Code *</span>
              <input
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
                placeholder="Enter IFSC Code"
                className="w-full h-[48px] bg-transparent border border-[#6A94D4] rounded-md px-3 pt-5 text-white text-[13px]"
              />
            </div>
          </div>
        </div>

        {/* ========== MANDATORY DOCUMENTS ========== */}
        <div className="mb-10">
          <h2 className="text-white text-[13px] font-semibold mb-3 uppercase tracking-wider opacity-90">Mandatory Documents</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <span className="text-white text-[12px] font-medium block mb-2 opacity-80">Aadhaar Card *</span>
              <label className="bg-white hover:bg-slate-50 transition-colors w-full text-black text-[13px] font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10">
                <Upload size={16} />
                <span>Upload Aadhaar</span>
                <input type="file" className="hidden" onChange={(e) => handleFileUpload('aadhaar', e)} />
              </label>
              {uploadedFiles.aadhaar && <p className="text-emerald-400 text-[10px] font-bold mt-2 flex items-center gap-1.5"><CheckCircle2 size={12}/> {uploadedFiles.aadhaar}</p>}
            </div>

            <div>
              <span className="text-white text-[12px] font-medium block mb-2 opacity-80">PAN Card *</span>
              <label className="bg-white hover:bg-slate-50 transition-colors w-full text-black text-[13px] font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10">
                <Upload size={16} />
                <span>Upload PAN</span>
                <input type="file" className="hidden" onChange={(e) => handleFileUpload('pan', e)} />
              </label>
              {uploadedFiles.pan && <p className="text-emerald-400 text-[10px] font-bold mt-2 flex items-center gap-1.5"><CheckCircle2 size={12}/> {uploadedFiles.pan}</p>}
            </div>

            <div>
              <span className="text-white text-[12px] font-medium block mb-2 opacity-80">Offer Letter *</span>
              <label className="bg-white hover:bg-slate-50 transition-colors w-full text-black text-[13px] font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10">
                <Upload size={16} />
                <span>Upload Letter</span>
                <input type="file" className="hidden" onChange={(e) => handleFileUpload('offerLetter', e)} />
              </label>
              {uploadedFiles.offerLetter && <p className="text-emerald-400 text-[10px] font-bold mt-2 flex items-center gap-1.5"><CheckCircle2 size={12}/> {uploadedFiles.offerLetter}</p>}
            </div>

            <div>
              <span className="text-white text-[12px] font-medium block mb-2 opacity-80">Resume *</span>
              <label className="bg-white hover:bg-slate-50 transition-colors w-full text-black text-[13px] font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10">
                <Upload size={16} />
                <span>Upload Resume</span>
                <input type="file" className="hidden" onChange={(e) => handleFileUpload('resume', e)} />
              </label>
              {uploadedFiles.resume && <p className="text-emerald-400 text-[10px] font-bold mt-2 flex items-center gap-1.5"><CheckCircle2 size={12}/> {uploadedFiles.resume}</p>}
            </div>
          </div>
        </div>

        {/* ========== BUTTONS ========== */}
        <div className="flex justify-end gap-2 mt-1">
          <button onClick={() => window.history.back()} className="bg-white text-black px-4 py-2 rounded-md border border-gray-300">Cancel</button>
          <button onClick={handleSubmit} className="bg-black text-white px-6 py-2.5 rounded-lg">Done</button>
        </div>

      </div>
    </div>
  );
}