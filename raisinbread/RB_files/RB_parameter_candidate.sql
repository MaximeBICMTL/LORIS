SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE `parameter_candidate`;
LOCK TABLES `parameter_candidate` WRITE;
INSERT INTO `parameter_candidate` (`ParameterCandidateID`, `CandidateID`, `ParameterTypeID`, `Value`, `InsertTime`) VALUES (1,1004,2,'comment',FROM_UNIXTIME(1472831173));
INSERT INTO `parameter_candidate` (`ParameterCandidateID`, `CandidateID`, `ParameterTypeID`, `Value`, `InsertTime`) VALUES (2,1004,3,'plan1',FROM_UNIXTIME(1472831173));
INSERT INTO `parameter_candidate` (`ParameterCandidateID`, `CandidateID`, `ParameterTypeID`, `Value`, `InsertTime`) VALUES (3,166,3,'as',FROM_UNIXTIME(1475874024));
INSERT INTO `parameter_candidate` (`ParameterCandidateID`, `CandidateID`, `ParameterTypeID`, `Value`, `InsertTime`) VALUES (4,166,4,'plan2',FROM_UNIXTIME(1475874024));
UNLOCK TABLES;
SET FOREIGN_KEY_CHECKS=1;
