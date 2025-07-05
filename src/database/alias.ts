import {log, runAsync, allAsync} from './database'

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
