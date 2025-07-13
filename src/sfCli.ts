import { exec } from 'child_process';
import { promisify } from 'util';
import { SObject } from './models';

const execAsync = promisify(exec);
const baseCmd = 'sf';

var logging = false;

class CLIResposne{
    result?: any;
    name?: string;
    message?: string;
}

export class AliasResult{
    alias!: string;
    value!: string;
}

export function setLogging(toggle: boolean){
    logging = toggle;
}

export async function getAlias(): Promise<AliasResult[]>{
    return await execCli(`${baseCmd} alias list --json`);
}

export async function getSObjectNames(env: string): Promise<string[]>{
    return await execCli(`${baseCmd} sobject list -o ${sanitize(env)} --json`);
}

export async function getSObject(env: string, name: string): Promise<SObject>{
    return await execCli(`${baseCmd} sobject describe --sobject ${sanitize(name)} --target-org ${sanitize(env)} --json`);
}

export async function execCli(cmd: string): Promise<any>{
    try {
        log(`Executing ${cmd}`);
        
        const { stdout } = await execAsync(cmd, {maxBuffer: 1024 * 1024 * 5});
        const res = JSON.parse(stdout);
        
        if(res.result){
            return res.result;
        }else{
            handleError(cmd, res);
        }
        
    } catch (error) {
        log(`Error when running ${cmd}, ${error}`);
        throw error;
    }
}

function log(msg: string){
    if(logging) console.log(msg);
}

function sanitize(param: string){
    return param.replace(/[^a-zA-Z0-9_-]/g, '');
}

function handleError(cmd: string, res: CLIResposne): never {
    var error = `The command '${cmd}' resulted in (${res.name})${res.message}`;
    log(error);
    throw new Error(error);
}