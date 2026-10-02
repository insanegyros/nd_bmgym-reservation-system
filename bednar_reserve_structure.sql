/*
 Navicat MySQL Dump SQL

 Source Server         : Jandy.cz
 Source Server Type    : MariaDB
 Source Server Version : 101106 (10.11.6-MariaDB-0+deb12u1)
 Source Host           : jandy.cz:3306
 Source Schema         : bednar_reserve

 Target Server Type    : MariaDB
 Target Server Version : 101106 (10.11.6-MariaDB-0+deb12u1)
 File Encoding         : 65001

 Date: 30/09/2025 15:09:30
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for RESERVATION
-- ----------------------------
DROP TABLE IF EXISTS `RESERVATION`;
CREATE TABLE `RESERVATION`  (
  `R_ID` int(11) NOT NULL AUTO_INCREMENT,
  `R_T_ID` int(11) NOT NULL,
  `R_UUID` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `R_EMAIL` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `R_FNAME` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `R_LNAME` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `R_ISSUB` int(11) NOT NULL DEFAULT 0,
  `R_CANCELLED` int(11) NOT NULL DEFAULT 0,
  `R_CONFIRMED` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`R_ID`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for TRAINING
-- ----------------------------
DROP TABLE IF EXISTS `TRAINING`;
CREATE TABLE `TRAINING`  (
  `T_ID` int(11) NOT NULL AUTO_INCREMENT,
  `T_NAME` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `T_COLOR` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `T_BGCOLOR` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `T_DATE` date NOT NULL,
  `T_HOUR` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `T_REMARK` tinytext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `T_MAXMEM` int(255) NOT NULL,
  `T_MAXSUB` int(255) NOT NULL,
  `T_CANCELLED` int(11) NULL DEFAULT 0,
  PRIMARY KEY (`T_ID`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
