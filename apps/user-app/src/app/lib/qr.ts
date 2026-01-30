import QRCode from "qrcode";

export async function generateQr(payload: string) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    width: 400,
  });
}