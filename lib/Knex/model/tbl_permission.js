// /lib/Knex/model/tbl_permission.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Tbl_permission extends Model {
  static tableName = 'tbl_permission';
  static idColumn = 'tbl_permission';
}
