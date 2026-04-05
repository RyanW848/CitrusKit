import { TextField, InputAdornment } from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ClearAdornment from "./ClearAdornment";

/**
 * Controlled search field for reuse across pages (leagues, players, etc.).
 *
 * @param {object} props
 * @param {string} props.value
 * @param {(e: import('react').ChangeEvent<HTMLInputElement>) => void} props.onChange
 * @param {() => void} [props.onClear]
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.showIcon]
 * @param {import('@mui/system').SxProps} [props.sx]
 */
export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search…",
  disabled = false,
  showIcon = true,
  sx,
}) {
  return (
    <TextField
      fullWidth
      size="small"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      InputProps={{
        startAdornment: showIcon ? (
          <InputAdornment position="start">
            <SearchOutlinedIcon sx={{ color: "#888", fontSize: 22 }} />
          </InputAdornment>
        ) : undefined,
        endAdornment: onClear ? (
          <ClearAdornment value={value} onClear={onClear} />
        ) : undefined,
      }}
      sx={{
        mb: 2,
        "& .MuiOutlinedInput-root": {
          bgcolor: "#fff",
          borderRadius: "12px",
          "& fieldset": { borderColor: "#e5d5c8" },
          "&:hover fieldset": { borderColor: "#d4c4b8" },
          "&.Mui-focused fieldset": { borderColor: "#c4a896" },
        },
        "& .MuiInputBase-input::placeholder": { color: "#9a8a84", opacity: 1 },
        ...sx,
      }}
    />
  );
}
