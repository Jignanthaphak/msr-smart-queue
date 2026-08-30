// /lib/Knex/model/sex.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Sex extends Model {
  static tableName = 'sex';
  static idColumn = 'sex_id';
}
