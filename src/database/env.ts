import { EnvData } from '../internalSfDataModels';
import {log, runAsync, allAsync} from './database';

export async function getEnvId(envName: string): Promise<number>{
    var envIds = (await allAsync(`SELECT id FROM environments WHERE name = ?`, [envName]));
    if(!envIds || envIds.length == 0 || !envIds[0].id)
        throw Error(`Environment with name ${envName} is missing from the database`);
    return envIds[0].id;
}

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