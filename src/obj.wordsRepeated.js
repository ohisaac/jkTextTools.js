let wordsRepeated = {
  // ###########################
  // 以下为主方法
  autoRun(text) {
    let me = this;

    // 预处理文本
    text = me.preSetText(text);

    // 配置初始数据
    me.data.text = text;
    me.data.text_remain = text;
    me.data.res_temp = {};
    me.data.num_loop_count = 0;

    // 优化配置
    if (text.length <= 200) {
      me.cfg.num_on_recognize = 2;
    } else if (text.length >= 1000) {
      me.cfg.num_on_recognize = 4;
    }

    // 循环取词
    me.mainLoop();

    // 返回数据
    return me.formatRes();
  },

  // 循环首位取词和调整text_remain的方法
  mainLoop() {
    let me = this;

    // 清空首位符号
    for (let item of me.marks.char_split) {
      if (me.data.text_remain.indexOf(item) === 0) {
        me.data.text_remain = me.data.text_remain.replace(item, "");
      }
    }

    // 取得文本段0位首词，或 ''
    let head_word_expected = me.getHeadWord();

    // 判断 text_remain 文本处理完毕，循环结束
    if (me.data.text_remain.length === 0) {
      return;
    }

    // 如果未取到0位首词，text_remain 去除首位字符，继续投入循环
    if (!head_word_expected) {
      // me.data.text_remain = me.data.text_remain.substr(1).trim();
    }
    // 如果取到了0位首词，记录该词
    else {
      // 记录
      if (!me.data.res_temp[head_word_expected]) {
        if (me.cfg.dev_on_log)
          console.log("%c ▶ 新 word: " + head_word_expected, "color: #185;");

        let count = me.data.text.split(head_word_expected).length - 1;
        me.data.res_temp[head_word_expected] = count;
      } else {
        if (me.cfg.dev_on_log)
          console.log("%c ▶ 旧 word: " + head_word_expected, "color: #185;");
      }
    }

    // 核心操作：剩余文字存储
    // 注意，这里必须要 “- 1”，多留出上一个字符的判断（汉语断句问题）。
    let index_restart = me.data.on_head_string.length - 1;
    index_restart = index_restart >= 1 ? index_restart : 1;
    me.data.text_remain = me.data.text_remain.substr(index_restart).trim();

    // 继续循环查找
    me.mainLoop();
  },

  // 格式化输出
  formatRes() {
    let me = this;

    let arr = [];
    for (let key in me.data.res_temp) {
      let num_count = me.data.res_temp[key];

      let item = {
        word: key,
        count: num_count,
        weight: num_count * (key.length >= 7 ? 7 : key.length),
      };
      arr.push(item);
    }

    return arr.sort((a, b) => b.weight - a.weight);
  },

  // 预处理传入文本
  preSetText(text) {
    // 清除如 "([*插图： ...])"" 类插入类的文本
    let reg_texx_inserted = /\(\[\*(.*?)\]\)/g;
    let res = text.replace(reg_texx_inserted, "");
    return res;
  },

  // ###########################
  // 以下为数据和配置等

  // 数据记录部分
  data: {
    // 全文
    text: "",
    // 剩余文本
    text_remain: "",
    // 最近一个被检查的0位string，用于 mainloop 结束时抹除首位
    on_head_string: "",
    //
    on_head_line: "",

    // 结果暂存，词汇计数用，如 {'我们': 3}
    res_temp: {},

    // loop_count
    num_loop_count: 0,
  },

  // 标记符号和标点
  marks: {
    char_split: [
      ", ",
      ". ",
      ": ",
      "? ",
      "! ",
      "、",
      "，",
      "。",
      "：",
      "？",
      "！",
      "~",
      "——",
      //Tab符
      "	",
      "#",
      "\n",
    ],
    char_quote: {
      "‘": "’",
      '"': '"',
      "“": "”",
      "<": ">",
      "《": "》",
      "「": "」",
      "『": "』",
      "[": "]",
      "【": "】",
      "(": ")",
      "（": "）",
    },
  },

  // 配置部分
  cfg: {
    // 达到识别取词的重复次数
    num_on_recognize: 3,
    // 循环取词时，拟定的单词的最长长度、最短长度（汉语词一般2~7长度，网址等可能50长度，暂定50）
    length_word_max: 50,
    length_word_min: 2,
    // 达到粘合识别的空格比例，英语的话基本在 0.08 ~ 0.16 区间
    num_space_rate: 0.08,

    //
    dev_on_log: false,
  },

  // ###########################
  // 以下为工具类方法

  // 获取字符串开头的单词
  getHeadWord() {
    let me = this;

    // 获取首句 text.
    let text_head_line = me.getHeadLine(me.data.text_remain);

    // 获取首句空格率
    let num_space_rate = me.calcSpaceRate(text_head_line);

    // 00情况：如果该句开头已经匹配了已有词汇，则跳过
    if (me.getHeadWord_subFunction_headWordChecked()) {
      return "";
    }

    // 01情况：如果该句已经只剩1个字符，如text_remain为“的，我们才...”时，则直接返回'',来跳过该字符
    if (text_head_line.length <= 1) {
      return "";
    }

    // 02情况：如果开头是数字（如：2012年... 、1000万人口...）：整个数字取出
    else if (me.matchHeadNumber(text_head_line)) {
      let num_temp = me.matchHeadNumber(text_head_line);

      // 记录
      me.data.on_head_string = num_temp;

      // 如果小于3个字符，则放弃该单词（如she he and for）
      if (num_temp.length <= 3) return "";

      return me.getHeadWord_subFunction_verifyWord(num_temp);
    }

    // 03情况：如果空格出现频繁（如英语时），按照空格断词：取第一个空格之前的文本为 headword
    else if (num_space_rate >= me.cfg.num_space_rate) {
      let head_str = text_head_line.substr(0, text_head_line.indexOf(" "));

      // 记录
      me.data.on_head_string = head_str;

      // 如果小于3个字符，则放弃该单词（如she he and for）
      if (head_str.length <= 3) return "";

      return me.getHeadWord_subFunction_verifyWord(head_str);
    }

    // 04情况：否则循环取词（如汉语时）
    else {
      let max = me.cfg.length_word_max;
      let min = me.cfg.length_word_min;

      // 拟定返回值
      let res_str = "";

      for (let i = min; i <= max; i++) {
        // ↑ i 在这里代表取词length
        let head_str = text_head_line.substr(0, i);
        
        // 记录
        me.data.on_head_string = head_str;

        // 【如果】向后粘合，跳过本次首词判断，继续向后
        let str = text_head_line.charAt(i - 1) + text_head_line.charAt(i);
        let reg_sticky_eng = /^[A-Za-z]+$/;
        let reg_sticky_num = /^[0-9]+$/;
        if (reg_sticky_eng.test(str) || reg_sticky_num.test(str)) {
          continue;
        }

        // 进行常规判断
        if (me.getHeadWord_subFunction_verifyWord(head_str)) {
          res_str = head_str;

          // 单词已经扩大到句尾，则停止循环
          if (res_str === text_head_line) break;
        } else {
          break;
        }
      }

      return res_str;
    }
  },
  getHeadWord_subFunction_verifyWord(str_expected) {
    // 此方法计算 str_expected 在 text_remain 中的数量，达到数量返回 str_expected，否则返回空

    let me = this;

    // 循环统计计数
    me.data.num_loop_count += 1;

    // 容错
    if(!str_expected || str_expected.trim().length <2){
      return ''
    }

    let reg_head_str = new RegExp(me.transStringForReg(str_expected), "g");
    let num_repeated = me.data.text.match(reg_head_str)
      ? me.data.text.match(reg_head_str).length
      : 0;

    // log
    if (me.cfg.dev_on_log) {
      console.log(
        "fn verifyWord - reg_head_str: " +
          reg_head_str +
          ", num_repeated: " +
          num_repeated +
          (num_repeated >= me.cfg.num_on_recognize ? ", try next" : ", stoped")
      );
    }

    // 返回
    if (num_repeated >= me.cfg.num_on_recognize) {
      return str_expected;
    } else {
      return "";
    }
  },
  getHeadWord_subFunction_headWordChecked() {
    // 返回句首已存在的词，或者 ''
    let me = this;
    let res = "";
    for (let key in me.data.res_temp) {
      if (me.data.on_head_line.indexOf(key) === 0) {
        res = key;

        // 记录
        me.data.on_head_string = key;

        break;
      }
    }
    return res;
  },

  // 获取字符串的首句（根据第一次出现的断句标点符号）
  getHeadLine(text) {
    let me = this;

    // 默认最多读取100位
    let index = 100;

    for (let i in text) {
      i = parseInt(i);

      if (i >= 20) break;

      let char1 = text.charAt(i);
      let char2 = text.charAt(i) + text.charAt(i + 1);

      let arr_char_split = me.marks.char_split;
      let arr_char_quote = [];
      for (let key in me.marks.char_quote) {
        arr_char_quote.push(key);
        arr_char_quote.push(me.marks.char_quote[key]);
      }

      // 找到最近的 char_split 字符，作为断句index。
      if (
        arr_char_quote.indexOf(char1) >= 0 ||
        arr_char_split.indexOf(char1) >= 0 ||
        arr_char_split.indexOf(char2) >= 0
      ) {
        index = i;
        break;
      }
    }

    let res = text.substr(0, index);

    if (me.cfg.dev_on_log) console.log("fn getHeadLin output: " + res);

    return res;
  },

  // 计算一段文字的空格率。（一般用于首句的空格率检查，根据空格率取首词）
  calcSpaceRate(text) {
    let me = this;

    // 容错，避免出现length长度为0的分母
    text = text || "_";

    let reg_space = / /g;
    let arr_match = text.match(reg_space) || [];
    let current_space_rate = arr_match.length / text.length;

    return current_space_rate;
  },

  // 匹配取出开头的字符串，给 getHeadWord() 使用
  matchHeadNumber(text) {
    // reg_num: 数字、数字ip地址等，均可匹配
    let reg_num = /^\d+([\.,-]\d+)*/;
    let match = text.match(reg_num);
    if (match) {
      return match[0];
    } else {
      return "";
    }
  },

  // ###########################
  // 以下为更基础类的工具类方法
  transStringForReg(str) {
    let res = str;
    let marks = "\\^$.*+?()[]{}|";
    marks = marks.split("");
    for (let i in marks) {
      let mark = marks[i];
      let reg = new RegExp("\\" + mark, "g");
      res = res.replace(reg, "\\$&");
    }
    return res;
  },
};

export default wordsRepeated;
