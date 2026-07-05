ALTER TABLE `mri_processing_protocol`
  ADD COLUMN `InsertTimeTimestamp` timestamp NULL DEFAULT NULL AFTER `InsertTime`;

UPDATE `mri_processing_protocol`
SET `InsertTimeTimestamp` = FROM_UNIXTIME(`InsertTime`);

ALTER TABLE `mri_processing_protocol`
  DROP COLUMN `InsertTime`;

ALTER TABLE `mri_processing_protocol`
  CHANGE COLUMN `InsertTimeTimestamp` `InsertTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `files`
  ADD COLUMN `InsertTimeTimestamp` timestamp NULL DEFAULT NULL AFTER `InsertTime`;

UPDATE `files`
SET `InsertTimeTimestamp` = FROM_UNIXTIME(`InsertTime`);

ALTER TABLE `files`
  DROP COLUMN `InsertTime`;

ALTER TABLE `files`
  CHANGE COLUMN `InsertTimeTimestamp` `InsertTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `parameter_candidate`
  ADD COLUMN `InsertTimeTimestamp` timestamp NULL DEFAULT NULL AFTER `InsertTime`;

UPDATE `parameter_candidate`
SET `InsertTimeTimestamp` = FROM_UNIXTIME(`InsertTime`);

ALTER TABLE `parameter_candidate`
  DROP COLUMN `InsertTime`;

ALTER TABLE `parameter_candidate`
  CHANGE COLUMN `InsertTimeTimestamp` `InsertTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `parameter_file`
  ADD COLUMN `InsertTimeTimestamp` timestamp NULL DEFAULT NULL AFTER `InsertTime`;

UPDATE `parameter_file`
SET `InsertTimeTimestamp` = FROM_UNIXTIME(`InsertTime`);

ALTER TABLE `parameter_file`
  DROP COLUMN `InsertTime`;

ALTER TABLE `parameter_file`
  CHANGE COLUMN `InsertTimeTimestamp` `InsertTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `parameter_session`
  ADD COLUMN `InsertTimeTimestamp` timestamp NULL DEFAULT NULL AFTER `InsertTime`;

UPDATE `parameter_session`
SET `InsertTimeTimestamp` = FROM_UNIXTIME(`InsertTime`);

ALTER TABLE `parameter_session`
  DROP COLUMN `InsertTime`;

ALTER TABLE `parameter_session`
  CHANGE COLUMN `InsertTimeTimestamp` `InsertTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `parameter_project`
  ADD COLUMN `InsertTimeTimestamp` timestamp NULL DEFAULT NULL AFTER `InsertTime`;

UPDATE `parameter_project`
SET `InsertTimeTimestamp` = FROM_UNIXTIME(`InsertTime`);

ALTER TABLE `parameter_project`
  DROP COLUMN `InsertTime`;

ALTER TABLE `parameter_project`
  CHANGE COLUMN `InsertTimeTimestamp` `InsertTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `physiological_task_event_history`
  MODIFY COLUMN `InsertTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

/*
-- Revert patch

ALTER TABLE `mri_processing_protocol`
  ADD COLUMN `InsertTimeEpoch` int(10) unsigned NOT NULL DEFAULT 0 AFTER `InsertTime`;

UPDATE `mri_processing_protocol`
SET `InsertTimeEpoch` = UNIX_TIMESTAMP(`InsertTime`);

ALTER TABLE `mri_processing_protocol`
  DROP COLUMN `InsertTime`;

ALTER TABLE `mri_processing_protocol`
  CHANGE COLUMN `InsertTimeEpoch` `InsertTime` int(10) unsigned NOT NULL DEFAULT 0;

ALTER TABLE `files`
  ADD COLUMN `InsertTimeEpoch` int(10) unsigned NOT NULL DEFAULT 0 AFTER `InsertTime`;

UPDATE `files`
SET `InsertTimeEpoch` = UNIX_TIMESTAMP(`InsertTime`);

ALTER TABLE `files`
  DROP COLUMN `InsertTime`;

ALTER TABLE `files`
  CHANGE COLUMN `InsertTimeEpoch` `InsertTime` int(10) unsigned NOT NULL DEFAULT 0;

ALTER TABLE `parameter_candidate`
  ADD COLUMN `InsertTimeEpoch` int(10) unsigned NOT NULL DEFAULT 0 AFTER `InsertTime`;

UPDATE `parameter_candidate`
SET `InsertTimeEpoch` = UNIX_TIMESTAMP(`InsertTime`);

ALTER TABLE `parameter_candidate`
  DROP COLUMN `InsertTime`;

ALTER TABLE `parameter_candidate`
  CHANGE COLUMN `InsertTimeEpoch` `InsertTime` int(10) unsigned NOT NULL DEFAULT 0;

ALTER TABLE `parameter_file`
  ADD COLUMN `InsertTimeEpoch` int(10) unsigned NOT NULL DEFAULT 0 AFTER `InsertTime`;

UPDATE `parameter_file`
SET `InsertTimeEpoch` = UNIX_TIMESTAMP(`InsertTime`);

ALTER TABLE `parameter_file`
  DROP COLUMN `InsertTime`;

ALTER TABLE `parameter_file`
  CHANGE COLUMN `InsertTimeEpoch` `InsertTime` int(10) unsigned NOT NULL DEFAULT 0;

ALTER TABLE `parameter_session`
  ADD COLUMN `InsertTimeEpoch` int(10) unsigned NOT NULL DEFAULT 0 AFTER `InsertTime`;

UPDATE `parameter_session`
SET `InsertTimeEpoch` = UNIX_TIMESTAMP(`InsertTime`);

ALTER TABLE `parameter_session`
  DROP COLUMN `InsertTime`;

ALTER TABLE `parameter_session`
  CHANGE COLUMN `InsertTimeEpoch` `InsertTime` int(10) unsigned NOT NULL DEFAULT 0;

ALTER TABLE `parameter_project`
  ADD COLUMN `InsertTimeEpoch` int(10) unsigned NOT NULL DEFAULT 0 AFTER `InsertTime`;

UPDATE `parameter_project`
SET `InsertTimeEpoch` = UNIX_TIMESTAMP(`InsertTime`);

ALTER TABLE `parameter_project`
  DROP COLUMN `InsertTime`;

ALTER TABLE `parameter_project`
  CHANGE COLUMN `InsertTimeEpoch` `InsertTime` int(10) unsigned NOT NULL DEFAULT 0;

ALTER TABLE `physiological_task_event_history`
  MODIFY COLUMN `InsertTime` timestamp NOT NULL;
*/
