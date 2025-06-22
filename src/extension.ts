import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import * as path from 'path';
import * as nunjuks from 'nunjucks';
import { SObjectField } from './sfObjectDefs';
import * as data from './dataController'
import * as db from './database'

class NavParams {
	env?: string
	sobject?: string
	field?: string
	refresh? : boolean
	back?: boolean
	forward?: boolean
}

const extName = "sobject-object-explore"

var currentPanel: vscode.WebviewPanel | undefined;

export async function activate(context: vscode.ExtensionContext) {
	console.log(`sobejct object explore extension in ${context.extensionPath}`)

	var openCommand = vscode.commands.registerCommand(
		`${extName}-open`, 
		(params: any) => navigate(context, params)
	);

	context.subscriptions.push(openCommand);
}

var back : NavParams[] = []
var forward : NavParams[] = []

/**
 * The pages shown by this extension are rendered on the server
 * Navigation is handled by re-executing the command with different parameters
 * 
 * Examples:
 * params { "env": "live", "sobject": "case", "field": "id" } opens the case id field page, on the live alias
 * params { "back": true } returns to the prev page 
 * params {} opens the home page
 * params {"env": "test", "sobject": "task", "refresh": true } refresh the task object using the SF CLI
 */
async function navigate(
	context: vscode.ExtensionContext,
	params?: NavParams
){
	if(!currentPanel){
		await db.initDatabase(context, false);
		data.setLogging(false);

		currentPanel = vscode.window.createWebviewPanel(
			extName,
			extName,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				enableCommandUris: true,
				retainContextWhenHidden: true			
			}
		);

		currentPanel.onDidDispose(e => {currentPanel = undefined});
	} 

	if(!params) params = {};
	if(!params.refresh) params.refresh = false;

	log(`Opening sobject explore with params: ${paramDesc(params)}`);
	// log(`BackList Before: \n${back.map(b => paramDesc(b)).join(`\n`)}`);

	// handle navigation back or forward - override the params from the history lists

	if(params.back){
		var last = back.pop();
		if(back.length == 0){
			back.push({ "env": "" });
			return;
		} 
		if(last) forward.push(last);
		params = back[back.length - 1];
		if(params.refresh) params.refresh = false;
	}else if(params.forward){
		if(forward.length == 0){
			return;
		}
		params = forward.pop()!;
		if(params.refresh) params.refresh = false;
		back.push(params);
	}else{
		forward = [];
		back.push(params || { "env" : "" });
	}

	// log(`BackList After: \n${back.map(b => paramDesc(b)).join(`\n`)}`);

	try{
		if(!(params?.env)){
			if(params?.refresh) 
				console.log("environment refresh");
			showLoading(context, `Loading alias list.`);
			await showEnvironmentSelect(context, params.refresh!);
		}else if (params.sobject && params.field){
			showLoading(context, `Loading field ${params.sobject}.${params.field}`);
			await showField(context, params.env, params.sobject, params.field, params.refresh!);
		}else if(params.sobject){
			showLoading(context, `Loading object ${params.sobject}`);
			await getSObject(context, params.env, params.sobject, params.refresh!);
		}else{
			showLoading(context, `Loading environment ${params.env}`);
			await showEnvironment(context, params.env, params.refresh!);
		}
	}catch(ex){
		showError(context, ex);
	}
};

async function showEnvironmentSelect(
	context: vscode.ExtensionContext, 
	refresh: boolean
){
	currentPanel!.webview.html = renderInContainer(context, "", nunjuks.renderString( 
		getHtml(context, 'selectEnvironment'),
		{ 
			alias: await data.getAlias(refresh),
			navbar: getNavBar(context, "")
		}
	));
}

async function showEnvironment(context: vscode.ExtensionContext, env: string, refresh: boolean){
	var objectNames = (await data.getEnvData(env, refresh)).objects.map(obj => obj.name);
	currentPanel!.webview.html = renderInContainer(context, env, nunjuks.renderString(
		getHtml(context, "environmentIndex"),
		{ 
			env: env, 
			names: objectNames,
			navbar: getNavBar(context, env)
		} 
	));
}

async function getSObject(
	context: vscode.ExtensionContext, 
	env: string, 
	sObject: string,
	refresh: boolean
) {
	var object = await data.getSObject(env, sObject, refresh);
	object.fields = object.fields.sort(
		(a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())
	);
	currentPanel!.webview.html = renderInContainer(context, env, nunjuks.renderString(
		getHtml(context, "object"),
		{
			env: env,
			obj: object,
			paddingData: {
				name: findMaxLength(object.fields.map(field => field.name)),
				label: findMaxLength(object.fields.map(field => field.label))
			},
			types: Object.fromEntries(object.fields.map(field => [field.name, getTypeShortDesc(field)])),
			navbar: getNavBar(context, env)
		}
	));
}

async function showField(
	context: vscode.ExtensionContext,
	env: string, 
	sobjectName: string,
	fieldName: string,
	refresh: boolean
) {
	var sobject = await data.getSObject(env, sobjectName, false);
	var field = sobject.fields.find(f => f.name == fieldName);

	if(!field) throw Error(`Could not found field ${sobjectName}.${fieldName}`);

	currentPanel!.webview.html = renderInContainer(context, env, nunjuks.renderString(
		getFieldTemplateHtml(context, field.type),
		{
			obj: sobject,
			field: field,
			navbar: getNavBar(context, env),
			fieldJson: JSON.stringify(field, null, 4)
		}
	));
}

function getFieldTemplateHtml(context: vscode.ExtensionContext, type: string){
	return getHtml(context, "fieldDefault");
}

function getNavBar(context: vscode.ExtensionContext, env: string){
	return nunjuks.renderString(
		getHtml(context, 'navbar'),
		{
			env: encodeURI(env)
		}
	);
}

function showError(context: vscode.ExtensionContext, ex: any){
	var msg = JSON.stringify(ex);
	console.log(msg);
	currentPanel!.webview.html = nunjuks.renderString(
		getHtml(context, "error"),
		{error: msg}
	);
}

function showLoading(context: vscode.ExtensionContext, msg: string){
	currentPanel!.webview.html = nunjuks.renderString(
		getHtml(context, 'loading'),
		{msg: msg}
	);
}

function getHtml(context: vscode.ExtensionContext, name: string){
	return readFileSync(
		path.join(context.extensionPath, 'src', 'html', `${name}.html`),
		'utf8'	
	);
}

function getCss(context: vscode.ExtensionContext, name: string){
	return readFileSync(
		path.join(context.extensionPath, 'src', 'css', `${name}.css`),
		'utf8'	
	);
}

function findMaxLength(strings: String[]) : number{
	return Math.max(...strings.map(string => string.length));
}

function getTypeShortDesc(field: SObjectField){
	if(field.type == "reference" && field.referenceTo)
		return `reference(${field.referenceTo.join(', ')})`
	else return field.type;
}

function log(msg: string){
	console.log(msg);
}

function paramDesc(params: NavParams): string{
	return `Back: ${params.back}; Forward: ${params.forward}; Env: ${params.env}; Object: ${params.sobject}; Field: ${params.field};`
}

function renderInContainer(
	context: vscode.ExtensionContext, 
	env: string,
	content: string
){
	return nunjuks.renderString(getHtml(context, "container"), { 
		content: content,
		navbar: getNavBar(context, env),
		css: getCss(context, "styles")
	});
}

export function deactivate() {}
