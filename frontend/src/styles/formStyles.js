export const inputSx = {
  mb: 3,
  "& .MuiOutlinedInput-root": {
    backgroundColor: "transparent",
    borderRadius: "8px",
    "& fieldset": { borderColor: "#A08985", borderWidth: "1px" },
    "&:hover fieldset": { borderColor: "#8c7672" },
    "&.Mui-focused fieldset": { borderColor: "#8c7672" },
  },
  "& .MuiInputLabel-root": {
    color: "#6d5a57",
    backgroundColor: "#fef0e8",
    padding: "0 4px",
    "&.Mui-focused": { color: "#8c7672" },
  },
  "& .MuiOutlinedInput-input": {
    padding: "16px",
  },
};

export const errorInputSx = {
  ...inputSx,
  "& .MuiOutlinedInput-root": {
    ...inputSx["& .MuiOutlinedInput-root"],
    "& fieldset": { borderColor: "#c0392b" },
    "&:hover fieldset": { borderColor: "#c0392b" },
    "&.Mui-focused fieldset": { borderColor: "#c0392b" },
  },
  "& .MuiInputLabel-root": {
    ...inputSx["& .MuiInputLabel-root"],
    color: "#c0392b",
    "&.Mui-focused": { color: "#c0392b" },
  },
  "& .MuiFormHelperText-root": {
    color: "#c0392b",
    fontWeight: 500,
  },
};

export const btnSx = {
  backgroundColor: "#f4c9b3",
  color: "#1a1a1a",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.95rem",
  borderRadius: "10px",
  padding: "12px 20px",
  boxShadow: "none",
  "&:hover": { backgroundColor: "#eeb89e", boxShadow: "none" },
};
