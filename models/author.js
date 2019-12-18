var moment = require("moment");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, max: 100 },
  family_name: { type: String, required: true, max: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date }
});
//虚拟属性'name':表示作者全名
AuthorSchema.virtual("name").get(function() {
  return this.family_name + ", " + this.first_name;
});
//虚拟属性'lifesapn':作者寿命
AuthorSchema.virtual("lifespan").get(function() {
  if (this.date_of_death && this.date_of_birth) {
    return (
      this.date_of_death.getYear() - this.date_of_birth.getYear()
    ).toString();
  } else {
    return "";
  }
});
//虚拟属性'url':作者URL
AuthorSchema.virtual("url").get(function() {
  return "/catalog/author/" + this._id;
});
//虚拟属性’date_born‘
AuthorSchema.virtual("date_born").get(function() {
  return this.date_of_birth
    ? moment(this.date_of_birth).format("MMMM Do, YYYY")
    : "";
});
//虚拟属性’date_die‘
AuthorSchema.virtual("date_die").get(function() {
  return this.date_of_death
    ? moment(this.date_of_death).format("MMMM Do, YYYY")
    : "";
});
//用于表单显示
AuthorSchema.virtual("date_of_birth_yyyy_mm_dd").get(function() {
  return moment(this.date_of_birth).format("YYYY-MM-DD");
});

AuthorSchema.virtual("date_of_death_yyyy_mm_dd").get(function() {
  return moment(this.date_of_death).format("YYYY-MM-DD");
});
//导出Author模型
module.exports = mongoose.model("Author", AuthorSchema);
