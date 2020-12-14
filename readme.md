# jkTextTools.js简介

根据文本中重复出现的词，以推测高频词、关键词。
By repeating rate, to get text keywords.

## Use

```javascript
let text = 'Huawei P30 vs Huawei P40. 哔哩动画哔哩看。'
jkTextTools.getWordsFromText( text );
// [{word: 'Huawei'},{word: '哔哩'}]

let text2 = `
一场疫情将线下客流骤然封锁，反而给线上生意腾出了空间，二手车线上交易也等来了“催化剂”。

中国汽车流通协会数据显示，今年3月，中国二手车市场交易量94.97万辆，交易量同比下滑24%，而3月新车销量同比下降43.3%，
一季度累计销量下降42.4%。当前，汽车保有量达2.6亿辆的中国汽车业正在从增量市场向存量市场扩大，
汽车增换购及二手车流通成为中国车市的重要增长点。
`
jkTextTools.getWordsFromText( text2 );
// [{word: '二手车'} , {word: '中国汽车'}, {word: '中国'}, {word: '汽车' }, {word: '交易'}, ... ]
```

## 打包

rollup src/main.js --file dist/jk_read_more.min.js --format umd --name "jkTextTools"
