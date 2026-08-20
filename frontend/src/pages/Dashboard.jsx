import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { leaveAPI } from "../services/api";
import {
  CalendarPlus,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { use } from "react";

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div
      className={`card hover:shadow-md transition-shadow cursor-pointer border-l-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <Icon size={32} className="text-gray-400" />
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

const getBadge = (status) => {
  const map = {
    PENDING: "badge-pending",
    APPROVED: "badge-approved",
    REJECTED: "badge-rejected",
    CANCELLED: "badge-cancelled",
  };
  return <span className={map[status] || "badge-pending"}>{status}</span>;
};

export default function Dashboard() {
  const { user, isManager, isAdmin } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

const fetchLeaves = () => {
  return isAdmin
    ? leaveAPI.getAllLeaves({ page: 0, size: 5 })
    : leaveAPI.getMyLeaves({ page: 0, size: 5 });
};

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;

  setLoading(true);

  fetchLeaves()
    .then((res) => setLeaves(res.data.data?.content || []))
    .finally(() => setLoading(false));
}, [isAdmin]);

  const pending = leaves.filter((l) => l.status === "PENDING").length;
  const approved = leaves.filter((l) => l.status === "APPROVED").length;
  const rejected = leaves.filter((l) => l.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back,{" "}
          {user?.name === "System Admin" ? "Admin" : user?.name?.split(" ")[0]}{" "}
          👋
        </h1>
         <p className="text-gray-500 mt-1">
    {user?.name !== "System Admin" && (
      <>
        {user?.departmentName
          ? `${user.departmentName} Department`
          : "No department assigned"}
        {" · "}
      </>
    )}
    {user?.roles?.join(", ")}
  </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Clock}
          label="Pending Leaves"
          value={pending}
          color="border-yellow-400"
          to="/my-leaves"
        />
        <StatCard
          icon={CheckCircle}
          label="Approved Leaves"
          value={approved}
          color="border-green-400"
          to="/my-leaves"
        />
        <StatCard
          icon={XCircle}
          label="Rejected Leaves"
          value={rejected}
          color="border-red-400"
          to="/my-leaves"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/apply-leave"
          className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
            <CalendarPlus size={22} className="text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Apply for Leave</h3>
            <p className="text-sm text-gray-500">Submit a new leave request</p>
          </div>
        </Link>
        <Link
          to="/my-leaves"
          className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <CalendarDays size={22} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">My Leave History</h3>
            <p className="text-sm text-gray-500">
              View all your leave requests
            </p>
          </div>
        </Link>
      </div>

      {/* Recent leaves */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Leave Requests
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader size={24} className="animate-spin text-primary-600" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <CalendarDays size={40} className="mx-auto mb-2 opacity-40" />
            <p>No leave requests yet</p>
            <Link
              to="/apply-leave"
              className="text-primary-600 text-sm mt-2 inline-block hover:underline"
            >
              Apply for your first leave →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">From</th>
                  <th className="pb-2">To</th>
                  <th className="pb-2">Days</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="py-2.5 font-medium">{l.leaveType}</td>
                    <td className="py-2.5 text-gray-600">{l.startDate}</td>
                    <td className="py-2.5 text-gray-600">{l.endDate}</td>
                    <td className="py-2.5 text-gray-600">{l.totalDays}</td>
                    <td className="py-2.5">{getBadge(l.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
