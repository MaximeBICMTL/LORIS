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
- **Hide upstream error response bodies**: return an empty body for upstream
  HTTP responses with a status of 400 or greater. Enabled by default.
- **Allowed path patterns**: PCRE expressions matched against the complete
  gateway-relative path, including its leading slash. The host, installation
  path, `/imaging_gateway`, query, and URL fragment are not included.
- **Required permissions**: LORIS permissions of which the user must possess at
  least one.

Both allowlists are required and fail closed: if either has no configured
values, no request is forwarded. Path patterns are implicitly anchored to the
complete path. For example, `/ephys/.*` permits paths below `/ephys/`. A literal
`~` in an expression must be escaped. The internal service remains responsible
for endpoint- and resource-specific authorization.

Once connected, requests have no overall proxy timeout so that large
transfers are not interrupted.

The module has no menu entry. It must be active in the LORIS `modules` table,
and the internal imaging service must be running locally.
