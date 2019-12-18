// const mongoose = require("mongoose");

// const Schema = mongoose.Schema;

// const BookSchema = new Schema({
//   title: { type: String, required: true },
//   //type是对单一Author模型的引用.
//   /**
//    * 可以使用 ObjectId 模式字段来创建两个文档/模型实例间一对一的引用，
//    * （一组 ObjectIds 可创建一对多的引用）。
//    * 该字段存储相关模型的 id。
//    * 如果需要相关文档的实际内容，
//    * 可以在查询中使用 populate() 方法，
//    * 将 id 替换为实际数据。
//    */
//   author: { type: Schema.Types.ObjectId, ref: "Author", required: true },
//   summary: { type: String, required: true },
//   isbn: { type: String, required: true },
//   //type是对单一Genre模型的引用.
//   genre: [{ type: Schema.Types.ObjectId, ref: "Genre" }]
// });

// // 虚拟属性'url'：藏书 URL
// BookSchema.virtual("url").get(function() {
//   return "/catalog/book/" + this._id;
// });

// // 导出 Book 模块
// module.exports = mongoose.model("Book", BookSchema);


var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BookSchema = new Schema({
    title: {type: String, required: true},
    author: { type: Schema.ObjectId, ref: 'Author', required: true },
    summary: {type: String, required: true},
    isbn: {type: String, required: true},
    genre: [{ type: Schema.ObjectId, ref: 'Genre' }]
});

// Virtual for this book instance URL.
BookSchema
.virtual('url')
.get(function () {
  return '/catalog/book/'+this._id;
});

// Export model.
module.exports = mongoose.model('Book', BookSchema);
