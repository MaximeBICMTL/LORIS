INSERT IGNORE INTO modules (Name, Active) VALUES ('imaging_gateway', 'Y');

INSERT IGNORE INTO ConfigSettings
    (Name, Description, Visible, AllowMultiple, Label, OrderNumber)
VALUES
    (
        'imaging_gateway',
        'Settings for forwarding authenticated requests to the internal imaging service',
        1,
        0,
        'Imaging Gateway',
        17
    );

INSERT IGNORE INTO ConfigSettings
    (
        Name,
        Description,
        Visible,
        AllowMultiple,
        DataType,
        Parent,
        Label,
        OrderNumber
    )
SELECT
    'imaging_gateway_upstream_url',
    'Base HTTP(S) URL of the internal imaging service',
    1,
    0,
    'text',
    ID,
    'Upstream URL',
    1
FROM ConfigSettings
WHERE Name='imaging_gateway';

INSERT IGNORE INTO ConfigSettings
    (
        Name,
        Description,
        Visible,
        AllowMultiple,
        DataType,
        Parent,
        Label,
        OrderNumber
    )
SELECT
    'imaging_gateway_connect_timeout_seconds',
    'Maximum number of seconds to wait while connecting to the internal imaging service',
    1,
    0,
    'text',
    ID,
    'Connection timeout (seconds)',
    2
FROM ConfigSettings
WHERE Name='imaging_gateway';

INSERT INTO Config (ConfigID, Value)
SELECT ID, '5'
FROM ConfigSettings cs
WHERE cs.Name='imaging_gateway_connect_timeout_seconds'
  AND NOT EXISTS (
      SELECT 1
      FROM Config c
      WHERE c.ConfigID=cs.ID
  );

INSERT IGNORE INTO ConfigSettings
    (Name, Description, Visible, AllowMultiple, DataType, Parent, Label, OrderNumber)
SELECT
    'imaging_gateway_hide_error_bodies',
    'Remove the response body from HTTP errors returned by the internal imaging service',
    1, 0, 'boolean', ID, 'Hide upstream error response bodies', 3
FROM ConfigSettings
WHERE Name='imaging_gateway';

INSERT INTO Config (ConfigID, Value)
SELECT ID, 'true'
FROM ConfigSettings cs
WHERE cs.Name='imaging_gateway_hide_error_bodies'
  AND NOT EXISTS (
      SELECT 1 FROM Config c WHERE c.ConfigID=cs.ID
  );

INSERT IGNORE INTO ConfigSettings
    (Name, Description, Visible, AllowMultiple, DataType, Parent, Label, OrderNumber)
SELECT
    'imaging_gateway_allowed_paths',
    'Regex patterns for complete gateway-relative paths that may be forwarded; no values deny all requests',
    1, 1, 'text', ID, 'Allowed path patterns', 4
FROM ConfigSettings
WHERE Name='imaging_gateway';

INSERT IGNORE INTO ConfigSettings
    (Name, Description, Visible, AllowMultiple, DataType, Parent, Label, OrderNumber)
SELECT
    'imaging_gateway_required_permissions',
    'LORIS permissions of which a user must have at least one; no values deny all requests',
    1, 1, 'text', ID, 'Required permissions', 5
FROM ConfigSettings
WHERE Name='imaging_gateway';
