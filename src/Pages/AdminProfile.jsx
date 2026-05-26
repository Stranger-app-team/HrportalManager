import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { FaEye, FaEyeSlash, FaCamera } from "react-icons/fa";
import { getFullUrl } from "../utils/urlHelper";

export default function AdminProfile() {
    const location = useLocation();

    const [isEditing, setIsEditing] = useState(false);
    const [showOtpPopup, setShowOtpPopup] = useState(false);
    const [otp, setOtp] = useState("");
    const [emailVerified, setEmailVerified] = useState(false);

    const [activeTab, setActiveTab] = useState(location.state?.activeTab || "profile");
    const [passwords, setPasswords] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });

    const [userId, setUserId] = useState("");
    const [profileId, setProfileId] = useState("");
    const [userRole, setUserRole] = useState("");

    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        dob: "",
        email: "",
        phone: "",
        location: "",
        bio: "",
        specialization: "",
        department: "",
        teamSize: 0,
        hrCode: ""
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const storedUser = JSON.parse(localStorage.getItem("user"));
                if (!storedUser || !token) return;

                let endpoint = "";
                if (storedUser.userType === "hr") endpoint = "/hr/profile";
                else if (storedUser.userType === "manager") endpoint = "/manager/profile";
                else if (storedUser.userType === "accounts") endpoint = "/employee/profile";
                else {
                    // Fallback to localStorage for admin or others
                    const username = localStorage.getItem("username");
                    const email = localStorage.getItem("email");
                    if (username) {
                        const [firstName, lastName] = username.split(" ");
                        setProfile(prev => ({
                            ...prev,
                            firstName: firstName || "",
                            lastName: lastName || "",
                            email: email || ""
                        }));
                    }
                    return;
                }

                console.log(`[${storedUser.userType.toUpperCase()} PORTAL] FETCHING PROFILE FROM ENDPOINT:`, endpoint);
                const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                console.log(`[${storedUser.userType.toUpperCase()} PORTAL] USER PROFILE RESPONSE (PROFILE PAGE):`, data);

                if (data.success) {
                    const profileData = data.data;
                    const userData = profileData.userId || profileData.user;
                    const name = userData?.name || "";
                    const [firstName, lastName] = name.split(" ");
                    
                    setUserId(userData?._id || "");
                    setProfileId(profileData._id || "");
                    setUserRole(storedUser.userType);

                    setProfile({
                        firstName: firstName || "",
                        lastName: lastName || "",
                        email: userData?.email || "",
                        phone: profileData.phone || "",
                        location: typeof profileData.location === 'object' && profileData.location ? 
                            [profileData.location.city, profileData.location.addressLine].filter(Boolean).join(", ") : 
                            (profileData.location || ""),
                        bio: profileData.bio || "",
                        dob: profileData.dob ? profileData.dob.split("T")[0] : "",
                        specialization: profileData.specialization || "",
                        department: profileData.department || "",
                        teamSize: profileData.teamSize || 0,
                        hrCode: profileData.hrCode || ""
                    });

                    if (profileData.profilePhoto) {
                        setProfilePhoto(getFullUrl(profileData.profilePhoto, API_BASE_URL));
                    }
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = ({ target: { name, value } }) =>
        setProfile(prev => ({ ...prev, [name]: value }));

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePhotoFile(file);
            setRemovePhoto(false);
            const reader = new FileReader();
            reader.onloadend = () => setProfilePhoto(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setProfilePhoto(null);
        setProfilePhotoFile(null);
        setRemovePhoto(true);
    };


    const Input = ({ label, name, type = "text", placeholder }) => (
        <div>
            <label className="text-xs text-gray-500">{label}</label>

            <input
                type={type}
                name={name}
                value={profile[name] || ""}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm mt-1 bg-gray-50"
            />
        </div>
    );

    const initials =
        (profile.firstName?.[0] || "") +
        (profile.lastName?.[0] || "");


    const sendOTP = async () => {

        try {

            const res = await fetch(`${API_BASE_URL}/email/send-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: profile.email
                })
            });

            const data = await res.json();

            if (data.success) {
                alert("OTP sent to email");
                setShowOtpPopup(true);
            } else {
                alert(data.message);
            }

        } catch (error) {
            console.error(error);
        }

    };


    const verifyOTP = async () => {

        try {

            const res = await fetch(`${API_BASE_URL}/email/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: profile.email,
                    otp: otp
                })
            });

            const data = await res.json();

            if (data.success) {
                alert("Email verified");
                setEmailVerified(true);
                setShowOtpPopup(false);
            } else {
                alert(data.message);
            }

        } catch (error) {
            console.error(error);
        }

    };

    const handleProfileUpdate = async (e) => {
        if (e) e.preventDefault();
        
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            // 1. Update Basic User Info (Identity)
            const userRes = await fetch(`${API_BASE_URL}/user/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: `${profile.firstName} ${profile.lastName}`,
                    email: profile.email
                })
            });

            const userDataResponse = await userRes.json();
            if (!userRes.ok) {
                alert(userDataResponse.message || "Failed to update basic user info");
                return;
            }

            // 2. Update Role-Specific Profile
            let endpoint = "";
            let formData = new FormData();

            if (userRole === "hr") {
                endpoint = `/hr/${profileId}`;
                formData.append("specialization", profile.specialization);
                formData.append("hrCode", profile.hrCode);
                formData.append("phone", profile.phone);
                formData.append("location", profile.location);
                formData.append("bio", profile.bio);
                formData.append("dob", profile.dob);
            } else if (userRole === "manager") {
                endpoint = `/manager/${profileId}`;
                formData.append("department", profile.department);
                formData.append("teamSize", profile.teamSize);
                formData.append("phone", profile.phone);
                formData.append("location", profile.location);
                formData.append("bio", profile.bio);
                formData.append("dob", profile.dob);
            }

            if (profilePhotoFile) {
                formData.append("profilePhoto", profilePhotoFile);
            } else if (removePhoto) {
                formData.append("profilePhoto", "");
            }

            if (endpoint) {
                const roleRes = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formData
                });

                const roleDataResponse = await roleRes.json();
                if (!roleRes.ok) {
                    alert(roleDataResponse.message || `Failed to update ${userRole} profile`);
                    return;
                }
            }

            alert("Profile updated successfully!");
            setIsEditing(false);
            
            // Sync localStorage name/email if they changed
            localStorage.setItem("username", `${profile.firstName} ${profile.lastName}`);
            localStorage.setItem("email", profile.email);
            
            // Refresh layout state if needed
            window.dispatchEvent(new Event("storage"));

        } catch (error) {
            console.error("Error updating profile:", error);
            alert("An error occurred during update.");
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            alert("New passwords do not match!");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: passwords.oldPassword,
                    newPassword: passwords.newPassword
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Password changed successfully!");
                setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                alert(data.message || "Failed to change password");
            }
        } catch (error) {
            console.error("Error changing password:", error);
            alert("An error occurred. Please try again.");
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-100 p-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 mb-4">
        </div>

            {/* TABS */}
            <div className="flex gap-5 border-b border-gray-200 mb-4 text-sm">
                <button 
                    onClick={() => setActiveTab("profile")}
                    className={`pb-2 ${activeTab === "profile" ? "border-b-2 border-blue-500 text-blue-600 font-medium" : "text-gray-500"}`}
                >
                    Profile
                </button>
                <button 
                    onClick={() => setActiveTab("security")}
                    className={`pb-2 flex items-center gap-1 ${activeTab === "security" ? "border-b-2 border-blue-500 text-blue-600 font-medium" : "text-gray-500"}`}
                >
                    🔒 Security
                </button>
            </div>

            {/* CONTENT */}
            {activeTab === "profile" ? (
                <div className="bg-white rounded-md border border-gray-200 shadow-sm p-4">

                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="w-16 h-16 rounded-full border-2 border-purple-100 flex-shrink-0 flex items-center justify-center font-bold text-lg bg-gray-50 overflow-hidden shadow-sm transition-all duration-300 group-hover:border-purple-300">
                                    {profilePhoto ? (
                                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-purple-400">{initials}</span>
                                    )}
                                </div>
                                
                                {isEditing && (
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[1px]">
                                        <FaCamera className="text-white text-lg drop-shadow-md" />
                                        <input type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
                                    </label>
                                )}
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-gray-800 leading-tight">
                                    {profile.firstName} {profile.lastName}
                                </h2>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                                    {userRole} Account
                                </p>
                                {isEditing && profilePhoto && (
                                    <button
                                        onClick={handleRemovePhoto}
                                        className="text-[10px] text-rose-500 font-bold uppercase tracking-tight mt-2 hover:underline"
                                    >
                                        Remove Photo
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="w-full sm:w-auto border border-gray-300 px-4 py-1.5 rounded-md text-xs font-semibold hover:bg-gray-50 transition-colors"
                        >
                            {isEditing ? "Cancel" : "Edit Profile"}
                        </button>

                    </div>

                    {/* PERSONAL INFO */}
                    <h3 className="text-xs font-semibold text-gray-600 mb-3">
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <Input label="First Name" name="firstName" />
                        <Input label="Last Name" name="lastName" />

                        <Input label="Date of Birth" name="dob" type="date" />

                        {/* EMAIL */}
                        <div className="relative">

                            <Input label="Email Address" name="email" type="email" />

                            {emailVerified ? (
                                <span className="absolute right-2 top-6 bg-blue-100 text-blue-600 text-[10px] px-2 py-[2px] rounded">
                                    Verified
                                </span>
                            ) : (
                                <button
                                    onClick={sendOTP}
                                    className="absolute right-2 top-6 bg-orange-500 text-white text-[10px] px-2 py-[2px] rounded"
                                >
                                    Verify
                                </button>
                            )}

                        </div>

                        {/* PHONE */}
                        <div>
                            <label className="text-xs text-gray-500">
                                Phone Number
                            </label>

                            <div className="flex mt-1">
                                <span className="border border-gray-200 border-r-0 px-2 py-1.5 bg-gray-100 text-xs rounded-l-md">
                                    +91
                                </span>

                                <input
                                    type="text"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="border border-gray-200 rounded-r-md px-2.5 py-1.5 text-sm w-full bg-gray-50"
                                />
                            </div>
                        </div>

                        <Input
                            label="Location"
                            name="location"
                            placeholder="City, Country"
                        />

                    </div>

                    {/* BIO */}
                    {/* <div className="mt-4">

                        <label className="text-xs text-gray-500">Bio</label>

                        <textarea
                            name="bio"
                            value={profile.bio}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="Tell us a little about yourself."
                            className="w-full border border-gray-200 rounded-md p-2 text-sm mt-1 h-20 bg-gray-50"
                        />

                        <div className="text-right text-[10px] text-gray-400 mt-1">
                            {profile.bio.length}/300
                        </div>

                    </div> */}

                    {/* PROFESSIONAL INFO */}
                    {/* <div className="mt-6 pt-6 border-t border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-600 mb-3">
                            Professional Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {userRole === "hr" && (
                                <>
                                    <Input label="HR Code" name="hrCode" placeholder="e.g. HR001" />
                                    <div>
                                        <label className="text-xs text-gray-500">Specialization</label>
                                        <select
                                            name="specialization"
                                            value={profile.specialization}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm mt-1 bg-gray-50"
                                        >
                                            <option value="">Select Specialization</option>
                                            <option value="recruitment">Recruitment</option>
                                            <option value="payroll">Payroll</option>
                                            <option value="generalist">Generalist</option>
                                            <option value="operations">Operations</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            {userRole === "manager" && (
                                <>
                                    <Input label="Department ID" name="department" placeholder="Enter Department ID" />
                                    <Input label="Team Size" name="teamSize" type="number" />
                                </>
                            )}
                        </div>
                    </div> */}

                    {/* SAVE BUTTON */}
                    {isEditing && (
                        <button 
                            onClick={handleProfileUpdate}
                            className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-md shadow-orange-500/20 transition-all active:scale-95"
                        >
                            Save Changes
                        </button>
                    )}

                    {/* OTP POPUP */}
                    {showOtpPopup && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg w-80 shadow-lg">
                                <h2 className="text-lg font-semibold mb-4">
                                    Enter OTP
                                </h2>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="border w-full p-2 rounded mb-4"
                                    placeholder="Enter OTP"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowOtpPopup(false)}
                                        className="px-3 py-1 border rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={verifyOTP}
                                        className="px-3 py-1 bg-orange-500 text-white rounded"
                                    >
                                        Verify
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6 max-w-md">
                    <h2 className="text-base font-semibold text-gray-700 mb-4">Change Password</h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.old ? "text" : "password"}
                                    required
                                    value={passwords.oldPassword}
                                    onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.old ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? "text" : "password"}
                                    required
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.new ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    required
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.confirm ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Update Password
                        </button>
                    </form>
                </div>
            )}

        </div>
    );
}