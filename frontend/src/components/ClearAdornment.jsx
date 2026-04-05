import { InputAdornment, IconButton } from "@mui/material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

export default function ClearAdornment({ value, onClear }) {
  if (!value) return null;
  return (
    <InputAdornment position="end">
      <IconButton size="small" onClick={onClear} edge="end">
        <CancelOutlinedIcon sx={{ fontSize: 22, color: "#6d5a57" }} />
      </IconButton>
    </InputAdornment>
  );
}
