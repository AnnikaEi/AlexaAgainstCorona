const Alexa = require('ask-sdk-core');

/* INTENT HANDLERS */

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Hallo! Du kannst mich alles zu Corona fragen.')
            .reprompt('Stell mir eine Frage!')
            .getResponse();
    },
};

const FallbackHandler = {
    // 2018-Nov-21: AMAZON.FallackIntent is currently available in en-* and de-DE locales.
    //              This handler will not be triggered except in those locales, so it can be
    //              safely deployed here in the code for any locale.
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(FALLBACK_MESSAGE)
            .reprompt(FALLBACK_REPROMPT)
            .getResponse();
    },
};

const HelpHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Stell mir eine Frage.')
            .reprompt('Stell mir eine Frage.')
            .getResponse();
    },
};

const ExitHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.CancelIntent'
                || request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Bye')
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};


const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Das habe ich nicht verstanden. Bitte wiederhole deine Frage.')
            .reprompt('Das habe ich nicht verstanden. Bitte wiederhole deine Frage.')
            .getResponse();
    },
};

// autogenerated handlers below

/* CONSTANTS */

const skillBuilder = Alexa.SkillBuilders.custom();
const SKILL_NAME = 'AlexaAgainsCorona';
const FALLBACK_MESSAGE = ` ${SKILL_NAME} kann dir das leider nicht beantworten.`;
const FALLBACK_REPROMPT = 'Wie kann ich dir helfen?';

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        // insert autogenerated handler names below here
        HelpHandler,
        ExitHandler,
        FallbackHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();


