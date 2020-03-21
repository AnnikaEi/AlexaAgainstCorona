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
            .speak('This is Decision Tree. I can help you find the perfect job. You can say, recommend a job.')
            .reprompt('Would you like a career or do you want to be a couch potato?')
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
            .speak('Sorry, I can\'t understand the command. Please say again.')
            .reprompt('Sorry, I can\'t understand the command. Please say again.')
            .getResponse();
    },
};

// autogenerated handlers below

/* CONSTANTS */

const skillBuilder = Alexa.SkillBuilders.custom();
const SKILL_NAME = 'Decision Tree';
const FALLBACK_MESSAGE = `The ${SKILL_NAME} skill can\'t help you with that.  It can recommend the best job for you. Do you want to start your career or be a couch potato?`;
const FALLBACK_REPROMPT = 'What can I help you with?';

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


