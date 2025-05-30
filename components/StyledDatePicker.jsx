import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "../constants/colors";
import { styles as mystyle } from "../constants/styles";
import { useTheme } from "../context/ThemeContext";
import StyledTextInput from "./StyledTextInput";
import BottomModal from "./BottomModal";
import StyledLabel from "./StyledLabel";
import StyledButton from "./StyledButton";

export default function StyledDatePicker({
  label,
  onChange,
  mode = "date",
  icon,
  placeholder = "Select date/time",
  width = "100%",
  minDate = null,
  value = null,
}) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();
  const isAndroid = Platform.OS === "android";

  // Modal state (for iOS)
  const [showModal, setShowModal] = useState(false);
  // Android native picker state
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  // Helper function to parse the value prop
  const parseValue = (val) => {
    if (!val) return new Date();

    try {
      if (typeof val === "string" && val.includes("/")) {
        const parts = val.split("/");
        if (parts.length !== 3) return new Date();

        const month = parseInt(parts[0]) - 1;
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);

        if (isNaN(month) || isNaN(day) || isNaN(year)) return new Date();

        const parsedDate = new Date(year, month, day);
        return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      }
      const parsedDate = new Date(val);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    } catch (error) {
      console.error("Error parsing date value:", error);
      return new Date();
    }
  };

  // Get current date/time for defaults
  const now = new Date();
  const [date, setDate] = useState(parseValue(value));

  const currentDay = date.getDate().toString().padStart(2, "0");
  const currentMonth = (date.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = date.getFullYear().toString();
  const currentHour12 = date.getHours() % 12 || 12;
  const currentMinute = date.getMinutes().toString().padStart(2, "0");
  const currentPeriod = date.getHours() >= 12 ? "PM" : "AM";

  // Add validation to ensure we have valid values
  const safeDay =
    currentDay && !isNaN(parseInt(currentDay))
      ? currentDay
      : now.getDate().toString().padStart(2, "0");
  const safeMonth =
    currentMonth && !isNaN(parseInt(currentMonth))
      ? currentMonth
      : (now.getMonth() + 1).toString().padStart(2, "0");
  const safeYear =
    currentYear && !isNaN(parseInt(currentYear))
      ? currentYear
      : now.getFullYear().toString();
  const safeHour =
    currentHour12 && !isNaN(parseInt(currentHour12))
      ? currentHour12.toString().padStart(2, "0")
      : (now.getHours() % 12 || 12).toString().padStart(2, "0");
  const safeMinute =
    currentMinute && !isNaN(parseInt(currentMinute))
      ? currentMinute
      : now.getMinutes().toString().padStart(2, "0");
  const safePeriod =
    currentPeriod === "AM" || currentPeriod === "PM"
      ? currentPeriod
      : now.getHours() >= 12
      ? "PM"
      : "AM";

  // Date state with parsed value or current date as default
  const [day, setDay] = useState(safeDay);
  const [month, setMonth] = useState(safeMonth);
  const [year, setYear] = useState(safeYear);

  // Time state with parsed value or current time as default
  const [hour, setHour] = useState(safeHour);
  const [minute, setMinute] = useState(safeMinute);
  const [period, setPeriod] = useState(safePeriod);

  // Update state when value prop changes
  useEffect(() => {
    if (value) {
      const parsedDate = parseValue(value);
      setDate(parsedDate);

      // Update individual date parts
      setDay(parsedDate.getDate().toString().padStart(2, "0"));
      setMonth((parsedDate.getMonth() + 1).toString().padStart(2, "0"));
      setYear(parsedDate.getFullYear().toString());

      if (mode === "datetime" || mode === "time") {
        const hours = parsedDate.getHours();
        setHour((hours % 12 || 12).toString().padStart(2, "0"));
        setMinute(parsedDate.getMinutes().toString().padStart(2, "0"));
        setPeriod(hours >= 12 ? "PM" : "AM");
      }
    }
  }, [value, mode]);

  const months = [
    { label: "January", value: "01" },
    { label: "February", value: "02" },
    { label: "March", value: "03" },
    { label: "April", value: "04" },
    { label: "May", value: "05" },
    { label: "June", value: "06" },
    { label: "July", value: "07" },
    { label: "August", value: "08" },
    { label: "September", value: "09" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const isValidDate = (testYear, testMonth, testDay) => {
    if (!minDate) return true;

    const testDate = new Date(testYear, testMonth - 1, testDay);

    // Parse minDate manually using the same logic as parseValue
    const minDateParts = minDate.split("/");
    if (minDateParts.length !== 3) return true;

    const minMonth = parseInt(minDateParts[0]) - 1; // 0-indexed
    const minDay = parseInt(minDateParts[1]);
    const minYear = parseInt(minDateParts[2]);
    const minDateObj = new Date(minYear, minMonth, minDay);

    return testDate >= minDateObj;
  };

  const getValidMonths = () => {
    return months;
  };

  const getValidDays = () => {
    const currentYear = parseInt(year);
    const currentMonth = parseInt(month);
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);

    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayValue = i + 1;
      return { value: `${dayValue}`.padStart(2, "0"), isValid: true };
    });
  };

  const getDisplayValue = () => {
    let result = "";

    // Validate values before using them
    const validDay = day && !isNaN(parseInt(day)) ? day : "01";
    const validMonth = month && !isNaN(parseInt(month)) ? month : "01";
    const validYear =
      year && !isNaN(parseInt(year))
        ? year
        : new Date().getFullYear().toString();
    const validHour = hour && !isNaN(parseInt(hour)) ? hour : "12";
    const validMinute = minute && !isNaN(parseInt(minute)) ? minute : "00";
    const validPeriod = period === "AM" || period === "PM" ? period : "AM";

    if (mode === "date" || mode === "datetime") {
      const monthName =
        months.find((m) => m.value === validMonth)?.label || "January";
      result += `${monthName} ${parseInt(validDay)}, ${validYear}`;
    }

    if (mode === "datetime") {
      result += " at ";
    }

    if (mode === "time" || mode === "datetime") {
      result += `${validHour}:${validMinute} ${validPeriod}`;
    }

    return result;
  };

  const formatDate = (date) => {
    if (!date) return "";

    try {
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const updateDateTime = (d, m, y, h, min, p) => {
    // Validate inputs before processing
    const validDay = d && !isNaN(parseInt(d)) ? d : "01";
    const validMonth = m && !isNaN(parseInt(m)) ? m : "01";
    const validYear =
      y && !isNaN(parseInt(y)) ? y : new Date().getFullYear().toString();
    const validHour = h && !isNaN(parseInt(h)) ? h : "12";
    const validMinute = min && !isNaN(parseInt(min)) ? min : "00";
    const validPeriod = p === "AM" || p === "PM" ? p : "AM";

    let result = "";

    if (mode === "date" || mode === "datetime") {
      result += `${validMonth}/${validDay}/${validYear}`;
    }

    if (mode === "datetime") {
      result += " ";
    }

    if (mode === "time" || mode === "datetime") {
      result += `${validHour}:${validMinute} ${validPeriod}`;
    }

    onChange?.(result);
  };

  const handlePickerChange = (type, value) => {
    let newDay = day,
      newMonth = month,
      newYear = year;
    let newHour = hour,
      newMinute = minute,
      newPeriod = period;

    switch (type) {
      case "day":
        newDay = value;
        setDay(value);
        break;
      case "month":
        newMonth = value;
        setMonth(value);
        break;
      case "year":
        newYear = value;
        setYear(value);
        break;
      case "hour":
        newHour = value;
        setHour(value);
        break;
      case "minute":
        newMinute = value;
        setMinute(value);
        break;
      case "period":
        newPeriod = value;
        setPeriod(value);
        break;
    }

    updateDateTime(newDay, newMonth, newYear, newHour, newMinute, newPeriod);
  };

  const renderDatePickers = () => {
    if (mode === "time") return null;

    return (
      <View style={styles.sectionContainer}>
        <StyledLabel text="Date" style={styles.sectionLabel} />
        <View style={styles.pickerRow}>
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: theme.textInputBg,
                borderColor:
                  theme === colors.dark ? colors.darkGray : colors.gray,
              },
            ]}
          >
            <Picker
              selectedValue={month}
              style={[styles.picker, { color: theme.textInputColor }]}
              itemStyle={[styles.pickerItem, { color: theme.textInputColor }]}
              onValueChange={(val) => handlePickerChange("month", val)}
            >
              {getValidMonths().map((m) => (
                <Picker.Item key={m.value} label={m.label} value={m.value} />
              ))}
            </Picker>
          </View>

          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: theme.textInputBg,
                borderColor:
                  theme === colors.dark ? colors.darkGray : colors.gray,
              },
            ]}
          >
            <Picker
              selectedValue={day}
              style={[styles.picker, { color: theme.textInputColor }]}
              itemStyle={[styles.pickerItem, { color: theme.textInputColor }]}
              onValueChange={(val) => handlePickerChange("day", val)}
            >
              {getValidDays().map((d) => (
                <Picker.Item key={d.value} label={d.value} value={d.value} />
              ))}
            </Picker>
          </View>

          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: theme.textInputBg,
                borderColor:
                  theme === colors.dark ? colors.darkGray : colors.gray,
              },
            ]}
          >
            <Picker
              selectedValue={year}
              style={[styles.picker, { color: theme.textInputColor }]}
              itemStyle={[styles.pickerItem, { color: theme.textInputColor }]}
              onValueChange={(val) => handlePickerChange("year", val)}
            >
              {Array.from({ length: 10 }, (_, i) => {
                let minYear = new Date().getFullYear();

                if (minDate) {
                  const minDateParts = minDate.split("/");
                  if (minDateParts.length === 3) {
                    const parsedMinYear = parseInt(minDateParts[2]);
                    if (!isNaN(parsedMinYear)) {
                      minYear = parsedMinYear;
                    }
                  }
                }

                const startYear = Math.max(minYear, new Date().getFullYear());
                const value = (startYear + i).toString();
                return <Picker.Item key={value} label={value} value={value} />;
              })}
            </Picker>
          </View>
        </View>
      </View>
    );
  };

  const renderTimePickers = () => {
    if (mode === "date") return null;

    return (
      <View style={styles.sectionContainer}>
        <StyledLabel text="Time" style={styles.sectionLabel} />
        <View style={styles.pickerRow}>
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: theme.textInputBg,
                borderColor:
                  theme === colors.dark ? colors.darkGray : colors.gray,
              },
            ]}
          >
            <Picker
              selectedValue={hour}
              style={[styles.picker, { color: theme.textInputColor }]}
              itemStyle={[styles.pickerItem, { color: theme.textInputColor }]}
              onValueChange={(val) => handlePickerChange("hour", val)}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const value = `${i + 1}`.padStart(2, "0");
                return <Picker.Item key={value} label={value} value={value} />;
              })}
            </Picker>
          </View>

          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: theme.textInputBg,
                borderColor:
                  theme === colors.dark ? colors.darkGray : colors.gray,
              },
            ]}
          >
            <Picker
              selectedValue={minute}
              style={[styles.picker, { color: theme.textInputColor }]}
              itemStyle={[styles.pickerItem, { color: theme.textInputColor }]}
              onValueChange={(val) => handlePickerChange("minute", val)}
            >
              {Array.from({ length: 60 }, (_, i) => {
                const value = `${i}`.padStart(2, "0");
                return <Picker.Item key={value} label={value} value={value} />;
              })}
            </Picker>
          </View>

          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: theme.textInputBg,
                borderColor:
                  theme === colors.dark ? colors.darkGray : colors.gray,
              },
            ]}
          >
            <Picker
              selectedValue={period}
              style={[styles.picker, { color: theme.textInputColor }]}
              itemStyle={[styles.pickerItem, { color: theme.textInputColor }]}
              onValueChange={(val) => handlePickerChange("period", val)}
            >
              <Picker.Item label="AM" value="AM" />
              <Picker.Item label="PM" value="PM" />
            </Picker>
          </View>
        </View>
      </View>
    );
  };

  const onAndroidDateChange = (event, selectedDate) => {
    setShowAndroidPicker(false);
    if (event.type === "dismissed") {
      return;
    }

    const currentDate = selectedDate || date;
    setDate(currentDate);

    if (onChange) {
      const formattedDate = formatDate(currentDate);
      onChange(formattedDate);
    }
  };

  const showPicker = () => {
    if (isAndroid) {
      setShowAndroidPicker(true);
    } else {
      setShowModal(true);
    }
  };

  return (
    <View style={[styles.wrapper, { width }]}>
      {label && <StyledLabel text={label} style={styles.label} />}

      {Platform.OS === "ios" ? (
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
          style={styles.pressable}
        >
          <StyledTextInput
            value={getDisplayValue()}
            placeholder={placeholder}
            icon={icon}
            editable={false}
            pointerEvents="none"
            onPress={() => setShowModal(true)}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={showPicker} activeOpacity={0.7}>
          <StyledTextInput
            value={value || ""}
            placeholder={placeholder}
            icon={icon}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
      )}

      {/* Android Native Date Picker */}
      {isAndroid && showAndroidPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={false}
          onChange={onAndroidDateChange}
          minimumDate={minDate ? parseValue(minDate) : undefined}
        />
      )}

      {/* iOS Custom Modal Picker */}
      {!isAndroid && (
        <BottomModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          style={styles.modalContainer}
        >
          <View style={styles.modalWrapper}>
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
                <StyledLabel
                  text="Select Date & Time"
                  style={styles.modalTitle}
                />
                {renderDatePickers()}
                {renderTimePickers()}
              </View>
            </ScrollView>

            <View
              style={[
                styles.buttonContainer,
                {
                  backgroundColor: theme.cardColor,
                  borderTopColor: theme.iconColor,
                },
              ]}
            >
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={() => {
                    updateDateTime(day, month, year, hour, minute, period);
                    setShowModal(false);
                  }}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BottomModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: mystyle.marginVertical,
  },
  label: {
    fontSize: mystyle.fontSize,
    fontFamily: "Poppins-Regular",
    marginBottom: 8,
  },
  modalContainer: {
    maxHeight: Platform.OS === "ios" ? "80%" : "60%",
  },
  modalWrapper: {
    flex: 1,
    flexDirection: "column",
  },
  modalContent: {
    gap: 20,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: Platform.OS === "ios" ? -25 : 0,
  },
  sectionContainer: {
    gap: 15,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 5,
  },
  pickerContainer: {
    flex: 1,
    borderRadius: mystyle.borderRadius,
    borderWidth: 1,
    minHeight: Platform.OS === "android" ? 45 : 120,
    justifyContent: "center",
    overflow: "hidden",
  },
  picker: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    height: Platform.OS === "android" ? 45 : 120,
  },
  pickerItem: {
    fontSize: Platform.OS === "android" ? 14 : 16,
    fontFamily: "Poppins-Regular",
    height: Platform.OS === "android" ? 45 : 120,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    width: "100%",
    backgroundColor: "white",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f1f1",
  },
  confirmButton: {
    backgroundColor: colors.primary || "#007AFF",
  },
  cancelButtonText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: mystyle.paddingHorizontal,
    paddingVertical: mystyle.paddingVertical,
    paddingBottom: 20,
  },
  pressable: {
    width: "100%",
    minHeight: 44,
    justifyContent: "center",
  },
});
