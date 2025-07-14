import * as cli from './sfCli';
import { EnvData } from './models';
import { SObject } from './models';

import * as db from './database/database';

var loggingEnabled: boolean = false;

export function setLogging(enabled: boolean){
    loggingEnabled = enabled;
}

export async function getAlias(refresh: Boolean): Promise<string[]>{
    var aliasList: string[] | undefined = undefined;

    log(`Get alias called with refresh: ${refresh}`);

    if(!refresh){
        aliasList = await db.alias.getAlias();
    }

    if(refresh || !aliasList || aliasList.length == 0){
        log(`Refreshing alias from CLI`);
        aliasList = (await cli.getAlias()).map(item => item.alias);
        if(aliasList)
            await db.alias.setAlias(aliasList);
        else
            log(`Did not find any alias from CLI`);
    }

    return aliasList;
}

export async function getEnvData(envName: string, refresh: boolean): Promise<EnvData>{
    var data: EnvData | undefined = undefined;

    log(`Getting data for environment ${envName} with refresh: ${refresh}`);
    
    if(!refresh){
        data = await db.env.getEnvData(envName);
    }
    if(refresh || !data || !data.objects || data.objects.length == 0){
        log(`Refreshing env data for ${envName} from cli`);
        var objectNames = await cli.getSObjectNames(envName);
        data = {
            env: envName,
            objects: objectNames.map(name => ({ name: name }))
        };
        db.env.setEnvData(data);
    }

    return data;
}

export async function getSObject(env: string, sobject: string, refresh: boolean): Promise<SObject>{
    var data: SObject | undefined | null = undefined;

    log(`Getting data for environment ${env}, object ${sobject} with refresh ${refresh}`);

    if(!refresh){
        data = await db.sobject.getSObjectData(env, sobject);
    } 
    if(refresh || !data){
        log(`Refreshing sobject def from cli for sobject ${sobject} in env ${env}`);
        data = await cli.getSObject(env, sobject);
        if(!data) throw Error(`Data controller failed when trying to get sobject ${sobject} in env ${env}`);
        await db.sobject.setSObjectData(env, sobject, data);
    }

    return data;
}

function log(msg: string){
    if(loggingEnabled) console.log(`Data controller: ${msg}`);
}