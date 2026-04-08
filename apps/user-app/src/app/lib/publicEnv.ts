/** Browser connects to the socket gateway (host:port reachable from the client). */
export const PUBLIC_SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";
