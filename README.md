# 职位导航（jobWiki）

一个零依赖的静态「职位百科」页面：把 28 个行业分类、1098 个岗位条目整理成一页可搜索的导航，每个岗位都配一句大白话职责说明，点击即可跳转 BOSS 直聘搜索该岗位。

## 功能

- 28 个一级行业分类，共 1098 个岗位条目
- 全文搜索：同时匹配岗位名称与职责描述
- 分类导航条 + 滚动联动高亮、吸顶
- 明暗主题切换，选择记在 `localStorage`
- 无框架、无构建、无外部请求，纯单页 HTML

## 本地预览

```sh
python3 -m http.server 8000
# 打开 http://localhost:8000
```

也可以直接双击 `index.html` 打开。

## 目录结构

```
index.html                 页面结构 + 样式 + 渲染/搜索/主题脚本
data.js                    运行时数据，定义 window.JOB_DATA
categories/NN-名称.json     分类源数据，01–28 逐类一份
assets/                    品牌图标（logo.svg / logo.png）
```

## 数据格式

```json
{
  "name": "互联网/AI",
  "hidden": false,
  "hot": [{ "code": "100101", "cityCode": "101280600", "name": "Java", "href": "/c101280600-p100101/" }],
  "groups": [
    {
      "name": "后端开发",
      "positions": [
        {
          "code": "100101",
          "cityCode": "101280600",
          "name": "Java",
          "href": "/c101280600-p100101/",
          "duty": "用 Java 写后台服务……"
        }
      ]
    }
  ]
}
```

`hot` 里的 `code` 决定哪些岗位显示「热门」标签；`hidden` 为预留字段，当前页面未使用。

## 参与贡献

1. 修改 `categories/NN-名称.json` 里的分类数据。
2. 把同样的改动同步到 `data.js`（页面实际加载的是它，两者没有自动同步脚本）。
3. 本地打开页面，确认搜索、分类筛选、热门标签和总数（1098）都正常。

更多约定见 [AGENTS.md](./AGENTS.md)。

## 开源协议

[MIT](./LICENSE)
