import { getSObjectId } from "./sobject";
import { log, runAsync, allAsync } from './database';
import { FormulaData } from "../sfObjectDefs";

export async function setFormulaData(env: string, sobject: string, field: string, value: string){
    var sobjectId = await getSObjectId(env, sobject);

    if(!sobjectId) 
        throw Error(`Unable to find sobject for ${env}.${sobject} when it should exisit`);

    await runAsync(`
        INSERT OR REPLACE INTO formulas (sobjectId, fieldName, value)
        VALUES (?, ?, ?)    
    `, [sobjectId, field, value]);
   log(`Formula data updated for ${env}.${sobject}.${field}`);
}

export async function getFormulaData(env: string, sobject: string, field: string): Promise<string | null>{
    var data = await allAsync(`
        SELECT value
        FROM formulas
            WHERE 
                fieldName = ?
                AND sobjectId IN (
                    SELECT id
                    FROM sobjects
                    WHERE envId IN (SELECT id FROM environments WHERE name = ?)
                        AND name = ? 
                )
    `, [field, env, sobject]);

    if(!data){
        log(`Unable to find formula for ${env}.${sobject}.${field}`);
        return null;
    }

    log(`Formula data for ${env}.${sobject}.${field} retrived from database`);
    return data[0];
}