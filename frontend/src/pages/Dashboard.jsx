import { useState, useEffect } from "react";
import API from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const formatTimeSlot = (slot) => {
  const slots = {
    MORNING: "Morning (Fasting)",
    AFTER_BREAKFAST: "After Breakfast",
    AFTER_LUNCH: "After Lunch",
    AFTER_DINNER: "After Dinner",
  };

  return slots[slot] || slot;
};

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    date: getTodayDate(),
    timeSlot: "",
    value: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reading history states
  const [readings, setReadings] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editData, setEditData] = useState({
    date: "",
    timeSlot: "",
    value: "",
  });

  // Dashboard Statistics
  const totalReadings = readings.length;

  const averageGlucose =
    totalReadings > 0
      ? Math.round(
          readings.reduce((total, reading) => total + reading.value, 0) /
            totalReadings,
        )
      : 0;

  const todayReadings = readings.filter(
    (reading) =>
      formatDate(reading.date) ===
      new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
  ).length;

  const latestReading = readings.length > 0 ? readings[0].value : "--";

  // Fetch all readings
  const fetchReadings = async () => {
    try {
      setFetchLoading(true);
      setFetchError("");

      const response = await API.get("/readings");

      setReadings(response.data.readings || []);
    } catch (error) {
      setFetchError(
        error.response?.data?.message ||
          "Unable to fetch readings. Please try again.",
      );
    } finally {
      setFetchLoading(false);
    }
  };

  // Fetch readings when dashboard loads
  useEffect(() => {
    fetchReadings();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/readings", {
        ...formData,
        value: Number(formData.value),
      });

      setMessage(response.data.message || "Reading added successfully");

      setFormData({
        date: getTodayDate(),
        timeSlot: "",
        value: "",
      });

      // Refresh reading history after successful addition
      await fetchReadings();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to add reading. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reading) => {
    setEditingId(reading.id);

    setEditData({
      date: new Date(reading.date).toISOString().slice(0, 10),
      timeSlot: reading.timeSlot,
      value: String(reading.value),
    });

    setMessage("");
    setError("");
  };

  const handleEditChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setUpdateLoading(true);

    try {
      const response = await API.put(`/readings/${editingId}`, {
        ...editData,
        value: Number(editData.value),
      });

      setMessage(response.data.message || "Reading updated successfully");

      setEditingId(null);

      await fetchReadings();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update reading. Please try again.",
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this reading?",
    );

    if (!confirmDelete) return;

    setMessage("");
    setError("");
    setDeletingId(id);

    try {
      const response = await API.delete(`/readings/${id}`);

      setMessage(response.data.message || "Reading deleted successfully");

      await fetchReadings();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to delete reading. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Glucose Chart Data
  const chartData = [...readings].reverse().map((reading) => ({
    date: formatDate(reading.date),
    glucose: reading.value,
  }));

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Dashboard Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h1 className="text-3xl font-bold text-green-600">
            Sweety Dashboard
          </h1>

          <p className="text-gray-600 mt-2">Welcome, {user.name}!</p>

          <p className="text-gray-500 mt-1">
            Track your blood glucose readings.
          </p>
        </div>

        {/* Blood Glucose Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-6">Blood Glucose Trend</h2>

          {chartData.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No readings available to display the chart.
            </p>
          ) : (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="glucose"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Add Reading Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          {/* Dashboard Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Readings */}
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-gray-500 text-sm">Total Readings</p>
              <h2 className="text-2xl font-bold text-green-600 mt-2">
                {totalReadings}
              </h2>
            </div>

            {/* Average Glucose */}
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-gray-500 text-sm">Average Glucose</p>
              <h2 className="text-2xl font-bold text-blue-600 mt-2">
                {averageGlucose} mg/dL
              </h2>
            </div>

            {/* Today's Readings */}
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-gray-500 text-sm">Today's Readings</p>
              <h2 className="text-2xl font-bold text-purple-600 mt-2">
                {todayReadings}
              </h2>
            </div>

            {/* Latest Reading */}
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-gray-500 text-sm">Latest Reading</p>
              <h2 className="text-2xl font-bold text-orange-600 mt-2">
                {latestReading} {latestReading !== "--" ? "mg/dL" : ""}
              </h2>
            </div>
          </div>
          <h2 className="text-xl font-bold mb-6">Add Blood Glucose Reading</h2>

          {message && (
            <p className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
              {message}
            </p>
          )}

          {error && (
            <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date */}
            <div>
              <label className="block font-medium mb-2">Reading Date</label>

              <input
                type="date"
                name="date"
                value={formData.date}
                max={getTodayDate()}
                onChange={handleChange}
                required
                className="w-full border rounded-lg p-3 outline-none focus:border-green-500"
              />
            </div>

            {/* Time Slot */}
            <div>
              <label className="block font-medium mb-2">Time Slot</label>

              <select
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleChange}
                required
                className="w-full border rounded-lg p-3 outline-none focus:border-green-500"
              >
                <option value="">Select Time Slot</option>
                <option value="MORNING">Morning (Fasting)</option>
                <option value="AFTER_BREAKFAST">After Breakfast</option>
                <option value="AFTER_LUNCH">After Lunch</option>
                <option value="AFTER_DINNER">After Dinner</option>
              </select>
            </div>

            {/* Glucose Value */}
            <div>
              <label className="block font-medium mb-2">
                Blood Glucose Value (mg/dL)
              </label>

              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleChange}
                placeholder="Enter value (40–600)"
                min="40"
                max="600"
                step="1"
                required
                className="w-full border rounded-lg p-3 outline-none focus:border-green-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Saving Reading..." : "Save Reading"}
            </button>
          </form>
        </div>

        {/* Reading History */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Blood Glucose Reading History</h2>

            <button
              onClick={fetchReadings}
              disabled={fetchLoading}
              className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
            >
              {fetchLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {fetchError && (
            <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {fetchError}
            </p>
          )}

          {fetchLoading ? (
            <p className="text-center text-gray-500 py-8">
              Loading readings...
            </p>
          ) : readings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No readings found.</p>
              <p className="text-gray-400 text-sm mt-2">
                Add your first blood glucose reading above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3 border-b">Date</th>
                    <th className="p-3 border-b">Time Slot</th>
                    <th className="p-3 border-b">Glucose Value</th>
                    <th className="p-3 border-b">Unit</th>
                    <th className="p-3 border-b">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {readings.map((reading) => (
                    <tr key={reading.id} className="hover:bg-gray-50">
                      <td className="p-3 border-b">
                        {formatDate(reading.date)}
                      </td>

                      <td className="p-3 border-b">
                        {formatTimeSlot(reading.timeSlot)}
                      </td>

                      <td className="p-3 border-b font-semibold">
                        {reading.value}
                      </td>

                      <td className="p-3 border-b text-gray-500">mg/dL</td>

                      <td className="p-3 border-b">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(reading)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(reading.id)}
                            disabled={deletingId === reading.id}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                          >
                            {deletingId === reading.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-sm text-gray-500 mt-4">
                Total readings: {readings.length}
              </p>
            </div>
          )}
        </div>
        {editingId && (
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <h2 className="text-xl font-bold mb-6">
              Edit Blood Glucose Reading
            </h2>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="block font-medium mb-2">Reading Date</label>

                <input
                  type="date"
                  name="date"
                  value={editData.date}
                  max={getTodayDate()}
                  onChange={handleEditChange}
                  required
                  className="w-full border rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Time Slot</label>

                <select
                  name="timeSlot"
                  value={editData.timeSlot}
                  onChange={handleEditChange}
                  required
                  className="w-full border rounded-lg p-3"
                >
                  <option value="MORNING">Morning (Fasting)</option>
                  <option value="AFTER_BREAKFAST">After Breakfast</option>
                  <option value="AFTER_LUNCH">After Lunch</option>
                  <option value="AFTER_DINNER">After Dinner</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Blood Glucose Value (mg/dL)
                </label>

                <input
                  type="number"
                  name="value"
                  value={editData.value}
                  onChange={handleEditChange}
                  min="40"
                  max="600"
                  step="1"
                  required
                  className="w-full border rounded-lg p-3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {updateLoading ? "Updating..." : "Update Reading"}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
