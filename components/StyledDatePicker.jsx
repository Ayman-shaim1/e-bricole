import React, { useState } from "react";
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
}) {
  const { getCurrentTheme } = useTheme();
  const theme = getCurrentTheme();

  // Modal state
  const [showModal, setShowModal] = useState(false);

  // Get current date/time for defaults
  const now = new Date();
  const currentDay = now.getDate().toString().padStart(2, "0");
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = now.getFullYear().toString();
  const currentHour12 = now.getHours() % 12 || 12;
  const currentMinute = now.getMinutes().toString().padStart(2, "0");
  const currentPeriod = now.getHours() >= 12 ? "PM" : "AM";

  // Date state with current date as default
  const [day, setDay] = useState(currentDay);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  // Time state with current time as default
  const [hour, setHour] = useState(currentHour12.toString().padStart(2, "0"));
  const [minute, setMinute] = useState(currentMinute);
  const [period, setPeriod] = useState(currentPeriod);

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

  const getDisplayValue = () => {
    let result = "";

    if (mode === "date" || mode === "datetime") {
      const monthName =
        months.find((m) => m.value === month)?.label || "January";
      result += `${monthName} ${day}, ${year}`;
    }

    if (mode === "datetime") {
      result += " at ";
    }

    if (mode === "time" || mode === "datetime") {
      result += `${hour}:${minute} ${period}`;
    }

    return result;
  };

  const updateDateTime = (d, m, y, h, min, p) => {
    let result = "";

    if (mode === "date" || mode === "datetime") {
      result += `${m}/${d}/${y}`;
    }

    if (mode === "datetime") {
      result += " ";
    }

    if (mode === "time" || mode === "datetime") {
      result += `${h}:${min} ${p}`;
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
              {months.map((m) => (
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
              {Array.from(
                { length: getDaysInMonth(parseInt(month), parseInt(year)) },
                (_, i) => {
                  const value = `${i + 1}`.padStart(2, "0");
                  return (
                    <Picker.Item key={value} label={value} value={value} />
                  );
                }
              )}
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
                const value = (new Date().getFullYear() + i).toString();
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
    <View style={styles.wrapper}>
      {label && <StyledLabel text={label} style={styles.label} />}

      <StyledTextInput
        editable={false}
        onPress={() => setShowModal(true)}
        icon={icon}
        placeholder={placeholder}
        value={getDisplayValue()}
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
