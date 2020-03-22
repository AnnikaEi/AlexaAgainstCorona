import csv
import json
import re
import unicodedata
from dataclasses import dataclass
from typing import List

_TEMPLATE_SKILL = 'templates/skill.json'
_TEMPLATE_MODEL = 'templates/model.json'
_TEMPLATE_LAMBDA = 'templates/index.js'

_MODEL = 'models/de-DE.json'
_LAMBDA = 'lambda/custom/index.js'

_INPUT_CSV = 'frage_antwort.csv'


@dataclass
class Question(object):
    frage: str
    alternativen: List[str]
    antwort: str


def read_csv():
    with open(_INPUT_CSV, mode='r') as csv_file:
        result = []
        csv_reader = csv.DictReader(csv_file, dialect='excel', delimiter=";")
        line_count = 0
        for row in csv_reader:
            if line_count == 0:
                print(f'Column names are {", ".join(row)}')
                line_count += 1
            else:
                frage = row["frage"]
                alternativen = [x.replace('?', '').replace('ß', 'ss').replace(',', '').lower() for x in
                                row["alternativen"].splitlines() if x]
                antwort = re.sub(r"\n", "", row["antwort"])
                result.append(Question(frage, alternativen, antwort))
            line_count += 1
    return result


def get_base_model():
    with open(_TEMPLATE_MODEL) as f:
        d = json.load(f)
    return d


def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])


def to_intent_name(name: str):
    name = re.sub('\W+', '', name) + 'Intent'
    return "".join(list(filter(lambda x: x.isalpha(), remove_accents(name).replace('ß', 'ss'))))


def to_handler_name(name: str):
    return f'{to_intent_name(name)}Handler'


def add_intents(base_model, questions: List[Question]):
    for q in questions:
        name = to_intent_name(q.frage)
        samples = q.alternativen
        if samples:
            base_model["interactionModel"]["languageModel"]["intents"].append({"name": name, "samples": samples})


def write_intents(model):
    with open(_MODEL, 'w', encoding='utf-8') as f:
        json.dump(model, f, ensure_ascii=False, indent=4)


handler = """
const %NAME% = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === '%INTENT%';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('%RESPONSE%')
      .getResponse();
  },
};
"""


def build_lambda(questions: List[Question]):
    handlers = []
    for q in questions:
        question_handler = re.sub(r'%NAME%', to_handler_name(q.frage), handler)
        question_handler = re.sub(r'%INTENT%', to_intent_name(q.frage), question_handler)
        question_handler = re.sub(r'%RESPONSE%', q.antwort, question_handler)
        handlers.append(question_handler)

    handlerNames = [f'{to_handler_name(x.frage)},' for x in questions]

    with open(_TEMPLATE_LAMBDA, 'r+') as fd:
        contents = fd.readlines()

    contents.insert(102, "".join(handlerNames))
    contents.insert(91, "".join(handlers))

    with open(_LAMBDA, 'w') as f:
        f.write("".join(contents))


if __name__ == '__main__':
    result = read_csv()
    base_model = get_base_model()
    add_intents(base_model, result)
    write_intents(base_model)
    build_lambda(result)
