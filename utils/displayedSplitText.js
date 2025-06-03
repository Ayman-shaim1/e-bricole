
export const displayedSplitText = (text, size) => {
  if (text.length >= size) {
    return String(text).substring(0, size) + "...";
  }
  return text;
};
