import React from "react";
import StyledLabel from "./StyledLabel";
import useMessageTime from "../hooks/useMessageTime";

export default function MessageTimeDisplay({ timestamp, style, color }) {
  const formattedTime = useMessageTime(timestamp);
  
  return (
    <StyledLabel
      text={formattedTime}
      color={color}
      style={style}
    />
  );
} 