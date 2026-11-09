import { useEffect, useState } from "react";
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

function Reports() {
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const [report, setReport] = useState(null);
  const [readings, setReadings] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      setReport(null);
      setReadings([]);

      let endpoint = "";

      if (reportType === "daily") {
        endpoint = "/reports/daily";
      } else if (reportType === "month-to-date") {
        endpoint = "/reports/month-to-date";
      } else {
        endpoint = "/reports/previous-month";
      }

      const response = await API.get(endpoint, {
        params: reportType === "previous-month" ? {} : { date: selectedDate },
      });

      setReport(response.data.report);
      setReadings(response.data.readings || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to generate report. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDate]);

  const chartData = [...readings].map((reading) => ({
    date: formatDate(reading.date),
    glucose: reading.value,
    timeSlot: formatTimeSlot(reading.timeSlot),
  }));

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h1 className="text-3xl font-bold text-green-600">Glucose Reports</h1>

          <p className="text-gray-600 mt-2">
            Analyze your blood glucose readings and track your progress.
          </p>
        </div>

        {/* Report Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-5">Select Report Type</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setReportType("daily")}
              className={`p-3 rounded-lg border font-medium ${
                reportType === "daily"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Daily Report
            </button>

            <button
              onClick={() => setReportType("month-to-date")}
              className={`p-3 rounded-lg border font-medium ${
                reportType === "month-to-date"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Month-to-Date
            </button>

            <button
              onClick={() => setReportType("previous-month")}
              className={`p-3 rounded-lg border font-medium ${
                reportType === "previous-month"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Previous Month
            </button>
          </div>

          {reportType !== "previous-month" && (
            <div className="mt-5">
              <label className="block font-medium mb-2">Select Date</label>

              <input
                type="date"
                value={selectedDate}
                max={getTodayDate()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border rounded-lg p-3 outline-none focus:border-green-500"
              />
            </div>
          )}

          {reportType === "previous-month" && (
            <p className="text-gray-500 mt-5">
              Showing readings from the previous calendar month.
            </p>
          )}

          <button
            onClick={fetchReport}
            disabled={loading}
            className="mt-5 w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Generating Report..." : "Generate Report"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white p-8 rounded-xl text-center shadow-sm mb-6">
            <p className="text-gray-500">Generating your glucose report...</p>
          </div>
        )}

        {/* Report Results */}
        {!loading && report && (
          <>
            {/* Report Period */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
              <h2 className="text-xl font-bold mb-2">
                {reportType === "daily"
                  ? "Daily Glucose Report"
                  : reportType === "month-to-date"
                    ? "Month-to-Date Report"
                    : "Previous Month Report"}
              </h2>

              <p className="text-gray-500">
                {reportType === "daily"
                  ? formatDate(report.date)
                  : `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`}
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-5 rounded-xl shadow-sm">
                <p className="text-gray-500 text-sm">Total Readings</p>
                <h2 className="text-2xl font-bold text-green-600 mt-2">
                  {report.count}
                </h2>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm">
                <p className="text-gray-500 text-sm">Average Glucose</p>
                <h2 className="text-2xl font-bold text-blue-600 mt-2">
                  {report.average ?? "--"}
                  {report.average !== null ? " mg/dL" : ""}
                </h2>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm">
                <p className="text-gray-500 text-sm">Highest Reading</p>
                <h2 className="text-2xl font-bold text-red-500 mt-2">
                  {report.highest ?? "--"}
                  {report.highest !== null ? " mg/dL" : ""}
                </h2>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm">
                <p className="text-gray-500 text-sm">Lowest Reading</p>
                <h2 className="text-2xl font-bold text-purple-600 mt-2">
                  {report.lowest ?? "--"}
                  {report.lowest !== null ? " mg/dL" : ""}
                </h2>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
              <h2 className="text-xl font-bold mb-6">Glucose Trend Analysis</h2>

              {chartData.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No readings available to display the chart.
                </p>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 10,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis dataKey="date" />

                      <YAxis />

                      <Tooltip
                        formatter={(value) => [`${value} mg/dL`, "Glucose"]}
                        labelFormatter={(label, payload) =>
                          payload?.[0]?.payload?.timeSlot
                            ? `${label} - ${payload[0].payload.timeSlot}`
                            : label
                        }
                      />

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

            {/* Reading History */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold mb-6">Report Reading History</h2>

              {readings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No readings found for this report period.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="p-3 border-b">Date</th>
                        <th className="p-3 border-b">Time Slot</th>
                        <th className="p-3 border-b">Glucose Value</th>
                        <th className="p-3 border-b">Unit</th>
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
          </>
        )}
      </div>
    </div>
  );
}

export default Reports;
