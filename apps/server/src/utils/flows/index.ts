import { CreateStepConfigDTO } from '@repo/dtos';
import { Flow } from '../../entities';
import { errors } from 'src/errors';

function isSubarray(mainArray: unknown[], subArray: unknown[]) {
    let subArrayIndex = 0;

    for (let i = 0; i < mainArray.length; i++) {
        if (mainArray[i] === subArray[subArrayIndex]) {
            subArrayIndex++;
        }
        if (subArrayIndex === subArray.length) {
            return true;
        }
    }

    return false;
}

function noOverlap(array1: unknown[], array2: unknown[]) {
    const set1 = new Set(array1);

    for (const element of array2) {
        if (set1.has(element)) {
            return false;
        }
    }

    return true;
}

function validateFormData(
    body: CreateStepConfigDTO,
    flow: Flow,
    type: 'user' | 'issuer',
) {
    const templateFields =
        type === 'user'
            ? flow.template.customFields
            : flow.template.issuerFields;
    const templateFieldIds = templateFields.map((i) => i.id);

    const existingFieldsInSteps = flow.steps
        .map((e) => {
            if (['userForm', 'issuerForm'].includes(e.type)) {
                return e.config.fields;
            }
            return null;
        })
        .flat();

    console.log(templateFieldIds);

    let error = null;
    const isFieldsConfigSubArray = isSubarray(
        templateFieldIds,
        body.config.fields,
    );
    if (!isFieldsConfigSubArray)
        error =
            type === 'issuer'
                ? errors.flows.FIELDS_AND_TEMPLATE_MISMATCH_ISSUER
                : errors.flows.FIELDS_AND_TEMPLATE_MISMATCH_USER;

    const fieldDoesNotExistInAnotherStep = noOverlap(
        existingFieldsInSteps,
        body.config.fields,
    );
    if (!fieldDoesNotExistInAnotherStep)
        error = errors.flows.FIELDS_EXIST_IN_PREVIOUS_STEP;
    return { error };
}

function validateApiStepData(body: CreateStepConfigDTO) {
    const success = /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(body.config.url);
    if (success) {
        return { error: null };
    } else {
        return { error: 'URL must be a http or https endpoint' };
    }
}

function validateRedirectUri(body: CreateStepConfigDTO) {
    const success = /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(body.config.url);
    if (success) {
        return { error: null };
    } else {
        return { error: 'URL must be a http or https endpoint' };
    }
}

function validateTemplatesData(body: CreateStepConfigDTO) {
    const success = body.config.templates.length > 0;
    if (success) {
        return { error: null };
    } else {
        return { error: 'Templates must be defined' };
    }
}

function validateKycConfig(body: CreateStepConfigDTO) {
    const success = ['basic', 'aml'].includes(body.config.kycLevel);
    return { error: success ? null : 'kycLevel must be `basic` or `aml`' };
}

export function validateFormStepConfig(body: CreateStepConfigDTO, flow: Flow) {
    switch (body.type) {
        case 'issuerForm':
            return validateFormData(body, flow, 'issuer');
        case 'userForm':
            return validateFormData(body, flow, 'user');
        case 'presentation':
            return validateTemplatesData(body);
        case 'review':
            return { error: null };
        case 'apiStep':
            return validateApiStepData(body);
        case 'authorize':
            return validateRedirectUri(body);
        case 'kyc':
            return validateKycConfig(body);
        case 'finish':
            return { error: null };
        case 'didLogin':
            return { error: null };
    }
}
