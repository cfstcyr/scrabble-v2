const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 30;
const MIN_DESCRIPTION_LENGTH = 1;
const MAX_DESCRIPTION_LENGTH = 80;
const VALIDATION_RULE = "^([0-9A-Za-zÀ-ÖØ-öø-ÿ]+[ '\\-_]{0,1})*$";

export const DICTIONARY_NAME_VALIDATION = {
    minLength: MIN_NAME_LENGTH,
    maxLength: MAX_NAME_LENGTH,
    rule: VALIDATION_RULE,
};

export const DICTIONARY_DESCRIPTION_VALIDATION = {
    minLength: MIN_DESCRIPTION_LENGTH,
    maxLength: MAX_DESCRIPTION_LENGTH,
    rule: VALIDATION_RULE,
};
