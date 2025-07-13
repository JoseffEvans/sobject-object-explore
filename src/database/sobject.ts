import {log, runAsync, allAsync} from './database';
import {SObject} from '../models';

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

export async function getSObjectId(env: string, sobject: string): Promise<number | null>{
    var data = await allAsync(`
        SELECT id
        FROM sobjects
        WHERE name = ?
            AND envId IN (
                SELECT id
                FROM environments
                WHERE name = ?
            )    
    `, [sobject, env]);

    if(!data){
        log(`Unable to find sobject id for ${env}.${sobject}`);
        return null;
    }

    log(`Found sobject id ${env}.${sobject} = ${data[0]}`);
    return data[0];
} 