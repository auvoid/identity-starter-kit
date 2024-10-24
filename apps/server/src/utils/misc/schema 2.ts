import { Template } from 'src/entities';

export function convertTemplateToSchema(t: Template) {
    const baseTemplate: Record<string, any> = {
        $id: new URL(
            '/directory/templates/' + t.id,
            process.env.PUBLIC_BASE_URI,
        ).toString(),
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        title: t.name,
        description: t.description,
        type: 'object',
        properties: {
            credentialSubject: {
                type: 'object',
            },
        },
    };

    const properties: Record<string, unknown> = {};
    for (const field of Object.keys(t.prefilledFields)) {
        properties[field] = {
            type: 'string',
            value: t.prefilledFields[field],
        };
    }
    const dynamicFields = t.issuerFields.concat(t.customFields);
    const required = [];
    const typesMap = {
        email: {
            type: 'string',
            format: 'email',
        },
        text: {
            type: 'string',
        },
        date: {
            type: 'string',
            format: 'date',
        },
        datetime: {
            type: 'string',
            format: 'date-time',
        },
        number: {
            type: 'number',
        },
        url: {
            type: 'string',
            format: 'uri',
        },
        phone: {
            type: 'string',
        },
        boolean: {
            type: 'boolean',
        },
    };

    for (const field of dynamicFields) {
        properties[field.fieldName] = typesMap[field.fieldType];
        if (field.required) required.push(field.fieldName);
    }
    baseTemplate.properties.credentialSubject.properties = properties;
    baseTemplate.properties.credentialSubject.required = required;

    return baseTemplate;
}
