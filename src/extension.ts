import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import * as path from 'path';
import * as nunjuks from 'nunjucks';
import {
	getAlias
} from './data';

const extName = "sobject-object-explore"

let currentPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
	var openCommand = vscode.commands.registerCommand(
		`${extName}-open`, 
		((params?: {
			env?: string
			sobject?: string,
			field?: string,
			refresh? : boolean
		}) => {
			console.log("hit");
			if(!currentPanel) currentPanel = vscode.window.createWebviewPanel(
				extName,
				extName,
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					enableCommandUris: true,
					retainContextWhenHidden: true			
				}
			);

			var html: string | null = null;

			if(!(params?.env)){
				if(params?.refresh) 
					console.log("environment refresh");
				html = getEnvironmentSelect(context);
			}else if (params.sobject && params.field){
				html = getField(context, params.env, params.sobject, params.field);
			}else if(params.sobject){
				html = getSObject(context, params.env, params.sobject);
			}else{
				html = getEnvironment(context, params.env);
			}

			currentPanel.webview.html = html;
	}));

	context.subscriptions.push(openCommand);
}

function getEnvironmentSelect(context: vscode.ExtensionContext) : string{
	return nunjuks.renderString( 
		getHtml(context, 'selectEnvironment'),
		{ alias: getAlias() }
	);
}

function getEnvironment(context: vscode.ExtensionContext, env: string) : string{
	return nunjuks.renderString(
		getHtml(context, "environmentIndex"),
		{ env: env } 
	);
}

function getSObject(
	context: vscode.ExtensionContext, 
	env: string, 
	sObject: string
) : string{
	throw Error("Not Implemented");
}

function getField(
	context: vscode.ExtensionContext,
	env: string, 
	sObject: string,
	field: string
) : string {
	throw Error("not implemented");
}





function getHtml(context: vscode.ExtensionContext, name: string){
	return readFileSync(
		path.join(context.extensionPath, 'src', 'html', `${name}.html`),
		'utf8'	
	);
}

export function deactivate() {}
