// main.js

import domAction from './obj.domAction.js'
import wordsRepeated from './obj.wordsRepeated.js'

const jkTextTools = {
  _info: {
    v: 1.0,
  },
  _tools: {
    domAction,
    wordsRepeated,
  },

  getWordsFromText(text) {
    return wordsRepeated.autoRun(text);
  },

  getPageArticleText() {
    let text = domAction.autoFindText();
    return text;
  },
  getPageArticleWords() {
    let text = domAction.autoFindText();
    let arr = wordsRepeated.autoRun(text);
    return arr;
  },
};

export default jkTextTools