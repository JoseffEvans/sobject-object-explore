import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import * as path from 'path';
import * as nunjuks from 'nunjucks';
import { SObjectField } from './sfObjectDefs';
import * as data from './dataController';
import * as db from './database/database';
import * as cli from './sfCli';

class NavParams {
	env?: string;
	sobject?: string;
	field?: string;
	refresh? : boolean;
	back?: boolean;
	forward?: boolean;
}

const extName = "sobject-object-explore";
const dataLogging = true;

export async function activate(context: vscode.ExtensionContext) {
	console.log(`sobejct object explore extension in ${context.extensionPath}`);

	var openCommand = vscode.commands.registerCommand(
		`${extName}-open`, 
		(params: any) => navigate(context, params)
	);

	context.subscriptions.push(openCommand);
}

var currentPanel: vscode.WebviewPanel | undefined; // Upon a second command it reuses the current panel.
var backHistory : NavParams[] = [];
var forwardHistory : NavParams[] = [];

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
		db.setLogging(dataLogging);
		data.setLogging(dataLogging);
		cli.setLogging(dataLogging);

		await db.initDatabase(context);

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

	// Handle navigation back or forward - override the params from the history lists
	if(params.back){
		var currentParams = backHistory.pop(); 

		 // no history means it sould go back to the home page.
		if(backHistory.length == 0){
			backHistory.push({ "env": "" });
			return;
		} 

		if(currentParams) 
			forwardHistory.push(currentParams);

		params = backHistory[backHistory.length - 1]; // override the parameters

		if(params.refresh) 
			params.refresh = false;
	}else if(params.forward){
		if(forwardHistory.length == 0) return;
		params = forwardHistory.pop()!;
		if(params.refresh) params.refresh = false;
		backHistory.push(params);
	}else{ // normal navigation
		forwardHistory = [];
		backHistory.push(params || { "env" : "" });
	}

	// Route based on command params. Set the currentPanel.webview.html
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
		(a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase())
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

	if(!field || !field.name){
		currentPanel!.webview.html = 
			renderNonFatalError(context, env, `Could not find field, ${sobjectName}.${fieldName}. Consider refreshing the object.`);
		return;
	}

	var extraProperties: string[] = []; // TODO populate
	var detailHtml: string = "";

	if(field.type == "formula"){ // check this
		var formula = await data.getFormulaValue(env, sobjectName, fieldName, refresh);
		// create a formula template
	}else if (field.type == "textarea"){
		extraProperties = ["length"];
	}else if(field.type == "boolean"){
		extraProperties = ["defaultValue"];
	}else if(field.type == "picklist"){
		detailHtml = nunjuks.renderString(getHtml(context, "detail_picklist"), {
			values: field.picklistValues
				.sort((a, b) => 
					(+b.defaultValue - +a.defaultValue) || 
					(+b.active - +a.active) || 
					a.label.localeCompare(b.label)
				)
		});
	}else if(field.type == "string"){
		extraProperties = ["length"];
	}

	currentPanel!.webview.html = renderInContainer(context, env, nunjuks.renderString(
		getHtml(context, "fieldBase"),
		{
			env: env,
			obj: sobject,
			field: field,
			navbar: getNavBar(context, env),
			fieldJson: JSON.stringify(field, null, 4),
			properties: renderExtraFieldProperties(field, extraProperties),
			detail: detailHtml
		}
	));
}

function renderExtraFieldProperties(field: SObjectField, propertyNames: string[]): string{
	return propertyNames.map(name => `
		<div class="property-row">
			<span class="property-label">${firstUpper(name)}</span><span class="property-value">${(field as any)[name]}</span>
		</div>
	`).join('\n');
}

function getNavBar(context: vscode.ExtensionContext, env: string){
	return nunjuks.renderString(
		getHtml(context, 'navbar'),
		{
			env: encodeURI(env)
		}
	);
}

function firstUpper(str: string){
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function showError(context: vscode.ExtensionContext, ex: any){
	var msg = JSON.stringify(ex);
	console.log(msg);
	currentPanel!.webview.html = nunjuks.renderString(
		getHtml(context, "error"),
		{error: msg, extPath: context.extensionPath}
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
		return `reference(${field.referenceTo.join(', ')})`;
	else return field.type;
}

function log(msg: string){
	console.log(msg);
}

function paramDesc(params: NavParams): string{
	return `Back: ${params.back}; Forward: ${params.forward}; Env: ${params.env}; Object: ${params.sobject}; Field: ${params.field};`;
}

function renderNonFatalError(context: vscode.ExtensionContext, env: string, msg: string){
	return renderInContainer(context, env, `<h1>${msg}</h1>`);
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
