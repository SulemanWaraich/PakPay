/**
 * Staging load smoke for payment API (requires session cookie / auth in real runs).
 * Run: k6 run scripts/k6/pay-smoke.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "10s",
};

const BASE = __ENV.BASE_URL || "http://127.0.0.1:3005";

export default function () {
  const res = http.get(`${BASE}/`);
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(1);
}
