import { toast } from "react-toastify";

export const showToast = (type: any, message: any) => {
  switch (type) {
    case "success":
      toast.success(message || "Action completed successfully.");
      break;
    case "error":
      toast.error(message || "Something went wrong. Please try again.");
      break;
    case "info":
      toast.info(message || "Information message.");
      break;
    case "warn":
      toast.warn(message || "Warning: check your action.");
      break;
    default:
      toast(message || "Notification");
  }
};
