/**

    Copyright 2017-2019 Amazon.com, Inc. and its affiliates. All Rights Reserved.
    Licensed under the Amazon Software License (the "License").
    You may not use this file except in compliance with the License.
    A copy of the License is located at
      http://aws.amazon.com/asl/
    or in the "license" file accompanying this file. This file is distributed
    on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
    or implied. See the License for the specific language governing
    permissions and limitations under the License.

    This skill demonstrates how to use Dialog Management to delegate slot
    elicitation to Alexa. For more information on Dialog Directives see the
    documentation: https://developer.amazon.com/docs/custom-skills/dialog-interface-reference.html

    This skill also uses entity resolution to define synonyms. Combined with
    dialog management, the skill can ask the user for clarification of a synonym
    is mapped to two slot values.
 **/

/* eslint-disable  func-names */
/* eslint-disable  no-restricted-syntax */
/* eslint-disable  no-loop-func */
/* eslint-disable  consistent-return */
/* eslint-disable  no-console */

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

const InfektionsdatenHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
      || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'InfektionsdatenIntent');
  },
  async handle(handlerInput) {
    let outputSpeech = 'This is the default message.';
	
	
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	var yyyy = today.getFullYear();

	today = yyyy + '-' + mm + '-' + dd;
	
	var link = `https://covid-api.com/api/reports?date=${today}&q=Germany`;

    await getRemoteData(link)
      .then((response) => {
        const data = JSON.parse(response);
        outputSpeech = `In sind ${data.confirmed} Menschen in Deutschland als infiziert gemeldet worden.`;

      })
      .catch((err) => {
        //set an optional error message here
        //outputSpeech = err.message;
      });

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .getResponse();

  },
};


const StartedInProgressHabeIchCoronaHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "HabeIchCoronaIntent"
      && handlerInput.requestEnvelope.request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .addDelegateDirective()
      .getResponse();
  }
}

const HabeIchCoronaHandlerDirektKontaktHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "HabeIchCoronaIntent"
      && handlerInput.requestEnvelope.request.intent.slots.kontakt.value
      && handlerInput.requestEnvelope.request.intent.slots.kontakt.value === 'ja'
      && !handlerInput.requestEnvelope.request.intent.slots.direkt.value
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
    .speak('Haben sie sich vor den ersten symptomen in ihrer nähe befunden?')
    .reprompt('Haben sie sich vor den ersten symptomen in ihrer nähe befunden?')
    .addElicitSlotDirective('direkt')
    .getResponse();
  }
}

const HabeIchCoronaHandlerNaheHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "HabeIchCoronaIntent"
      && handlerInput.requestEnvelope.request.intent.slots.direkt.value
      && handlerInput.requestEnvelope.request.intent.slots.direkt.value === 'ja'
      && !handlerInput.requestEnvelope.request.intent.slots.nahe.value
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
    .speak('Direkter kontakt?')
    .reprompt('Direkter kontakt')
    .addElicitSlotDirective('nahe')
    .getResponse();
  }
}

const HabeIchCoronaHandlerHohesRisikoHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "HabeIchCoronaIntent"
      && handlerInput.requestEnvelope.request.intent.slots.nahe.value
      && handlerInput.requestEnvelope.request.intent.slots.nahe.value === 'ja'
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
    .speak('ALARM!!!')
    .getResponse();
  }
}

const HabeIchCoronaHandlerDritteKontaktHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "HabeIchCoronaIntent"
      && handlerInput.requestEnvelope.request.intent.slots.kontakt.value
      && handlerInput.requestEnvelope.request.intent.slots.kontakt.value === 'nein'
      && !handlerInput.requestEnvelope.request.intent.slots.direkt.value
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
    .speak('Eine Person die sie kennen hatte Kontakt?')
    .reprompt('Eine Person die sie kennen hatte Kontakt?')
    .addElicitSlotDirective('dritte')
    .getResponse();
  }
}


const CompletedHabeIchCoronaIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'HabeIchCoronaIntent'
      && request.dialogState === 'COMPLETED';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Ergebnis wird berechnet")
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

/* CONSTANTS */

const skillBuilder = Alexa.SkillBuilders.custom();
const SKILL_NAME = 'Decision Tree';
const FALLBACK_MESSAGE = `The ${SKILL_NAME} skill can\'t help you with that.  It can recommend the best job for you. Do you want to start your career or be a couch potato?`;
const FALLBACK_REPROMPT = 'What can I help you with?';

const requiredSlots = [
  'preferredSpecies',
  'bloodTolerance',
  'personality',
  'salaryImportance',
];


/* HELPER FUNCTIONS */

function getSlotValues(filledSlots) {
  const slotValues = {};

  console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
  Object.keys(filledSlots).forEach((item) => {
    const name = filledSlots[item].name;

    if (filledSlots[item] &&
      filledSlots[item].resolutions &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
      switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        case 'ER_SUCCESS_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
            isValidated: true,
          };
          break;
        case 'ER_SUCCESS_NO_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].value,
            isValidated: false,
          };
          break;
        default:
          break;
      }
    } else {
      slotValues[name] = {
        synonym: filledSlots[item].value,
        resolved: filledSlots[item].value,
        isValidated: false,
      };
    }
  }, this);

  return slotValues;
}

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    StartedInProgressHabeIchCoronaHandler,
    HabeIchCoronaHandlerDirektKontaktHandler,
    HabeIchCoronaHandlerDritteKontaktHandler,
    HabeIchCoronaHandlerNaheHandler,
    HabeIchCoronaHandlerHohesRisikoHandler,
    CompletedHabeIchCoronaIntent,
	InfektionsdatenHandler
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
