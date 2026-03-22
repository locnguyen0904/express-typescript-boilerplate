const tokenProvider = () => {
  let refreshPromise = null;

  const getRefreshedToken = async () => {
    if (refreshPromise) {
      return refreshPromise;
    }

    const refreshEndpoint = "/api/v1/auth/refresh-token";
    const request = new Request(refreshEndpoint, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      credentials: "include",
    });

    refreshPromise = (async () => {
      try {
        const response = await fetch(request);
        if (response.status !== 200) {
          removeToken();
          return false;
        }
        const { data } = await response.json();
        if (data && data.token) {
          setToken(data.token);
          return true;
        }
        return false;
      } catch {
        removeToken();
        return false;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  const setToken = (token) => {
    localStorage.setItem("token", token);
    return true;
  };

  const removeToken = () => {
    localStorage.removeItem("token");
    return true;
  };

  const getToken = () => {
    const token = localStorage.getItem("token");
    return token;
  };

  return {
    getRefreshedToken,
    getToken,
    setToken,
    removeToken,
  };
};

export default tokenProvider();
