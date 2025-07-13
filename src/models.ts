export class SObjectNameData{
    name!: string;
}

export class EnvData{ 
    env!: string;
    objects!: SObjectNameData[];
}


export class SObjectChildRelationship {
    cascadeDelete!: boolean;
    childSObject!: string;
    deprecatedAndHidden!: boolean;
    field!: string;
    junctionIdListNames!: any[];
    junctionReferenceTo!: any[];
    relationshipName!: string;
    restrictedDelete!: boolean;
}

export class SObjectFieldPicklistOption {
    active!: boolean;
    defaultValue!: boolean;
    label!: string;
    validFor!: any;
    value!: string;
}

export class SObjectField {
    // Boolean properties
    aggregatable!: boolean;
    aiPredictionField!: boolean;
    autoNumber!: boolean;
    calculated!: boolean;
    cascadeDelete!: boolean;
    caseSensitive!: boolean;
    createable!: boolean;
    custom!: boolean;
    defaultedOnCreate!: boolean;
    dependentPicklist!: boolean;
    deprecatedAndHidden!: boolean;
    displayLocationInDecimal!: boolean;
    encrypted!: boolean;
    externalId!: boolean;
    filterable!: boolean;
    formulaTreatNullNumberAsZero!: boolean;
    groupable!: boolean;
    highScaleNumber!: boolean;
    htmlFormatted!: boolean;
    idLookup!: boolean;
    nameField!: boolean;
    namePointing!: boolean;
    nillable!: boolean;
    permissionable!: boolean;
    polymorphicForeignKey!: boolean;
    queryByDistance!: boolean;
    restrictedDelete!: boolean;
    restrictedPicklist!: boolean;
    searchPrefilterable!: boolean;
    sortable!: boolean;
    unique!: boolean;
    updateable!: boolean;
    writeRequiresMasterRead!: boolean;

    // Number properties
    byteLength!: number;
    digits!: number;
    length!: number;
    precision!: number;
    scale!: number;

    // String properties
    calculatedFormula!: string;
    compoundFieldName!: string;
    controllerName!: string;
    defaultValueFormula!: string;
    inlineHelpText!: string;
    label!: string;
    name!: string;
    referenceTargetField!: string;
    relationshipName!: string;
    soapType!: string;
    type!: string;

    // Other types
    defaultValue!: any;
    extraTypeInfo!: any;
    mask!: any;
    maskType!: any;
    picklistValues!: SObjectFieldPicklistOption[];
    referenceTo!: any[];
    relationshipOrder!: any;
}

export class SObjectRecordTypeInfoUrl {
    layout!: string;
}

export class SObjectRecordTypeInfo {
    active!: boolean;
    available!: boolean;
    defaultRecordTypeMapping!: boolean;
    developerName!: string;
    master!: boolean;
    name!: string;
    recordTypeId!: string;
    urls!: SObjectRecordTypeInfoUrl[];
}

export class SObjectScope {
    label!: string;
    name!: string;
}

export class SObjectUrlThing {
    rowTemplate!: string;
    approvalLayouts!: string;
    uiDetailTemplate!: string;
    quickActions!: string;
    layouts!: string;
    compactLayouts!: string;
    uiEditTemplate!: string;
    caseArticleSuggestions!: string;
    caseRowArticleSuggestions!: string;
    listviews!: string;
    describe!: string;
    uiNewRecord!: string;
    sobject!: string;
}

export class SObject {
    name!: string;
    activateable!: boolean;
    associateEntityType!: any;
    associateParentEntity!: any;
    compactLayoutable!: boolean;
    createable!: boolean;
    custom!: boolean;
    customSetting!: boolean;
    deepCloneable!: boolean;
    deletable!: boolean;
    deprecatedAndHidden!: boolean;
    feedEnabled!: boolean;
    defaultImplementation!: any;
    extendedBy!: any;
    hasSubtypes!: boolean;
    implementedBy!: any;
    implementsInterfaces!: any;
    isInterface!: boolean;
    isSubtype!: boolean;
    keyPrefix!: string;
    label!: string;
    labelPlural!: string;
    layoutable!: boolean;
    listviewable!: any;
    lookupLayoutable!: any;
    mergeable!: boolean;
    mruEnabled!: boolean;
    namedLayoutInfos!: any[];
    networkScopeFieldName!: any;
    queryable!: boolean;
    replicateable!: boolean;
    retrieveable!: boolean;
    searchLayoutable!: boolean;
    searchable!: boolean;
    sobjectDescribeOption!: string;
    triggerable!: boolean;
    undeletable!: boolean;
    updateable!: boolean;
    urls!: SObjectUrlThing;
    recordTypeInfos!: SObjectRecordTypeInfo[];
    childRelationships!: SObjectChildRelationship[];
    fields!: SObjectField[];
}

// TODO implement from real command
export class FormulaData{
    value!: string;
}