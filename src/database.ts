import path from "path";
import { Database } from "sqlite3";
import * as vscode from 'vscode';
import { EnvData } from './internalSfDataModels'
import { SObject } from "./sfObjectDefs";

var database: Database | undefined;
var dbLog: boolean = false;

// init //

export async function initDatabase(context: vscode.ExtensionContext, enableLog: boolean = false){
    dbLog = enableLog;

    var dbpath = path.join(context.extensionPath, 'envdata.sqlite');
    log(`Creating database if not exisits at ${dbpath}`)
    database = new Database(dbpath);

    await runAsync(`CREATE TABLE IF NOT EXISTS environments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT   
    )`);

    await runAsync(`CREATE TABLE IF NOT EXISTS sobjects(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        envId INTEGER,
        name TEXT,
        data TEXT
    )`);
}

// alias //

export async function setAlias(alias: string[]){
    log('Deleting environments');
    await runAsync(`DELETE FROM environments`);

    log('Deleteing SObjects');
    await runAsync(`DELETE FROM sobjects`);

    log(`Creating environments: ${JSON.stringify(alias)}`);
    for(var a of alias)
        await runAsync(`INSERT INTO environments (name) VALUES (?)`, [a]);
}

export async function getAlias(): Promise<string[]>{
    return (await allAsync(`SELECT name FROM environments`)).map(env => env.name);
}

// env data //

export async function setEnvData(data: EnvData){
    var envId = await getEnvId(data.env);

    log(`Deleting objects for env ${data.env}, id: ${envId}`);
    await runAsync(`
        DELETE
        FROM sobjects
        WHERE envId = ?;
    `, [envId]);

    log(`Adding ${data.objects.length} sobjects for env ${data.env}(${envId})`);
    for(var obj of data.objects){
        await runAsync(`
            INSERT INTO sobjects (envId, name) VALUES (?, ?)    
        `, [envId, obj.name]);
    }
}


export async function getEnvData(env: string): Promise<EnvData>{
    log(`Getting environment data for ${env}`);

    var sobjectNameData = await allAsync(`
        SELECT 
            sobjects.name as name
        FROM sobjects
        JOIN environments ON environments.id = sobjects.envId
        WHERE environments.name = ?
    `, [env]);

    log(`Found ${sobjectNameData.length} sobject names in env ${env}`);

    return {
        env: env,
        objects: sobjectNameData 
    };
}

// sobject data //

export async function setSObjectData(env: string, sobject: string, data: SObject){
    log(`Setting data for ${sobject} in ${env}`);
    await runAsync(`
        UPDATE sobjects
        SET data = ?
        WHERE name = ?
            AND envId in (SELECT id FROM environments WHERE name = ?)
    `, [JSON.stringify(data), sobject, env]);
}

export async function getSObjectData(env: string, sobject: string): Promise<SObject | null>{

    var data = await allAsync(`
        SELECT data
        FROM sobjects
        WHERE name = ?
            AND envId IN (SELECT id FROM environments WHERE name = ?)
    `, [sobject, env]);

    if(!data){
        log(`${env} data for ${sobject} was falsy: ${JSON.stringify(data)}`);
        return null;
    } 
    
    log(`Data retrived for ${sobject} in ${env}`);
    return JSON.parse(data[0].data);
}

// private //

function checkInit(){
    if(!database) throw Error('envdata.sqlite database not initialised');
}

function allAsync(sql: string, params: any[] = []): Promise<any[]> {
    checkInit();
    return new Promise((resolve, reject) => {
        database!.all(sql, params, (err, rows) => {
            if(err) reject(err);
            else resolve(rows);
        })
    });
}

async function runAsync(sql: string, params: any[] = []){
    checkInit();
    await new Promise((resolve, reject) => {
        database!.run(sql, params, (err) => {
            if(err) reject(err);
            else resolve(null);
        })
    });
}

async function getEnvId(envName: string): Promise<number>{
    var envIds = (await allAsync(`SELECT id FROM environments WHERE name = ?`, [envName]));
    if(!envIds || envIds.length == 0 || !envIds[0].id)
        throw Error(`Environment with name ${envName} is missing from the database`);
    return envIds[0].id;
}

function log(msg: string){
    if(dbLog)
        console.log(`Database Log: ${msg}`);
}

