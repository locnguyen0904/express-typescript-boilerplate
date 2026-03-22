import { jwtDecode } from "jwt-decode";

import csrfProvider from "./csrf-provider";
import { fetchJson } from "./fetch";
import tokenProvider from "./token-provider";

const authProvider = {
  login: async ({ username, password }) => {
    try {
      const { json } = await fetchJson("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: username, password }),
      });

      const { token } = json.data;
      if (!token) {
        throw new Error("No token received");
      }
      tokenProvider.setToken(token);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error");
    }
  },
  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      tokenProvider.removeToken();
      return Promise.reject();
    }
    return Promise.resolve();
  },
  checkAuth: () => {
    return tokenProvider.getToken() ? Promise.resolve() : Promise.reject();
  },
  logout: () => {
    tokenProvider.removeToken();
    csrfProvider.clearToken();
    return Promise.resolve();
  },
  getIdentity: () => {
    const token = tokenProvider.getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        return Promise.resolve({
          id: decodedToken.id || decodedToken._id || decodedToken.sub,
          fullName: decodedToken.fullName || decodedToken.name || "",
          email: decodedToken.email || "",
          role: decodedToken.role,
        });
      } catch (_error) {
        return Promise.reject();
      }
    }
    return Promise.reject();
  },
  getPermissions: () => {
    const token = tokenProvider.getToken();
    if (token) {
      const decodedToken = jwtDecode(token);
      const role = decodedToken.role;
      return role ? Promise.resolve(role) : Promise.reject();
    }
    return Promise.reject();
  },
};

export default authProvider;
