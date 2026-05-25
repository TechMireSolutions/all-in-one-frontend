import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFileStore } from "../Store/useFileStore";
import { useUserStore } from "../Store/userStore";
import { usePayrollStore } from "../Store/payrollStore";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { File, User, Calendar, Clock, DollarSign, Trash2, Eye, Leaf, Hourglass, Edit, Plus, Download, Loader2 } from "lucide-react";
import logo from "../assets/TMS-LOGO.webp";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// PDF Styles
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: "Helvetica", backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: 1, borderColor: "#e5e7eb", paddingBottom: 10 },
  logo: { width: 60, height: 60 },
  title: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  generated: { fontSize: 10, color: "#9ca3af", textAlign: "right" },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 13, fontWeight: "bold", color: "#111827", marginBottom: 8, borderLeft: 3, borderColor: "#f97316", paddingLeft: 8 },
  table: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" },
  tableRowAlt: { backgroundColor: "#fff" },
  tableCell: { padding: 8, width: "50%", fontSize: 10, color: "#374151" },
  tableCellBold: { padding: 8, width: "50%", fontSize: 10, fontWeight: "bold", color: "#111827" },
  subTable: { borderWidth: 1, borderColor: "#e5e7eb", marginTop: 5, borderRadius: 4 },
  subTableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e5e7eb" },
  subTableCell: { padding: 5, width: "20%", fontSize: 9, textAlign: "center", color: "#374151" },
  subTableCellDate: { padding: 5, width: "80%", fontSize: 9, color: "#374151" },
});

// PDF Document Component
const PayrollSlipPDF = ({ payroll }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image src={logo} style={styles.logo} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.title}>Techmire Solution</Text>
            <Text style={styles.subtitle}>Payroll Slip</Text>
          </View>
        </View>
        <Text style={styles.generated}>
          Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employee Details</Text>
        <View style={styles.table}>
          {[
            { label: "Employee ID", value: payroll.employee_id },
            { label: "Name", value: payroll.full_name },
            { label: "Month", value: payroll.month },
          ].map((item, index) => (
            <View key={item.label} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
              <Text style={styles.tableCellBold}>{item.label}</Text>
              <Text style={styles.tableCell}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payroll Summary</Text>
        <View style={styles.table}>
          {[
            { label: "Total Working Hours", value: `${payroll.total_working_hours} hrs` },
            { label: "Not Allowed Hours", value: `${payroll.not_allowed_hours} hrs` },
            { label: "Official Working Days", value: payroll.official_working_days },
            { label: "Adjusted Working Days", value: payroll.adjusted_working_days },
            { label: "Effective Allowance Days", value: payroll.effective_allowance_days },
            { label: "Hourly Wage", value: `${payroll.hourly_wage} PKR/hr` },
            { label: "Daily Allowance Rate", value: `${payroll.daily_allowance_rate} PKR/day` },
            { label: "Daily Allowance Total", value: `${payroll.daily_allowance_total} PKR` },
            { label: "Official Leaves", value: payroll.official_leaves },
            { label: "Allowed Hours/Day", value: `${payroll.allowed_hours_per_day} hrs` },
            { label: "Hourly Salary", value: `${payroll.hourly_salary} PKR` },
            { label: "Gross Salary", value: `${payroll.gross_salary} PKR` },
            { label: "Late Count", value: payroll.late_count },
            { label: "Absent Count", value: payroll.absent_count },
            { label: "Effective Absent Count", value: payroll.effective_absent_count },
            { label: "Salary Cap", value: `${payroll.Salary_Cap} PKR` },
          ].map((item, index) => (
            <View key={item.label} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
              <Text style={styles.tableCellBold}>{item.label}</Text>
              <Text style={styles.tableCell}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Details</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 20 }}>
          {[
            { title: "Late Dates", data: payroll.late_dates },
            { title: "Absent Dates", data: payroll.absent_dates },
          ].map((section, idx) => (
            <View key={section.title} style={{ width: "48%" }}>
              <Text style={{ fontSize: 11, fontWeight: "bold", marginBottom: 5, color: "#111827" }}>{section.title}</Text>
              {section.data.length > 0 ? (
                <View style={styles.subTable}>
                  <View style={styles.subTableRow}>
                    <Text style={styles.subTableCell}>#</Text>
                    <Text style={styles.subTableCellDate}>Date</Text>
                  </View>
                  {section.data.map((date, index) => (
                    <View key={index} style={styles.subTableRow}>
                      <Text style={styles.subTableCell}>{index + 1}</Text>
                      <Text style={styles.subTableCellDate}>{date}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 9, fontStyle: "italic", color: "#6b7280" }}>No {section.title.toLowerCase()}</Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </Page>
  </Document>
);

const UserList = () => {
  const { fileData, fetchFiles, fetchFileData, deleteFile } = useFileStore();
  const { users, fetchUsers, loading: usersLoading, error: usersError } = useUserStore();
  const { payrollData, fetchPayrolls, createPayrolls, updatePayroll, deletePayroll, deleteAllPayrolls, loading: payrollLoading, error: payrollError } = usePayrollStore();

  const [selectedFileId, setSelectedFileId] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [popupMessage, setPopupMessage] = useState(null);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [isShowPayrollOpen, setIsShowPayrollOpen] = useState(false);
  const [isEditPayrollOpen, setIsEditPayrollOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPayroll, setEditPayroll] = useState(null);
  const [generatedPayrolls, setGeneratedPayrolls] = useState({});
  const [payrollSettings, setPayrollSettings] = useState({
    selectedMonth: null,
    saturdayOffEmployees: [],
    officialLeaves: "",
    allowedHoursPerDay: 8,
  });

  useEffect(() => {
    fetchFiles();
    fetchUsers("employee");
    fetchPayrolls();
  }, [fetchFiles, fetchUsers, fetchPayrolls]);

  const showPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setTimeout(() => setPopupMessage(null), 3000);
  };

  const handleFileChange = async (e) => {
    const fileId = e.target.value;
    if (!fileId) {
      setSelectedFileId(null);
      setTableData([]);
      return;
    }
    setSelectedFileId(fileId);
    setLoading(true);
    const file = fileData.find((f) => f.id === fileId);
    const content = await fetchFileData(fileId);
    setLoading(false);

    if (!content) {
      setError("Failed to load file content.");
      showPopup("Failed to load file content.", "error");
      return;
    }
    const parsedData = parseCSV(content);
    setTableData(parsedData);
    setError("");
  };

  const parseCSV = (csvText) => {
    const rows = csvText.split("\n").filter((row) => row.trim() !== "");
    const data = rows.map((row) => row.split(","));
    return data.length <= 7 ? [] : data.slice(7);
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === "" || timeStr === "0:00") return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const calculateLateEarlyAndAbsent = (sectionData, employeeId) => {
    const standardInTime = timeToMinutes("9:00");
    const lateThreshold = timeToMinutes("9:30");
    const standardOutTime = timeToMinutes("18:00");
    const earlyThreshold = timeToMinutes("17:30");

    let lateCount = 0, earlyCount = 0, absentCount = 0;
    const lateDates = [], earlyDates = [], absentDates = [];

    sectionData.forEach((row) => {
      const date = row[0]?.trim();
      const dayOfWeek = row[1]?.trim();
      const inTime = row[4]?.trim();
      const outTime = row[6]?.trim();

      if (date && date.match(/^\d{2}\/\d{2}\/\d{4}$/) && dayOfWeek) {
        const isSunday = dayOfWeek === "Sun.";
        const isSaturday = dayOfWeek === "Sat.";
        if (isSunday || (isSaturday && payrollSettings.saturdayOffEmployees.includes(employeeId))) return;

        if ((!inTime || inTime === "0:00" || inTime === "") && (!outTime || outTime === "0:00" || outTime === "")) {
          absentCount++;
          absentDates.push(date);
        } else if (inTime && outTime && inTime !== "" && outTime !== "") {
          const inMinutes = timeToMinutes(inTime);
          const outMinutes = timeToMinutes(outTime);
          if (inMinutes > lateThreshold) {
            lateCount++;
            lateDates.push(date);
          }
          if (outMinutes < earlyThreshold) {
            earlyCount++;
            earlyDates.push(date);
          }
        }
      }
    });

    return { lateCount, earlyCount, absentCount, lateDates, earlyDates, absentDates };
  };

  const calculateWorkingDays = (month, saturdayOff = false) => {
    if (!month) return 0;
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const date = new Date(year, monthNum, 1);
    const lastDay = new Date(year, monthNum + 1, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= lastDay; day++) {
      date.setDate(day);
      const isSunday = date.getDay() === 0;
      const isSaturday = date.getDay() === 6;
      if (isSunday || (saturdayOff && isSaturday)) continue;
      workingDays++;
    }
    return workingDays;
  };

  const convertToDecimalHours = (timeStr) => {
    if (!timeStr || timeStr === "0:00") return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + minutes / 60;
  };

  const handleGenerateAllPayrolls = async () => {
    if (!selectedFileId) {
      setError("Please select a file first.");
      showPopup("Please select a file first.", "error");
      return;
    }
    if (!payrollSettings.selectedMonth) {
      setError("Please select a month in the payroll settings.");
      showPopup("Please select a month.", "error");
      return;
    }

    const month = `${payrollSettings.selectedMonth.getFullYear()}-${(payrollSettings.selectedMonth.getMonth() + 1).toString().padStart(2, "0")}`;
    const payrolls = [];
    const issues = [];

    users.forEach((user) => {
      const userIndex = tableData.findIndex((row) => row.length > 1 && row[0].trim() === "User ID" && row[1].trim() === user.employee_id);
      let totalWorkingHours = "0:00", lateCount = 0, earlyCount = 0, absentCount = 0, lateDates = [], earlyDates = [], absentDates = [], sectionData = [];

      if (userIndex !== -1) {
        const nextUserIdIndex = tableData.slice(userIndex + 1).findIndex((row) => row.length > 1 && row[0].trim() === "User ID");
        const endIndex = nextUserIdIndex === -1 ? tableData.length : userIndex + nextUserIdIndex + 1;
        sectionData = tableData.slice(userIndex, endIndex);
        const totalRow = sectionData.find((row) => row[0].trim() === "Total");
        if (totalRow && totalRow[14]) totalWorkingHours = totalRow[14].trim();

        const { lateCount: lc, earlyCount: ec, absentCount: ac, lateDates: ld, earlyDates: ed, absentDates: ad } = calculateLateEarlyAndAbsent(sectionData, user.employee_id);
        lateCount = lc; earlyCount = ec; absentCount = ac; lateDates = ld; earlyDates = ed; absentDates = ad;
      }

      if (!user.Salary_Cap || user.Salary_Cap === "N/A" || !user.in_time || !user.out_time) {
        issues.push(`Payroll not generated for ${user.full_name} (${user.employee_id}): ${!user.Salary_Cap || user.Salary_Cap === "N/A" ? "Salary Cap missing" : ""}${!user.in_time ? ", In Time missing" : ""}${!user.out_time ? ", Out Time missing" : ""}`);
        return;
      }

      const isSaturdayOff = payrollSettings.saturdayOffEmployees.includes(user.employee_id);
      const workingDays = calculateWorkingDays(payrollSettings.selectedMonth, isSaturdayOff);
      const officialLeaves = parseInt(payrollSettings.officialLeaves || 0);
      const allowedHoursPerDay = parseFloat(payrollSettings.allowedHoursPerDay);
      const allowedTotalHours = allowedHoursPerDay * workingDays;

      let totalHoursDecimal = convertToDecimalHours(totalWorkingHours);
      const notAllowedHours = totalHoursDecimal > allowedTotalHours ? totalHoursDecimal - allowedTotalHours : 0;
      totalHoursDecimal = Math.min(totalHoursDecimal, allowedTotalHours);

      const salaryCap = parseFloat(user.Salary_Cap);
      const hourlyWage = salaryCap / (workingDays * allowedHoursPerDay) / 2;
      const dailyAllowanceRate = salaryCap / workingDays / 2;

      const allowedAbsences = 2, allowedLates = 3;
      const effectiveAbsentCount = Math.max(0, absentCount - officialLeaves);
      let adjustedWorkingDays = workingDays - Math.max(0, effectiveAbsentCount - allowedAbsences) + officialLeaves;
      let effectiveAllowanceDays = adjustedWorkingDays - Math.max(0, lateCount - allowedLates);
      effectiveAllowanceDays = Math.max(0, effectiveAllowanceDays);

      const hourlySalary = totalHoursDecimal * hourlyWage;
      const dailyAllowanceTotal = effectiveAllowanceDays * dailyAllowanceRate;
      const grossSalary = Math.min(hourlySalary + dailyAllowanceTotal, salaryCap);

      payrolls.push({
        employee_id: user.employee_id,
        full_name: user.full_name,
        month,
        total_working_hours: parseFloat(totalHoursDecimal.toFixed(2)),
        not_allowed_hours: parseFloat(notAllowedHours.toFixed(2)),
        official_working_days: workingDays,
        adjusted_working_days: adjustedWorkingDays,
        effective_allowance_days: effectiveAllowanceDays,
        hourly_wage: parseFloat(hourlyWage.toFixed(2)),
        daily_allowance_rate: parseFloat(dailyAllowanceRate.toFixed(2)),
        daily_allowance_total: parseFloat(dailyAllowanceTotal.toFixed(2)),
        official_leaves: officialLeaves,
        allowed_hours_per_day: allowedHoursPerDay,
        hourly_salary: parseFloat(hourlySalary.toFixed(2)),
        gross_salary: parseFloat(grossSalary.toFixed(2)),
        late_count: lateCount,
        early_count: earlyCount,
        absent_count: absentCount,
        effective_absent_count: effectiveAbsentCount,
        late_dates: lateDates,
        early_dates: earlyDates,
        absent_dates: absentDates,
        table_section_data: sectionData,
        Salary_Cap: salaryCap,
      });
    });

    if (issues.length > 0) console.log("Payroll Generation Issues:", issues);

    const result = await createPayrolls(payrolls);
    if (result.success) {
      setGeneratedPayrolls(result.data.reduce((acc, p) => ({ ...acc, [p.employee_id]: p }), {}));
      setIsPayrollModalOpen(false);
      showPopup("Payrolls created successfully");
    } else {
      setError(result.message);
      showPopup(result.message, "error");
    }
  };

  const handleGenerateSinglePayroll = async (user) => {
    if (!selectedFileId) {
      setError("Please select a file first.");
      showPopup("Please select a file first.", "error");
      return;
    }
    if (!payrollSettings.selectedMonth) {
      setError("Please select a month in the payroll settings.");
      showPopup("Please select a month.", "error");
      return;
    }

    const month = `${payrollSettings.selectedMonth.getFullYear()}-${(payrollSettings.selectedMonth.getMonth() + 1).toString().padStart(2, "0")}`;
    const userIndex = tableData.findIndex((row) => row.length > 1 && row[0].trim() === "User ID" && row[1].trim() === user.employee_id);
    let totalWorkingHours = "0:00", lateCount = 0, earlyCount = 0, absentCount = 0, lateDates = [], earlyDates = [], absentDates = [], sectionData = [];

    if (userIndex !== -1) {
      const nextUserIdIndex = tableData.slice(userIndex + 1).findIndex((row) => row.length > 1 && row[0].trim() === "User ID");
      const endIndex = nextUserIdIndex === -1 ? tableData.length : userIndex + nextUserIdIndex + 1;
      sectionData = tableData.slice(userIndex, endIndex);
      const totalRow = sectionData.find((row) => row[0].trim() === "Total");
      if (totalRow && totalRow[14]) totalWorkingHours = totalRow[14].trim();

      const { lateCount: lc, earlyCount: ec, absentCount: ac, lateDates: ld, earlyDates: ed, absentDates: ad } = calculateLateEarlyAndAbsent(sectionData, user.employee_id);
      lateCount = lc; earlyCount = ec; absentCount = ac; lateDates = ld; earlyDates = ed; absentDates = ad;
    }

    if (!user.Salary_Cap || user.Salary_Cap === "N/A" || !user.in_time || !user.out_time) {
      setError(`Payroll not generated for ${user.full_name} (${user.employee_id}): ${!user.Salary_Cap || user.Salary_Cap === "N/A" ? "Salary Cap missing" : ""}${!user.in_time ? ", In Time missing" : ""}${!user.out_time ? ", Out Time missing" : ""}`);
      showPopup(`Payroll not generated for ${user.full_name}.`, "error");
      return;
    }

    const isSaturdayOff = payrollSettings.saturdayOffEmployees.includes(user.employee_id);
    const workingDays = calculateWorkingDays(payrollSettings.selectedMonth, isSaturdayOff);
    const officialLeaves = parseInt(payrollSettings.officialLeaves || 0);
    const allowedHoursPerDay = parseFloat(payrollSettings.allowedHoursPerDay);
    const allowedTotalHours = allowedHoursPerDay * workingDays;

    let totalHoursDecimal = convertToDecimalHours(totalWorkingHours);
    const notAllowedHours = totalHoursDecimal > allowedTotalHours ? totalHoursDecimal - allowedTotalHours : 0;
    totalHoursDecimal = Math.min(totalHoursDecimal, allowedTotalHours);

    const salaryCap = parseFloat(user.Salary_Cap);
    const hourlyWage = salaryCap / (workingDays * allowedHoursPerDay) / 2;
    const dailyAllowanceRate = salaryCap / workingDays / 2;

    const allowedAbsences = 2, allowedLates = 3;
    const effectiveAbsentCount = Math.max(0, absentCount - officialLeaves);
    let adjustedWorkingDays = workingDays - Math.max(0, effectiveAbsentCount - allowedAbsences) + officialLeaves;
    let effectiveAllowanceDays = adjustedWorkingDays - Math.max(0, lateCount - allowedLates);
    effectiveAllowanceDays = Math.max(0, effectiveAllowanceDays);

    const hourlySalary = totalHoursDecimal * hourlyWage;
    const dailyAllowanceTotal = effectiveAllowanceDays * dailyAllowanceRate;
    const grossSalary = Math.min(hourlySalary + dailyAllowanceTotal, salaryCap);

    const payrollOutput = {
      employee_id: user.employee_id,
      full_name: user.full_name,
      month,
      total_working_hours: parseFloat(totalHoursDecimal.toFixed(2)),
      not_allowed_hours: parseFloat(notAllowedHours.toFixed(2)),
      official_working_days: workingDays,
      adjusted_working_days: adjustedWorkingDays,
      effective_allowance_days: effectiveAllowanceDays,
      hourly_wage: parseFloat(hourlyWage.toFixed(2)),
      daily_allowance_rate: parseFloat(dailyAllowanceRate.toFixed(2)),
      daily_allowance_total: parseFloat(dailyAllowanceTotal.toFixed(2)),
      official_leaves: officialLeaves,
      allowed_hours_per_day: allowedHoursPerDay,
      hourly_salary: parseFloat(hourlySalary.toFixed(2)),
      gross_salary: parseFloat(grossSalary.toFixed(2)),
      late_count: lateCount,
      early_count: earlyCount,
      absent_count: absentCount,
      effective_absent_count: effectiveAbsentCount,
      late_dates: lateDates,
      early_dates: earlyDates,
      absent_dates: absentDates,
      table_section_data: sectionData,
      Salary_Cap: salaryCap,
    };

    const result = await createPayrolls([payrollOutput]);
    if (result.success) {
      setGeneratedPayrolls((prev) => ({ ...prev, [user.employee_id]: result.data[0] }));
      showPopup(`Payroll generated for ${user.full_name}`);
    } else {
      setError(result.message);
      showPopup(result.message, "error");
    }
  };

  const handleUpdatePayroll = async () => {
    if (!editPayroll || !editPayroll.id) {
      setError("No payroll selected or invalid payroll ID");
      showPopup("Invalid payroll selection.", "error");
      return;
    }

    const {
      total_working_hours,
      official_working_days,
      Salary_Cap,
      allowed_hours_per_day,
      late_count,
      absent_count,
      official_leaves,
      effective_allowance_days,
    } = editPayroll;

    const totalWorkingHours = parseFloat(total_working_hours) || 0;
    const workingDays = parseInt(official_working_days) || 0;
    const salaryCap = parseFloat(Salary_Cap) || 0;
    const allowedHoursPerDay = parseFloat(allowed_hours_per_day) || 8;
    const lateCount = parseInt(late_count) || 0;
    const absentCount = parseInt(absent_count) || 0;
    const officialLeaves = parseInt(official_leaves) || 0;
    const effectiveAllowanceDays = parseInt(effective_allowance_days) || 0;

    const allowedTotalHours = allowedHoursPerDay * workingDays;
    const notAllowedHours = totalWorkingHours > allowedTotalHours ? totalWorkingHours - allowedTotalHours : 0;
    const effectiveTotalHours = Math.min(totalWorkingHours, allowedTotalHours);

    const hourlyWage = totalWorkingHours > 0 ? (salaryCap / totalWorkingHours) / 2 : 0;
    const dailyAllowanceRate = salaryCap / workingDays / 2;
    const dailyAllowanceTotal = effectiveAllowanceDays * dailyAllowanceRate;

    const hourlySalary = effectiveTotalHours * hourlyWage;
    const grossSalary = Math.min(hourlySalary + dailyAllowanceTotal, salaryCap);

    const updatedPayroll = {
      ...editPayroll,
      total_working_hours: parseFloat(totalWorkingHours.toFixed(2)),
      not_allowed_hours: parseFloat(notAllowedHours.toFixed(2)),
      hourly_wage: parseFloat(hourlyWage.toFixed(2)),
      daily_allowance_rate: parseFloat(dailyAllowanceRate.toFixed(2)),
      daily_allowance_total: parseFloat(dailyAllowanceTotal.toFixed(2)),
      hourly_salary: parseFloat(hourlySalary.toFixed(2)),
      gross_salary: parseFloat(grossSalary.toFixed(2)),
    };

    const result = await updatePayroll(editPayroll.id, updatedPayroll);
    if (result.success) {
      setGeneratedPayrolls((prev) => ({
        ...prev,
        [editPayroll.employee_id]: updatedPayroll,
      }));
      setIsEditPayrollOpen(false);
      showPopup("Payroll updated successfully");
    } else {
      setError(result.message);
      showPopup(result.message, "error");
    }
  };

  const handleDeletePayroll = async (id, employeeId) => {
    const result = await deletePayroll(id);
    if (result.success) {
      setGeneratedPayrolls((prev) => {
        const updated = { ...prev };
        delete updated[employeeId];
        return updated;
      });
      showPopup("Payroll deleted successfully");
    } else {
      setError(result.message);
      showPopup(result.message, "error");
    }
  };

  const handleDeleteAllPayrolls = async () => {
    if (window.confirm("Are you sure you want to delete all payrolls?")) {
      const result = await deleteAllPayrolls();
      if (result.success) {
        setGeneratedPayrolls({});
        showPopup("All payrolls deleted successfully");
      } else {
        setError(result.message);
        showPopup(result.message, "error");
      }
    }
  };

  const handleTotalWorkingHoursChange = (e) => {
    const newTotalWorkingHours = parseFloat(e.target.value) || 0;
    const {
      official_working_days,
      Salary_Cap,
      allowed_hours_per_day,
      late_count,
      absent_count,
      official_leaves,
      effective_allowance_days,
    } = editPayroll;

    const workingDays = parseInt(official_working_days) || 0;
    const salaryCap = parseFloat(Salary_Cap) || 0;
    const allowedHoursPerDay = parseFloat(allowed_hours_per_day) || 8;
    const lateCount = parseInt(late_count) || 0;
    const absentCount = parseInt(absent_count) || 0;
    const officialLeaves = parseInt(official_leaves) || 0;
    const effectiveAllowanceDays = parseInt(effective_allowance_days) || 0;

    const allowedTotalHours = allowedHoursPerDay * workingDays;
    const notAllowedHours = newTotalWorkingHours > allowedTotalHours ? newTotalWorkingHours - allowedTotalHours : 0;
    const effectiveTotalHours = Math.min(newTotalWorkingHours, allowedTotalHours);

    const hourlyWage = newTotalWorkingHours > 0 ? (salaryCap / newTotalWorkingHours) / 2 : 0;
    const dailyAllowanceRate = salaryCap / workingDays / 2;
    const dailyAllowanceTotal = effectiveAllowanceDays * dailyAllowanceRate;

    const hourlySalary = effectiveTotalHours * hourlyWage;
    const grossSalary = Math.min(hourlySalary + dailyAllowanceTotal, salaryCap);

    setEditPayroll({
      ...editPayroll,
      total_working_hours: parseFloat(newTotalWorkingHours.toFixed(2)),
      not_allowed_hours: parseFloat(notAllowedHours.toFixed(2)),
      hourly_wage: parseFloat(hourlyWage.toFixed(2)),
      daily_allowance_rate: parseFloat(dailyAllowanceRate.toFixed(2)),
      daily_allowance_total: parseFloat(dailyAllowanceTotal.toFixed(2)),
      hourly_salary: parseFloat(hourlySalary.toFixed(2)),
      gross_salary: parseFloat(grossSalary.toFixed(2)),
    });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95 },
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  const isLoading = usersLoading || payrollLoading || loading;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center p-4 sm:p-6 bg-gray-100">
      <motion.div
        className="max-w-5xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Popup Message */}
        <AnimatePresence>
          {popupMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
                popupMessage.type === "success" ? "bg-green-100 text-green-600" : "bg-red-500 text-white"
              }`}
            >
              {popupMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Selection */}
        <motion.div variants={rowVariants} className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <File size={20} className="text-orange-500" /> Select File
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedFileId || ""}
              onChange={handleFileChange}
              className="flex-1 min-w-[200px] p-3 border rounded-md shadow-sm text-sm focus:ring-2 focus:ring-orange-400"
              aria-label="Select a file"
            >
              <option value="">Select a File</option>
              {fileData.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.filename}
                </option>
              ))}
            </select>
            {selectedFileId && (
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => deleteFile(selectedFileId)}
                className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-orange-700"
                aria-label="Delete selected file"
              >
                <Trash2 size={16} />
                Delete
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Users & Payrolls Table */}
        <motion.div variants={rowVariants}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User size={20} className="text-orange-500" /> Registered Users & Payrolls
          </h2>
          {usersError || payrollError || error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-100 border-l-4 border-red-500 text-red-600 p-3 mb-4 rounded-sm text-sm"
            >
              {usersError || payrollError || error}
            </motion.div>
          ) : null}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin h-8 w-8 text-orange-600" />
              <span className="ml-3 text-sm text-gray-600">Loading data...</span>
            </div>
          ) : users.length === 0 ? (
            <p className="text-gray-600 text-sm text-center p-6">No users found.</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-md shadow-md border">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Emp. ID", "Name", "Position", "Action", "Status"].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => {
                    const payroll = payrollData.find((p) => p.employee_id === user.employee_id) || generatedPayrolls[user.employee_id];
                    return (
                      <motion.tr
                        key={user.id}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{user.employee_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{user.full_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{user.post_applied_for}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm flex gap-2">
                          {payroll ? (
                            <>
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => { setSelectedUser(user); setIsShowPayrollOpen(true); }}
                                className="bg-blue-600 text-white px-3 py-1 rounded-sm text-sm flex items-center gap-2 hover:bg-blue-700"
                                aria-label={`View payroll for ${user.full_name}`}
                              >
                                <Eye size={16} />
                                Show
                              </motion.button>
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => { setEditPayroll(payroll); setIsEditPayrollOpen(true); }}
                                className="bg-yellow-600 text-white px-3 py-1 rounded-sm text-sm flex items-center gap-2 hover:bg-yellow-700"
                                aria-label={`Edit payroll for ${user.full_name}`}
                              >
                                <Edit size={16} />
                                Edit
                              </motion.button>
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => handleDeletePayroll(payroll.id, user.employee_id)}
                                className="bg-red-600 text-white px-3 py-1 rounded-sm text-sm flex items-center gap-2 hover:bg-red-700"
                                aria-label={`Delete payroll for ${user.full_name}`}
                              >
                                <Trash2 size={16} />
                                Delete
                              </motion.button>
                            </>
                          ) : (
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleGenerateSinglePayroll(user)}
                              className="bg-green-600 text-white px-4 py-1 rounded-sm text-sm flex items-center gap-2 hover:bg-green-700"
                              aria-label={`Generate payroll for ${user.full_name}`}
                            >
                              <Plus size={16} />
                              Generate
                            </motion.button>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {payroll ? (
                            <span className="text-green-600 font-semibold">Generated</span>
                          ) : (
                            <span className="text-gray-600">Pending</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex gap-4 flex-wrap">
            <Link
              to="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Back
            </Link>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setIsPayrollModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-2 hover:bg-green-700"
              aria-label="Open payroll generation modal"
            >
              <DollarSign size={16} />
              Payroll Generation
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleDeleteAllPayrolls}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm flex items-center gap-2 hover:bg-red-700"
              aria-label="Delete all payrolls"
            >
              <Trash2 size={16} />
              Delete All Payrolls
            </motion.button>
          </div>
        </motion.div>

        {/* Payroll Generation Modal */}
        <AnimatePresence>
          {isPayrollModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white rounded-md p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
                role="dialog"
                aria-labelledby="modal-title"
              >
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 id="modal-title" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <DollarSign size={20} className="text-green-600" />
                    Generate Payrolls
                  </h3>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setIsPayrollModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 text-lg"
                    aria-label="Close modal"
                  >
                    ✕
                  </motion.button>
                </div>
                <div className="space-y-5">
                  <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
                    <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Calendar size={16} className="text-blue-500" />
                      Select Month
                    </label>
                    <DatePicker
                      id="month-select"
                      selected={payrollSettings.selectedMonth}
                      onChange={(date) => setPayrollSettings((prev) => ({ ...prev, selectedMonth: date }))}
                      dateFormat="MMMM yyyy"
                      showMonthYearPicker
                      className="w-full p-3 border rounded-md text-sm focus:ring-2 focus:ring-orange-400"
                      placeholderText="Select a month"
                      aria-label="Select month for payroll"
                    />
                  </motion.div>
                  <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Clock size={16} className="text-purple-500" />
                      Working Days
                    </label>
                    <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
                      {payrollSettings.selectedMonth
                        ? `Regular: ${calculateWorkingDays(payrollSettings.selectedMonth, false)}, Saturday Off: ${calculateWorkingDays(payrollSettings.selectedMonth, true)}`
                        : "Select a month to see working days"}
                    </p>
                  </motion.div>
                  <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
                    <label htmlFor="saturday-off" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <User size={16} className="text-orange-600" />
                      Saturday Off Employees
                    </label>
                    <select
                      id="saturday-off"
                      multiple
                      value={payrollSettings.saturdayOffEmployees}
                      onChange={(e) =>
                        setPayrollSettings((prev) => ({
                          ...prev,
                          saturdayOffEmployees: Array.from(e.target.selectedOptions, (option) => option.value),
                        }))
                      }
                      className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 h-32"
                      aria-label="Select Saturday off employees"
                    >
                      {users.map((user) => (
                        <option key={user.employee_id} value={user.employee_id}>
                          {user.full_name} ({user.employee_id})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </motion.div>
                  <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
                    <label htmlFor="official-leaves" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Leaf size={16} className="text-green-500" />
                      Official Leaves
                    </label>
                    <input
                      id="official-leaves"
                      type="number"
                      value={payrollSettings.officialLeaves}
                      onChange={(e) => setPayrollSettings((prev) => ({ ...prev, officialLeaves: e.target.value }))}
                      className="w-full p-3 border rounded-md text-sm focus:ring-2 focus:ring-green-600"
                      placeholder="Enter number of official leaves"
                      min="0"
                      aria-label="Enter number of official leaves"
                    />
                  </motion.div>
                  <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }}>
                    <label htmlFor="allowed-hours" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Hourglass size={16} className="text-indigo-500" />
                      Allowed Hours/Day
                    </label>
                    <input
                      id="allowed-hours"
                      type="number"
                      value={payrollSettings.allowedHoursPerDay}
                      onChange={(e) => setPayrollSettings((prev) => ({ ...prev, allowedHoursPerDay: e.target.value }))}
                      className="w-full p-3 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="Default: 8"
                      min="1"
                      max="24"
                      aria-label="Enter allowed hours per day"
                    />
                  </motion.div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setIsPayrollModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                    aria-label="Cancel payroll generation"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleGenerateAllPayrolls}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-2 hover:bg-green-700"
                    aria-label="Generate payrolls"
                  >
                    <DollarSign size={16} />
                    Generate
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Payroll Slip Modal */}
        <AnimatePresence>
          {isShowPayrollOpen && selectedUser && (
            (() => {
              const payroll = payrollData.find((p) => p.employee_id === selectedUser.employee_id) || generatedPayrolls[selectedUser.employee_id];
              return payroll ? (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4 py-6">
                  <motion.div
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-white rounded-md w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto shadow-xl"
                    role="dialog"
                    aria-labelledby="payroll-slip-title"
                  >
                    <div className="flex justify-between items-center mb-6 border-b pb-3">
                      <div className="flex items-center gap-3">
                        <img src={logo} alt="Techmire Solution Logo" className="h-10 w-auto" />
                        <div>
                          <h3 id="payroll-slip-title" className="text-lg font-semibold text-gray-800">
                            Techmire Solutions
                          </h3>
                          <p className="text-sm text-gray-700">Payroll Slip</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <PDFDownloadLink
                          document={<PayrollSlipPDF payroll={payrollData.find((p) => p.employee_id === selectedUser.employee_id) || generatedPayrolls[selectedUser.employee_id]} />}
                          fileName={`Payroll_Slip-${payroll.employee_id}-${payroll.month}.pdf`}
                        >
                          {({ loading }) => (
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              disabled={loading}
                              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-2 disabled:bg-gray-400 hover:bg-green-700"
                              aria-label="Download payroll slip PDF"
                            >
                              <Download size={16} />
                              {loading ? "Generating..." : "Download"}
                            </motion.button>
                          )}
                        </PDFDownloadLink>
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => setIsShowPayrollOpen(false)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm flex items-center gap-2 hover:bg-blue-700"
                          aria-label="Close payroll slip"
                        >
                          <Eye size={16} />
                          Close
                        </motion.button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Employee Details</h5>
                      <table className="w-full text-sm border rounded-md">
                        <tbody>
                          {[
                            { label: "Employee ID", value: payroll.employee_id },
                            { label: "Name", value: payroll.full_name },
                            { label: "Month", value: payroll.month },
                          ].map((item) => (
                            <tr key={item.label} className="border-b">
                              <td className="p-3 font-semibold text-gray-700">{item.label}</td>
                              <td className="p-3 text-gray-600">{item.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mb-6">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Payroll Summary</h5>
                      <table className="w-full text-sm border rounded-md">
                        <tbody>
                          {[
                            { label: "Total Working Hours", value: `${payroll.total_working_hours} hrs` },
                            { label: "Not Allowed Hours", value: `${payroll.not_allowed_hours} hrs` },
                            { label: "Official Working Days", value: payroll.official_working_days },
                            { label: "Adjusted Working Days", value: payroll.adjusted_working_days },
                            { label: "Effective Allowance Days", value: payroll.effective_allowance_days },
                            { label: "Hourly Wage", value: `${payroll.hourly_wage} PKR/hr` },
                            { label: "Daily Allowance Rate", value: `${payroll.daily_allowance_rate} PKR/day` },
                            { label: "Daily Allowance Total", value: `${payroll.daily_allowance_total} PKR` },
                            { label: "Official Leaves", value: payroll.official_leaves },
                            { label: "Allowed Hours/Day", value: `${payroll.allowed_hours_per_day} hrs` },
                            { label: "Hourly Salary", value: `${payroll.hourly_salary} PKR` },
                            { label: "Gross Salary", value: `${payroll.gross_salary} PKR` },
                            { label: "Late Count", value: payroll.late_count },
                            { label: "Absent Count", value: payroll.absent_count },
                            { label: "Effective Absent Count", value: payroll.effective_absent_count },
                            { label: "Salary Cap", value: `${payroll.Salary_Cap} PKR` },
                          ].map((item) => (
                            <tr key={item.label} className="border-b">
                              <td className="p-3 font-semibold text-gray-700">{item.label}</td>
                              <td className="p-3 text-right text-gray-600">{item.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mb-6">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Attendance Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { title: "Late Dates", data: payroll.late_dates },
                          { title: "Absent Dates", data: payroll.absent_dates },
                        ].map((section) => (
                          <div key={section.title}>
                            <h6 className="text-xs font-semibold text-gray-600 mb-1">{section.title}</h6>
                            {section.data.length > 0 ? (
                              <table className="w-full text-xs border rounded-md">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="p-2 font-semibold text-left">#</th>
                                    <th className="p-2 font-semibold text-left">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {section.data.map((date, index) => (
                                    <tr key={index} className="border-b">
                                      <td className="p-2 text-center text-gray-600">{index + 1}</td>
                                      <td className="p-2 text-gray-600">{date}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-xs text-gray-500 italic">No {section.title.toLowerCase()}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Attendance Records</h5>
                      {payroll.table_section_data?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border rounded-md">
                            <thead className="bg-orange-100">
                              <tr>
                                {["Date", "Day", "In Time", "Out Time", "Total Hours"].map((header) => (
                                  <th key={header} className="p-2 font-semibold text-left text-gray-700">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {payroll.table_section_data
                                .filter((row) => row[0] !== "User ID" && row[0] !== "Total")
                                .map((row, index) => (
                                  <tr key={index} className="border-b">
                                    <td className="p-2 text-gray-600">{row[0]}</td>
                                    <td className="p-2 text-gray-600">{row[1]}</td>
                                    <td className="p-2 text-gray-600">{row[4]}</td>
                                    <td className="p-2 text-gray-600">{row[6]}</td>
                                    <td className="p-2 text-gray-600">{row[14]}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No attendance records available</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              ) : null;
            })()
          )}
        </AnimatePresence>

        {/* Edit Payroll Modal */}
        <AnimatePresence>
          {isEditPayrollOpen && editPayroll && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white rounded-md p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-lg"
                role="dialog"
                aria-labelledby="edit-payroll-title"
              >
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 id="edit-payroll-title" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Edit size={20} className="text-yellow-500" />
                    Edit Payroll
                  </h3>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setIsEditPayrollOpen(false)}
                    className="text-gray-600 hover:text-gray-800"
                    aria-label="Close edit payroll modal"
                  >
                    ✕
                  </motion.button>
                </div>
                <div className="space-y-5">
                  <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
                    <label htmlFor="total-working-hours" className="block text-sm font-medium text-gray-700 mb-1">
                      Total Working Hours
                    </label>
                    <input
                      id="total-working-hours"
                      type="number"
                      value={editPayroll.total_working_hours}
                      onChange={handleTotalWorkingHoursChange}
                      className="w-full p-3 border rounded-md text-sm focus:ring-2 focus:ring-yellow-500"
                      min="0.01"
                      step="0.5"
                      aria-label="Total working hours"
                    />
                  </motion.div>
                  <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
                    <label htmlFor="gross-salary" className="block text-sm font-medium text-gray-700 mb-1">
                      Gross Salary (PKR)
                    </label>
                    <input
                      id="gross-salary"
                      type="text"
                      value={editPayroll.gross_salary.toFixed(2)}
                      disabled
                      className="w-full p-3 border rounded-md text-sm bg-gray-100 text-gray-600"
                      aria-label="Gross salary"
                    />
                  </motion.div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setIsEditPayrollOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                    aria-label="Cancel edit payroll"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleUpdatePayroll}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm flex items-center gap-2 hover:bg-yellow-700"
                    aria-label="Update payroll"
                  >
                    <Edit size={16} />
                    Update
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default UserList;