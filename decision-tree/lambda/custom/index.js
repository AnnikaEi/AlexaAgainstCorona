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
        outputSpeech = err.message;
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
      && ((handlerInput.requestEnvelope.request.intent.slots.kontakt.value
        && handlerInput.requestEnvelope.request.intent.slots.kontakt.value === 'ja'
        && !handlerInput.requestEnvelope.request.intent.slots.direkt.value) ||
        (handlerInput.requestEnvelope.request.intent.slots.test.value
          && handlerInput.requestEnvelope.request.intent.slots.test.value === 'ja'
          && !handlerInput.requestEnvelope.request.intent.slots.direkt.value))
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Hast du dich in der Nähe der infizierten Person aufgehalten, während diese Krank war oder maximal zwei Tage bevor die ersten Symptome aufgetreten sind?')
      .reprompt('Hast du dich in der Nähe der infizierten Person aufgehalten, während diese Krank war oder maximal zwei Tage bevor die ersten Symptome aufgetreten sind?')
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
      .speak('Hattest du länger als 15 Minuten Kontakt mit der infizierten Person? Oder hast du Körperlüssigkeiten der infizierten Person berührt? Oder saßt du in den zwei umliegenden Reihen einer infizierten Person im Flugzeug?')
      .reprompt('Hattest du länger als 15 Minuten Kontakt mit der infizierten Person? Oder hast du Körperlüssigkeiten der infizierten Person berührt? Oder saßt du in den zwei umliegenden Reihen einer infizierten Person im Flugzeug?')
      .addElicitSlotDirective('nahe')
      .getResponse();
  }
}

const HabeIchCoronaHandlerDritteKontaktHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "HabeIchCoronaIntent"
      && ((handlerInput.requestEnvelope.request.intent.slots.kontakt.value
        && handlerInput.requestEnvelope.request.intent.slots.kontakt.value === 'nein'
        && !handlerInput.requestEnvelope.request.intent.slots.direkt.value)
        || (handlerInput.requestEnvelope.request.intent.slots.nahe.value
          && handlerInput.requestEnvelope.request.intent.slots.nahe.value === 'nein'
          && !handlerInput.requestEnvelope.request.intent.slots.dritte.value))
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Hattest du Kontakt mit einer Person welche wiederum Kontakt mit einer Infizierten Person hatte?')
      .reprompt('Hattest du Kontakt mit einer Person welche wiederum Kontakt mit einer Infizierten Person hatte?')
      .addElicitSlotDirective('dritte')
      .getResponse();
  }
}

const HabeIchCoronaHandlerKontaktFieberHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "HabeIchCoronaIntent"
      && handlerInput.requestEnvelope.request.intent.slots.dritte.value
      && handlerInput.requestEnvelope.request.intent.slots.dritte.value === 'ja'
      && !handlerInput.requestEnvelope.request.intent.slots.kontaktFieber.value
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Hatte deine Kontaktperson Symptome wie zum Beispiel Fieber?')
      .reprompt('Hatte deine Kontaktperson Symptome wie zum Beispiel Fieber?')
      .addElicitSlotDirective('kontaktFieber')
      .getResponse();
  }
}

const HabeIchCoronaHandlerTestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "HabeIchCoronaIntent"
      && handlerInput.requestEnvelope.request.intent.slots.kontaktFieber.value
      && handlerInput.requestEnvelope.request.intent.slots.kontaktFieber.value === 'ja'
      && !handlerInput.requestEnvelope.request.intent.slots.test.value
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Deine Kontaktperson sollte sich beim Gesundheitsamt melden. Warte ab wie das Testergebnis ausfällt.')
      .reprompt('Deine Kontaktperson sollte sich beim Gesundheitsamt melden. Warte ab wie das Testergebnis ausfällt.')
      .addElicitSlotDirective('test')
      .getResponse();
  }
}

const HabeIchCoronaHandlerKriterienHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "HabeIchCoronaIntent"
      && handlerInput.requestEnvelope.request.intent.slots.nahe.value
      && handlerInput.requestEnvelope.request.intent.slots.nahe.value === 'nein'
      && !handlerInput.requestEnvelope.request.intent.slots.kriterien.value
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Auf dich treffen zwar keine der eben genannten Kriterien zu, aber hast du dich trotzdem mit der infizierten Person in einem Raum aufgehalten?')
      .reprompt('Auf dich treffen zwar keine der eben genannten Kriterien zu, aber hast du dich trotzdem mit der infizierten Person in einem Raum aufgehalten?')
      .addElicitSlotDirective('kriterien')
      .getResponse();
  }
}

const CompletedHohesRisiko = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    request.dialogState = 'COMPLETED';

    return request.type === 'IntentRequest'
      && request.intent.name === 'HabeIchCoronaIntent'
      && handlerInput.requestEnvelope.request.intent.slots.nahe.value
      && handlerInput.requestEnvelope.request.intent.slots.nahe.value === 'ja';
  },
  handle(handlerInput) {

    return handlerInput.responseBuilder
      .speak("Du hast ein hohes Infektionsrisiko! Melde dich bitte umgehend beim Gesundheitsamt. Sollte dort belegt sein versuche es ein wenig später noch einmal. Solltest du Symptome entwickeln melde dich bei deinem Hausarzt, gehe aber auf keinen Fall einfach so vorbei. Bleibe in der Wohnung und distanziere dich von deinen Mitbewohnern, zum Beispiel in einem schließbaren Zimmer. Wasche dir regelmäßig die Hände und achte auf eine gute Hygiene. Am besten führst du Tagebuch über deine Körpertemperatur und deinen Gesundheitsstatus.")
      .getResponse();

  }
}

const CompletedMittleresRisiko = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'HabeIchCoronaIntent'
      && handlerInput.requestEnvelope.request.intent.slots.kriterien.value
      && handlerInput.requestEnvelope.request.intent.slots.kriterien.value === 'ja';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    request.dialogState = 'COMPLETED';
    return handlerInput.responseBuilder
      .speak("Du hast ein geringes Infektrisiko. Warte ab ob das Gesundheitsamt sich bei dir meldet. Solltest du Symptome wie zum Beispiel Husten oder Fieber entwickeln, melde dich bitte telefonisch beim Gesundheitsamt oder deinem Hausarzt. Bleibe zuhause und lass nach Möglichkeit andere für dich Einkaufen. Wasche dir regelmäßig die Hände und achte auf deine Hygiene.")
      .getResponse();

  }
}


const CompletedKeinRisiko = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    request.dialogState = 'COMPLETED';
    var dritte = (handlerInput.requestEnvelope.request.intent.slots.dritte.value &&
      handlerInput.requestEnvelope.request.intent.slots.dritte.value === 'nein');
    var kontaktFieber = (handlerInput.requestEnvelope.request.intent.slots.kontaktFieber.value === 'nein'
      && handlerInput.requestEnvelope.request.intent.slots.kontaktFieber.value === 'nein');
    var test = (handlerInput.requestEnvelope.request.intent.slots.test.value === 'nein'
      && handlerInput.requestEnvelope.request.intent.slots.test.value === 'nein');
    var kriterienNein = (handlerInput.requestEnvelope.request.intent.slots.test.value === 'nein'
      && handlerInput.requestEnvelope.request.intent.slots.test.value === 'nein');
    var keinRisiko = (dritte || kontaktFieber || test || kriterienNein || keinRisiko);

    return request.type === 'IntentRequest'
      && request.intent.name === 'HabeIchCoronaIntent'
      && keinRisiko;
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    request.dialogState = 'COMPLETED';

    return handlerInput.responseBuilder
      .speak("Das Risiko für dich infiziert zu sein ist sehr gering. Solltest du Krankheitssymptome wie zum Beispiel Husten oder Fieber bekommen kannst du dich telefonisch an deinen Hausarzt wenden. Sollte doch eine Kontaktperson infiziert sein oder Symptome entwicklen mache diesen Test am besten noch einmal. Wasche dir regelmäßig die Hände und bleibe zuhause.")
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
    HabeIchCoronaHandlerNaheHandler,
    CompletedHohesRisiko, CompletedMittleresRisiko, CompletedKeinRisiko,
    HabeIchCoronaHandlerKontaktFieberHandler,
    HabeIchCoronaHandlerDritteKontaktHandler,
    HabeIchCoronaHandlerTestHandler,
    HabeIchCoronaHandlerKriterienHandler,
    InfektionsdatenHandler,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
