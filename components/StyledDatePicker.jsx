import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Platform, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
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
  mode = "datetime",
  icon,
  placeholder = "Select date/time",
  width = "100%",
  minDate = null,
  value = null,
}) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  // Modal state
  const [showModal, setShowModal] = useState(false);

  // Helper function to parse the value prop
  const parseValue = (val) => {
    if (!val) return null;
    
    try {
      // Handle different date formats
      let dateObj;
      
      if (val.includes('/')) {
        // Format: MM/DD/YYYY or MM/DD/YYYY HH:MM AM/PM
        const parts = val.split(' ');
        const datePart = parts[0]; // MM/DD/YYYY
        const timePart = parts[1] + (parts[2] ? ' ' + parts[2] : ''); // HH:MM AM/PM
        
        // Manually parse the date part MM/DD/YYYY
        const dateParts = datePart.split('/');
        if (dateParts.length === 3) {
          const month = parseInt(dateParts[0]) - 1; // Month is 0-indexed in Date
          const day = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          
          dateObj = new Date(year, month, day);
          
          if (timePart && timePart !== 'undefined') {
            const timeMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)?/);
            if (timeMatch) {
              let hours = parseInt(timeMatch[1]);
              const minutes = parseInt(timeMatch[2]);
              const period = timeMatch[3];
              
              if (period === 'PM' && hours !== 12) hours += 12;
              if (period === 'AM' && hours === 12) hours = 0;
              
              dateObj.setHours(hours, minutes, 0, 0);
            }
          }
        } else {
          return null;
        }
      } else {
        dateObj = new Date(val);
      }
      
      return dateObj;
    } catch (error) {
      console.error('Error parsing date value:', error);
      return null;
    }
  };

  // Get current date/time for defaults
  const now = new Date();
  const parsedValue = parseValue(value);
  const defaultDate = parsedValue || now;

  const currentDay = defaultDate.getDate().toString().padStart(2, "0");
  const currentMonth = (defaultDate.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = defaultDate.getFullYear().toString();
  const currentHour12 = defaultDate.getHours() % 12 || 12;
  const currentMinute = defaultDate.getMinutes().toString().padStart(2, "0");
  const currentPeriod = defaultDate.getHours() >= 12 ? "PM" : "AM";

  // Add validation to ensure we have valid values
  const safeDay = currentDay && !isNaN(parseInt(currentDay)) ? currentDay : now.getDate().toString().padStart(2, "0");
  const safeMonth = currentMonth && !isNaN(parseInt(currentMonth)) ? currentMonth : (now.getMonth() + 1).toString().padStart(2, "0");
  const safeYear = currentYear && !isNaN(parseInt(currentYear)) ? currentYear : now.getFullYear().toString();
  const safeHour = currentHour12 && !isNaN(parseInt(currentHour12)) ? currentHour12.toString().padStart(2, "0") : (now.getHours() % 12 || 12).toString().padStart(2, "0");
  const safeMinute = currentMinute && !isNaN(parseInt(currentMinute)) ? currentMinute : now.getMinutes().toString().padStart(2, "0");
  const safePeriod = currentPeriod === "AM" || currentPeriod === "PM" ? currentPeriod : (now.getHours() >= 12 ? "PM" : "AM");

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
    const parsedValue = parseValue(value);
    if (parsedValue) {
      const newDay = parsedValue.getDate().toString().padStart(2, "0");
      const newMonth = (parsedValue.getMonth() + 1).toString().padStart(2, "0");
      const newYear = parsedValue.getFullYear().toString();
      const newHour12 = parsedValue.getHours() % 12 || 12;
      const newMinute = parsedValue.getMinutes().toString().padStart(2, "0");
      const newPeriod = parsedValue.getHours() >= 12 ? "PM" : "AM";

      // Add safety checks to prevent NaN values
      const safeNewDay = newDay && !isNaN(parseInt(newDay)) ? newDay : day;
      const safeNewMonth = newMonth && !isNaN(parseInt(newMonth)) ? newMonth : month;
      const safeNewYear = newYear && !isNaN(parseInt(newYear)) ? newYear : year;
      const safeNewHour = newHour12 && !isNaN(parseInt(newHour12)) ? newHour12.toString().padStart(2, "0") : hour;
      const safeNewMinute = newMinute && !isNaN(parseInt(newMinute)) ? newMinute : minute;
      const safeNewPeriod = (newPeriod === "AM" || newPeriod === "PM") ? newPeriod : period;

      setDay(safeNewDay);
      setMonth(safeNewMonth);
      setYear(safeNewYear);
      setHour(safeNewHour);
      setMinute(safeNewMinute);
      setPeriod(safeNewPeriod);
    }
  }, [value]);

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
    const minDateParts = minDate.split('/');
    if (minDateParts.length !== 3) return true;
    
    const minMonth = parseInt(minDateParts[0]) - 1; // 0-indexed
    const minDay = parseInt(minDateParts[1]);
    const minYear = parseInt(minDateParts[2]);
    const minDateObj = new Date(minYear, minMonth, minDay);
    
    return testDate >= minDateObj;
  };

  const getValidMonths = () => {
    // Temporarily return all months to test basic functionality
    return months;
  };

  const getValidDays = () => {
    const currentYear = parseInt(year);
    const currentMonth = parseInt(month);
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    
    // Temporarily return all days to test basic functionality
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
    const validYear = year && !isNaN(parseInt(year)) ? year : new Date().getFullYear().toString();
    const validHour = hour && !isNaN(parseInt(hour)) ? hour : "12";
    const validMinute = minute && !isNaN(parseInt(minute)) ? minute : "00";
    const validPeriod = (period === "AM" || period === "PM") ? period : "AM";

    if (mode === "date" || mode === "datetime") {
      const monthName = months.find((m) => m.value === validMonth)?.label || "January";
      result += `${monthName} ${validDay}, ${validYear}`;
    }

    if (mode === "datetime") {
      result += " at ";
    }

    if (mode === "time" || mode === "datetime") {
      result += `${validHour}:${validMinute} ${validPeriod}`;
    }

    return result;
  };

  const updateDateTime = (d, m, y, h, min, p) => {
    // Validate inputs before processing
    const validDay = d && !isNaN(parseInt(d)) ? d : "01";
    const validMonth = m && !isNaN(parseInt(m)) ? m : "01";
    const validYear = y && !isNaN(parseInt(y)) ? y : new Date().getFullYear().toString();
    const validHour = h && !isNaN(parseInt(h)) ? h : "12";
    const validMinute = min && !isNaN(parseInt(min)) ? min : "00";
    const validPeriod = (p === "AM" || p === "PM") ? p : "AM";

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
                
                // Parse minDate manually if provided
                if (minDate) {
                  const minDateParts = minDate.split('/');
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

  return (
    <View style={[styles.wrapper, { width }]}>
      {label && <StyledLabel text={label} style={styles.label} />}

      <StyledTextInput
        editable={false}
        onPress={() => setShowModal(true)}
        icon={icon}
        placeholder={placeholder}
        value={getDisplayValue()}
        width={width}
      />

      <BottomModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        style={styles.modalContainer}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalContent}>
            <StyledLabel text="Select Date & Time" style={styles.modalTitle} />

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
          <StyledButton
            text="Confirm"
            onPress={() => setShowModal(false)}
            color="primary"
          />
        </View>
      </BottomModal>
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
    maxHeight: "80%",
  },
  modalContent: {
    gap: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: -25,
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
  },
  picker: {
    flex: 1,
    fontFamily: "Poppins-Regular",
  },
  pickerItem: {
    fontSize: Platform.OS === "android" ? 12 : 14,
    fontFamily: "Poppins-Regular",
    height: Platform.OS === "android" ? 40 : 100,
  },
  buttonContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: mystyle.paddingHorizontal,
    paddingVertical: mystyle.paddingVertical,
  },
});
