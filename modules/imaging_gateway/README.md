# Imaging Gateway

The Imaging Gateway exposes authenticated routes from the internal LORIS
imaging service through the main PHP application.

Requests under `/imaging_gateway/` are forwarded to the internal service.
Request and response bodies remain streams so that large downloads and Tus
uploads do not need to be loaded into PHP memory.

The Configuration module contains an **Imaging Gateway** category with:

- **Upstream URL**: the internal service's base HTTP(S) URL.
- **Connection timeout (seconds)**: how long to wait while establishing the
  upstream connection. Its default is 5 seconds.

Once connected, requests have no overall proxy timeout so that large
transfers are not interrupted.

The module has no menu entry. It must be active in the LORIS `modules` table,
and the internal imaging service must be running locally.
