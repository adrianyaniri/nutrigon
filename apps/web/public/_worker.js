/* global URL, Response */
const STAFF_HOSTNAME = "admin.nutrigon.ar";

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname !== STAFF_HOSTNAME) {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/manifest.webmanifest") {
      return env.ASSETS.fetch(new URL("/admin.webmanifest", url));
    }

    if (url.pathname === "/") {
      return Response.redirect(new URL("/admin", url), 302);
    }

    return env.ASSETS.fetch(request);
  },
};
