export type SweetAlertType = "success" | "error" | "info" | "warning";

async function fireAlert(
  type: SweetAlertType,
  message: string,
  title?: string
): Promise<void> {
  const Swal = (await import("sweetalert2")).default;

  const text = (message ?? "").trim();
  if (!text) return;

  await Swal.fire({
    icon: type,
    title:
      title ??
      (type === "success"
        ? "Success"
        : type === "error"
          ? "Error"
          : type === "warning"
            ? "Warning"
            : "Notice"),
    text,
    confirmButtonColor: "#F07000",
  });
}

export function showSuccessAlert(message: string, title?: string) {
  return fireAlert("success", message, title);
}

export function showErrorAlert(message: string, title?: string) {
  return fireAlert("error", message, title);
}

export function showInfoAlert(message: string, title?: string) {
  return fireAlert("info", message, title);
}
