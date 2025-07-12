import path from "path";
import { Database } from "sqlite3";
import * as vscode from 'vscode';

export * as alias from './alias';
export * as env from './env';
export * as sobject from './sobject';
export * as formula from './formula';

var database: Database | undefined;
var dbLog: boolean = false;

export function setLogging(toggle: boolean){
    dbLog = toggle;
}

export async function initDatabase(context: vscode.ExtensionContext, overrideDbPath: string | null = null){
    var dbpath = !overrideDbPath 
        ? path.join(context.extensionPath, 'envdata.sqlite')
        : overrideDbPath;
    
    log(`Creating database if not exisits at ${dbpath}`);
    database = new Database(dbpath);

    log(`Creating environments table`);
    await runAsync(`CREATE TABLE IF NOT EXISTS environments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT   
    )`);

    log(`Creating sobjects table`);
    await runAsync(`CREATE TABLE IF NOT EXISTS sobjects(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        envId INTEGER,
        name TEXT,
        data TEXT
    )`);

    log(`Creating formula table`);
    await runAsync(`CREATE TABLE IF NOT EXISTS formulas(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sobjectId INTEGER,
        fieldName TEXT,
        value TEXT
    )`);
}

export function checkInit(){
    if(!database) throw Error('envdata.sqlite database not initialised');
}

export function allAsync(sql: string, params: any[] = []): Promise<any[]> {
    checkInit();
    return new Promise((resolve, reject) => {
        database!.all(sql, params, (err, rows) => {
            if(err) reject(err);
            else resolve(rows);
        });
    });
}

export async function runAsync(sql: string, params: any[] = []){
    checkInit();
    await new Promise((resolve, reject) => {
        database!.run(sql, params, (err) => {
            if(err) reject(err);
            else resolve(null);
        });
    });
}

export function log(msg: string){
    if(dbLog)
        console.log(`Database Log: ${msg}`);
}

