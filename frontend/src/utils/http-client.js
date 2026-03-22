import { jwtDecode } from "jwt-decode";

import * as fetchUtils from "./fetch";
import tokenProvider from "./token-provider";

const httpClient = async (url, options = {}) => {
  const headers = options.headers
    ? new Headers(options.headers)
    : new Headers({ Accept: "application/json" });

  const token = tokenProvider.getToken();
  if (!token) {
    return fetchUtils.fetchJson(url, { ...options, headers });
  }

  let needsRefresh = false;
  try {
    const decodedToken = jwtDecode(token);
    const { exp } = decodedToken;
    const now = Math.floor(Date.now() / 1000);
    needsRefresh = now >= exp - 5;
  } catch (_decodeError) {
    needsRefresh = true;
  }

  if (needsRefresh) {
    const gotFreshToken = await tokenProvider.getRefreshedToken();
    if (gotFreshToken) {
      headers.set("Authorization", `Bearer ${tokenProvider.getToken()}`);
    }
  } else {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetchUtils.fetchJson(url, { ...options, headers });
};

export default httpClient;
