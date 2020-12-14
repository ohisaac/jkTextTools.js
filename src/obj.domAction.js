// 说明：以下表述中“文章主体”不包含标题，仅正文。

let domAction = {
  // 入口方法：获取正文文本
  autoFindText: function () {
    let me = this;

    let text_box_dom = me.findDomTextBoxArr();
    return me.getTextFromTextBoxArr(text_box_dom);
  },

  // 找到正文文本的dom容器，返回数组
  findDomTextBoxArr: function () {
    let p_doms = document.querySelectorAll("p,h1,h2,h3,h4,h5,h6,ul");

    // 预定义一个数组容器，盛放有可能是文章文本容器的dom元素
    let papas = [];
    p_doms.forEach(function (p_dom) {
      let papa = p_dom.parentElement;
      let num = parseInt(papa.p_count) || 0;
      num += 1;
      papa.p_count = num;
      papas.push(papa);
    });

    // 容错
    if (papas.length === 0) return null;

    // 循环找到最有可能为文章容器的dom元素，并于循环中赋值给papa_max
    // papa_max 为循环过程中，p_count 值最大的元素
    let papa_max = papas[0] || null;
    papas.forEach(function (papa_now) {
      if (papa_now.p_count > papa_max.p_count) papa_max = papa_now;
    });

    // 进一步优化：找到连带文章大标题的，总容器
    let big_box = papa_max;
    for (let i = 1; i <= 10; i++) {
      // 1.找到大标题，得到容器：存在H1，或仅存在1个H234（多个H234认为是系列小标题，不算找到大标题）
      if (
        big_box.querySelector("h1") ||
        big_box.querySelectorAll("h2,h3,h4").length == 1
      ) {
        break;
      }

      // 2.继续找上一层
      else if (big_box.parentElement) {
        big_box = big_box.parentElement;
      }

      // 3.没找到，停止寻找：parent.parentElement 为 null
      else {
        break;
      }
    }

    // 预定义返回结果
    let res_arr = [];

    // 结果情况1：仅有papa_box文章主体时
    if (big_box === papa_max) {
      res_arr.push(big_box);
    }
    // 结果情况2：找到 总容器 以内的，正文容器（papa_max）和之前的容器：便于舍弃正文之后的内容
    else {
      // 子容器
      let big_box_children = big_box.children;
      // 首次出现标题的容器index
      let index_title = null;
      // 文章主体的容器index
      let index_papa_max = null;

      // 标题
      let ele_title = big_box.querySelector("h1,h2,h3,h4");

      for (let key in big_box_children) {
        // 转换key为index，便于计算起始位置
        let index = parseInt(key);
        if (isNaN(index)) continue;

        let item = big_box_children[index];

        // 明确标题 index
        if (item.contains(ele_title)) {
          index_title = index;
        }
        // 明确文章主体 index
        if (item.contains(papa_max)) {
          index_papa_max = index;
        }

        // 获取 标题 到 文章主体 各dom
        if (index >= index_title && index <= index_papa_max) {
          res_arr.push(item);
        }

        // 适当获取 文章主体 后一个dom的内容（可能为页脚，包含编辑人员信息）
        if (index === index_papa_max + 1 && item.innerText.length <= 250) {
          res_arr.push(item);
        }
      }
    }

    // 返回dom
    return res_arr;
  },

  // 获取文本(从数组，dom 为数组元素)
  getTextFromTextBoxArr(dom_box_arr) {
    let me = this;

    // 容错
    if (!dom_box_arr || dom_box_arr.length === 0) {
      return "遗憾：该页面未发现文章";
    }

    let text = "";
    dom_box_arr.forEach(function (item) {
      let text_sec = me.getTextFromTextBox(item);
      if (text_sec) text += text_sec + "\n\n";
    });

    // 容错
    if (text.length <= 100) {
      return "遗憾：该页面未发现文章";
    }

    return text.trim();
  },

  // 获取文本(从单个dom)
  getTextFromTextBox(dom_box) {
    // 如果没有子标签，则直接返回文本（如独立 H1 标签，没有被包裹的容器时）
    if (!dom_box.children[0]) return dom_box.innerText + "\n\n";

    // 正常情况：

    let str_selector = "p,h1,h2,h3,h4,h5,h6,ul";
    let p_doms = dom_box.querySelectorAll(str_selector);

    let text = "";
    p_doms.forEach(function (p_dom) {
      let p_text = "";
      p_text = p_dom.innerText;

      // 优化：清理分享按钮
      if (
        p_dom.tagName === "UL" &&
        p_dom.getAttribute("class").indexOf("share") >= 0
      ) {
        p_text = "";
      }

      // 无字有图的情况，取图
      if (!p_text && p_dom.querySelector("img")) {
        let imgs = p_dom.querySelectorAll("img");
        let img_src_text = "";
        imgs.forEach(function (item) {
          img_src_text += ` ${item.src}`;
        });
        p_text += `([*配图:${img_src_text}])`;
      }

      // 累加
      if (p_text.trim() !== "") {
        text += p_text + "\n\n";
      }
    });

    return text;
  },
};

// domAction.autoFindText();
export default domAction;
