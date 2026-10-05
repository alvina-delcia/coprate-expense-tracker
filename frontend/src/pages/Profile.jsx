import React, { useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const roleLabel = {
  employee: "Employee",
  manager: "Manager",
  admin: "Administrator",
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    department: user?.department || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put("/auth/profile", profileForm);
      updateUser(res.data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setSavingPw(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Profile</h1>
        <p className="text-sm text-ink-400 mt-0.5">
          Manage your account details and security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1 text-center">
          <div className="h-20 w-20 rounded-full bg-brand-500 text-navy-700 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <p className="font-semibold text-ink-900">{user?.name}</p>
          <p className="text-sm text-ink-300">{user?.email}</p>
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-brand-500/12 text-brand-400 text-xs font-medium">
            {roleLabel[user?.role] || user?.role}
          </span>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-sm font-semibold text-ink-900 mb-4">
              Account Details
            </h2>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <input
                  className="input-field"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Email address</label>
                <input
                  className="input-field bg-surface2 text-ink-300"
                  value={user?.email || ""}
                  disabled
                />
              </div>
              <div>
                <label className="label">Department</label>
                <input
                  className="input-field"
                  value={profileForm.department}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, department: e.target.value })
                  }
                />
              </div>
              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-ink-900 mb-4">
              Change Password
            </h2>
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="label">Current password</label>
                <input
                  type="password"
                  className="input-field"
                  value={pwForm.currentPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, currentPassword: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">New password</label>
                  <input
                    type="password"
                    className="input-field"
                    value={pwForm.newPassword}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, newPassword: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">Confirm new password</label>
                  <input
                    type="password"
                    className="input-field"
                    value={pwForm.confirmPassword}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, confirmPassword: e.target.value })
                    }
                  />
                </div>
              </div>
              <button type="submit" disabled={savingPw} className="btn-primary">
                {savingPw ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
