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
