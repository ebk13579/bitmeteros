/*
 * BitMeterOS v0.1.5
 * http://codebox.org.uk/bitmeterOS
 *
 * Copyright (c) 2009 Rob Dawson
 *
 * Licensed under the GNU General Public License
 * http://www.gnu.org/licenses/gpl.txt
 *
 * This file is part of BitMeterOS.
 *
 * BitMeterOS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * BitMeterOS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with BitMeterOS.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Build Date: Mon, 26 Oct 2009 15:16:39 +0000
 */

#ifndef COMMON_H
#define COMMON_H

#include <sqlite3.h>
#include <stddef.h>
#include <time.h>

#define VERSION "0.1.5"
#define DB_NAME      "bitmeter.db"
#define LOG_NAME     "bitmeter.log"
#define OUT_DIR      "BitMeterOS"
#define IN_MEMORY_DB ":memory:"
#define ENV_DB       "BITMETER_DB"
#define ENV_LOG      "BITMETER_LOG"
// ----
#define LOG_INFO 1
#define LOG_WARN 2
#define LOG_ERR  3
// ----
#define SECS_PER_MIN    60
#define SECS_PER_HOUR   60 * 60
#define MAX_PATH_LEN    256
// ----
#if defined(__APPLE__) || defined(_WIN32)
#define strdupa(s) strcpy(alloca(strlen(s)+1), s)
#endif
// ----
// These are very important, used everywhere
#define TRUE  1
#define FALSE 0

#define SUCCESS 1
#define FAIL    0

typedef unsigned long long BW_INT;

struct Data{
	time_t ts;
	int    dr;
	BW_INT dl;
	BW_INT ul;
	char*  ad;
	struct Data* next;
};
// ----
void prepareSql(sqlite3_stmt**, const char*);
sqlite3* openDb();
void prepareDb();
struct Data* runSelect(sqlite3_stmt *stmt);
void runSelectAndCallback(sqlite3_stmt *stmt, void (*callback)(struct Data*));
void beginTrans();
void commitTrans();
void rollbackTrans();
const char* getDbError();
void setDbBusyWait(int);
void closeDb();
int getConfigInt(const char* key);
int getDbVersion();
// ----
struct Data* allocData();
struct Data makeData();
void freeData(struct Data* );
void appendData(struct Data** , struct Data* );
void setAddress(struct Data* data, const char* addr);
// ----
void doSleep(int interval);
void getDbPath(char* path);
void getLogPath(char* path);
// ----
void setLogToFile(int );
void setLogLevel(int);
void logMsg(int level, char* msg, ...);
// ----
void formatAmount(const BW_INT amount, const int binary, const int abbrev, char* txt);
void toTime(char* timeText, time_t ts);
void toDate(char* dateText, time_t ts);
void makeHexString(char* hexString, char* data, int dataLen);
// ----
time_t getTime();
time_t getCurrentYearForTs(time_t ts);
time_t getCurrentMonthForTs(time_t ts);
time_t getCurrentDayForTs(time_t ts);
time_t getNextYearForTs(time_t ts);
time_t getNextMonthForTs(time_t ts);
time_t getNextDayForTs(time_t ts);
time_t getNextHourForTs(time_t ts);
time_t getNextMinForTs(time_t ts);
time_t getYearFromTs(time_t ts);
time_t addToDate(time_t ts, char unit, int num);
// ----
#ifdef _WIN32
#define EOL "\r\n"
#endif

#ifdef __linux__
#define EOL "\n"
#endif

#ifdef __APPLE__
#define EOL "\n"
#endif

#endif //#ifndef COMMON_H